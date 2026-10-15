export type RAGStrategy = 
  | 'vector_semantic' 
  | 'vector_hybrid' 
  | 'graph_rag' 
  | 'filesystem_rag'
  | 'rlm_rag'
  | 'google_vertex_search';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type ReviewStatus = 'unreviewed' | 'verified_correct' | 'judge_incorrect' | 'disputed';

export type FailureCategory = 
  | 'retrieval_starvation'      // Gold context missing from corpus / retriever
  | 'context_dilution'         // Chunk retrieved but ranked too low (needle-in-haystack)
  | 'conflicting_sources'       // Multiple chunks present contradictory facts
  | 'generator_hallucination'   // Context contained info, but LLM hallucinated
  | 'negative_constraint_fail'  // Model failed to acknowledge absence of context
  | 'none';                     // Passed without failure

export interface CitationSpan {
  chunkId: string;
  chunkTitle: string;
  sourceFile: string;
  similarityScore: number;
  matchedText: string;
}

export interface ClaimVerification {
  id: string;
  sentence: string;
  status: 'fully_supported' | 'unsupported' | 'partially_supported' | 'contradicted';
  confidence: number;
  supportingChunkIds: string[];
  reasoning: string;
}

export interface RetrievedChunk {
  id: string;
  source: string;
  chunkIndex: number;
  score: number; // e.g. cosine / RRF score
  text: string;
  isGoldEvidence?: boolean;
}

export interface DeterministicMetrics {
  tokenF1: number;
  rougeL: number;
  exactMatch: boolean;
  lexicalPrecision: number;
  lexicalRecall: number;
  contextLexicalOverlap: number; // % of gold words present in retrieved chunks
  citationGroundingRatio: number; // % of claims with verified context citations
  answerLengthWords: number;
}

export interface JudgeMetrics {
  faithfulness: number;         // Hallucination risk (0-1)
  faithfulnessReason: string;
  answerRelevancy: number;      // On-topic and useful (0-1)
  relevancyReason: string;
  contextualPrecision: number;  // Are best chunks ranked first? (0-1)
  precisionReason: string;
  contextualRecall: number;     // Did retrieval find all facts? (0-1)
  recallReason: string;
  gEvalCorrectness: number;     // Semantic correctness vs gold (0-1)
  gEvalReason: string;
  judgeConfidence: number;      // Uncertainty estimation (0-1)
}

export interface HumanReview {
  status: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  overriddenScore?: {
    faithfulness?: number;
    gEvalCorrectness?: number;
  };
}

export interface TestCaseResult {
  id: string;
  testSetId: string;
  question: string;
  expectedAnswer: string;
  generatedAnswer: string;
  difficulty: QuestionDifficulty;
  ragStrategy: RAGStrategy;
  modelName: string;
  latencySeconds: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  retrievedChunks: RetrievedChunk[];
  claims: ClaimVerification[];
  deterministic: DeterministicMetrics;
  judge: JudgeMetrics;
  failureCategory: FailureCategory;
  failureDetails?: string;
  suggestedFix?: string;
  humanReview: HumanReview;
}

export interface ModelPricing {
  promptCostPer1M: number;
  completionCostPer1M: number;
  provider: string;
  contextWindow: number;
  speedTier: 'ultra_fast' | 'fast' | 'balanced' | 'quality_heavy';
}

export interface EvaluationRun {
  id: string;
  name: string;
  createdAt: string;
  datasetVersion: string;
  datasetName: string;
  totalCases: number;
  ragStrategy: RAGStrategy;
  modelName: string;
  embeddingModel: string;
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  averageScores: {
    faithfulness: number;
    answerRelevancy: number;
    contextualPrecision: number;
    contextualRecall: number;
    gEvalCorrectness: number;
    tokenF1: number;
    rougeL: number;
    citationGroundingRatio: number;
  };
  performance: {
    p50LatencySec: number;
    p95LatencySec: number;
    avgLatencySec: number;
    totalCostUsd: number;
    costPer1kQueries: number;
    totalTokens: number;
    errorRatePercent: number;
  };
  failureCounts: Record<FailureCategory, number>;
  uncertainCount: number;
  results: TestCaseResult[];
}

export interface QualityGateRule {
  id: string;
  name: string;
  metric: keyof EvaluationRun['averageScores'] | 'p95LatencySec' | 'costPer1kQueries' | 'hallucinationRate';
  operator: '>=' | '<=' | '>';
  threshold: number;
  description: string;
  severity: 'error' | 'warning';
}

export interface QualityGateEvaluation {
  rule: QualityGateRule;
  actualValue: number;
  passed: boolean;
  message: string;
}

export interface RemediationItem {
  id: string;
  title: string;
  targetCategory: FailureCategory;
  description: string;
  prescribedAction: string;
  configurationChange: Record<string, any>;
  expectedMetricImpact: string;
  affectedCasesCount: number;
}
