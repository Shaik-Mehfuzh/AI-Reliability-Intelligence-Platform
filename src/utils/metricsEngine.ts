import { 
  DeterministicMetrics, 
  JudgeMetrics, 
  ModelPricing, 
  QualityGateRule, 
  QualityGateEvaluation, 
  EvaluationRun,
  ClaimVerification,
  RetrievedChunk,
  FailureCategory
} from '../types/reliability';

/**
 * Standard Tokenizer (lowercases, removes punctuation, splits by whitespace)
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Compute Token Precision, Recall, and F1 between hypothesis and reference
 */
export function computeTokenF1(hypothesis: string, reference: string): { precision: number; recall: number; f1: number } {
  const hypTokens = tokenize(hypothesis);
  const refTokens = tokenize(reference);

  if (hypTokens.length === 0 || refTokens.length === 0) {
    const isBothEmpty = hypTokens.length === 0 && refTokens.length === 0;
    return { precision: isBothEmpty ? 1.0 : 0.0, recall: isBothEmpty ? 1.0 : 0.0, f1: isBothEmpty ? 1.0 : 0.0 };
  }

  const refFreq: Record<string, number> = {};
  for (const token of refTokens) {
    refFreq[token] = (refFreq[token] || 0) + 1;
  }

  let commonTokens = 0;
  const hypFreq: Record<string, number> = {};
  for (const token of hypTokens) {
    hypFreq[token] = (hypFreq[token] || 0) + 1;
  }

  for (const [token, count] of Object.entries(hypFreq)) {
    if (refFreq[token]) {
      commonTokens += Math.min(count, refFreq[token]);
    }
  }

  const precision = commonTokens / hypTokens.length;
  const recall = commonTokens / refTokens.length;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
  };
}

/**
 * Compute ROUGE-L score based on Longest Common Subsequence (LCS)
 */
export function computeRougeL(hypothesis: string, reference: string): number {
  const s1 = tokenize(hypothesis);
  const s2 = tokenize(reference);
  const m = s1.length;
  const n = s2.length;

  if (m === 0 || n === 0) return 0;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs = dp[m][n];
  const p = lcs / m;
  const r = lcs / n;
  if (p + r === 0) return 0;
  return Number(((2 * p * r) / (p + r)).toFixed(4));
}

/**
 * Compute Context Lexical Overlap (% of reference key tokens found in retrieved context)
 */
export function computeContextCoverage(reference: string, contexts: string[]): number {
  const refTokens = Array.from(new Set(tokenize(reference).filter(t => t.length > 2))); // ignore stopwords < 3 chars
  if (refTokens.length === 0) return 1.0;

  const combinedContext = contexts.join(' ').toLowerCase();
  let found = 0;
  for (const token of refTokens) {
    if (combinedContext.includes(token)) {
      found++;
    }
  }
  return Number((found / refTokens.length).toFixed(4));
}

/**
 * Parse generated text into individual claim sentences and match with retrieved context
 */
export function parseAndVerifyClaims(
  generatedAnswer: string,
  retrievedChunks: RetrievedChunk[]
): ClaimVerification[] {
  // Split into sentences
  const rawSentences = generatedAnswer
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const claims: ClaimVerification[] = [];
  const fullContext = retrievedChunks.map(c => c.text.toLowerCase());

  rawSentences.forEach((sentence, idx) => {
    const sTokens = tokenize(sentence).filter(t => t.length > 3);
    const supportingChunkIds: string[] = [];

    retrievedChunks.forEach(chunk => {
      const chunkText = chunk.text.toLowerCase();
      let matchCount = 0;
      for (const token of sTokens) {
        if (chunkText.includes(token)) {
          matchCount++;
        }
      }
      const matchRatio = sTokens.length > 0 ? matchCount / sTokens.length : 0;
      if (matchRatio >= 0.45) {
        supportingChunkIds.push(chunk.id);
      }
    });

    let status: ClaimVerification['status'] = 'unsupported';
    let reasoning = 'No retrieved passages contain lexical support for this claim.';
    let confidence = 0.55;

    if (supportingChunkIds.length > 0) {
      if (supportingChunkIds.length >= 2 || sTokens.length <= 4) {
        status = 'fully_supported';
        reasoning = `Directly corroborated by retrieved context chunk(s): ${supportingChunkIds.join(', ')}.`;
        confidence = 0.92;
      } else {
        status = 'partially_supported';
        reasoning = `Partially grounded in chunk ${supportingChunkIds[0]}, but contains inferred qualifiers.`;
        confidence = 0.74;
      }
    } else {
      // Check if it's a disclaimer like "Based on the provided context..."
      if (sentence.toLowerCase().includes('not mentioned') || sentence.toLowerCase().includes('does not provide')) {
        status = 'fully_supported';
        reasoning = 'Acknowledges boundaries of provided context.';
        confidence = 0.88;
      }
    }

    claims.push({
      id: `claim-${idx + 1}`,
      sentence,
      status,
      confidence,
      supportingChunkIds,
      reasoning
    });
  });

  return claims;
}

/**
 * Calculate cost in USD given model pricing
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  pricing: ModelPricing
): number {
  const promptCost = (promptTokens * pricing.promptCostPer1M) / 1_000_000;
  const completionCost = (completionTokens * pricing.completionCostPer1M) / 1_000_000;
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Quality Gate Evaluation Engine
 */
export function evaluateQualityGate(run: EvaluationRun, rules: QualityGateRule[]): QualityGateEvaluation[] {
  return rules.map(rule => {
    let actualValue = 0;
    
    if (rule.metric === 'p95LatencySec') {
      actualValue = run.performance.p95LatencySec;
    } else if (rule.metric === 'costPer1kQueries') {
      actualValue = run.performance.costPer1kQueries;
    } else if (rule.metric === 'hallucinationRate') {
      actualValue = Number((1.0 - run.averageScores.faithfulness).toFixed(3));
    } else if (rule.metric in run.averageScores) {
      actualValue = run.averageScores[rule.metric as keyof EvaluationRun['averageScores']];
    }

    let passed = false;
    if (rule.operator === '>=') {
      passed = actualValue >= rule.threshold;
    } else if (rule.operator === '<=') {
      passed = actualValue <= rule.threshold;
    } else if (rule.operator === '>') {
      passed = actualValue > rule.threshold;
    }

    const message = passed 
      ? `PASSED: ${rule.name} scored ${actualValue} (threshold: ${rule.operator} ${rule.threshold})`
      : `FAILED: ${rule.name} scored ${actualValue}, violating threshold of ${rule.operator} ${rule.threshold}`;

    return {
      rule,
      actualValue,
      passed,
      message
    };
  });
}
