import { EvaluationRun, ModelPricing, QualityGateRule, RemediationItem } from '../types/reliability';

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-2.5-flash': {
    promptCostPer1M: 0.15,
    completionCostPer1M: 0.60,
    provider: 'Google Cloud Vertex AI',
    contextWindow: 1000000,
    speedTier: 'ultra_fast'
  },
  'gpt-4o-mini': {
    promptCostPer1M: 0.15,
    completionCostPer1M: 0.60,
    provider: 'OpenAI / OpenRouter',
    contextWindow: 128000,
    speedTier: 'ultra_fast'
  },
  'gpt-4o': {
    promptCostPer1M: 2.50,
    completionCostPer1M: 10.00,
    provider: 'OpenAI',
    contextWindow: 128000,
    speedTier: 'balanced'
  },
  'claude-3-5-sonnet': {
    promptCostPer1M: 3.00,
    completionCostPer1M: 15.00,
    provider: 'Anthropic',
    contextWindow: 200000,
    speedTier: 'balanced'
  },
  'llama-3-8b-instruct': {
    promptCostPer1M: 0.05,
    completionCostPer1M: 0.08,
    provider: 'Self-Hosted / vLLM',
    contextWindow: 32000,
    speedTier: 'fast'
  }
};

export const DEFAULT_QUALITY_GATES: QualityGateRule[] = [
  {
    id: 'qg-1',
    name: 'Minimum Faithfulness (Hallucination SLA)',
    metric: 'faithfulness',
    operator: '>=',
    threshold: 0.85,
    description: 'Ensure at least 85% of generated statements are strictly derived from retrieved evidence.',
    severity: 'error'
  },
  {
    id: 'qg-2',
    name: 'Minimum Answer Relevancy',
    metric: 'answerRelevancy',
    operator: '>=',
    threshold: 0.80,
    description: 'Ensure responses directly satisfy the query intent without topic drift.',
    severity: 'error'
  },
  {
    id: 'qg-3',
    name: 'Contextual Recall (Evidence Coverage)',
    metric: 'contextualRecall',
    operator: '>=',
    threshold: 0.75,
    description: 'Require retriever to surface sufficient factual backing for the expected answer.',
    severity: 'warning'
  },
  {
    id: 'qg-4',
    name: 'Max P95 Query Latency',
    metric: 'p95LatencySec',
    operator: '<=',
    threshold: 3.0,
    description: 'Ensure 95% of customer queries complete in under 3.0 seconds.',
    severity: 'warning'
  },
  {
    id: 'qg-5',
    name: 'Economic Feasibility Cost Cap',
    metric: 'costPer1kQueries',
    operator: '<=',
    threshold: 2.50,
    description: 'Ensure blended cost does not exceed $2.50 per 1,000 queries.',
    severity: 'error'
  }
];

export const REMEDIATION_CATALOG: RemediationItem[] = [
  {
    id: 'rem-1',
    title: 'Reciprocal Rank Fusion (RRF) Hybrid Search',
    targetCategory: 'retrieval_starvation',
    description: 'Dense vector search alone missed exact numerical identifiers and statutory codes in 42% of legal queries.',
    prescribedAction: 'Switch index to vector_hybrid (Qdrant + FastEmbed BM25) with alpha=0.6 dense / 0.4 sparse fusion.',
    configurationChange: { strategy: 'vector_hybrid', alpha: 0.6, topK: 8 },
    expectedMetricImpact: '+18.4% Contextual Recall, -62% Retrieval Starvation',
    affectedCasesCount: 4
  },
  {
    id: 'rem-2',
    title: 'Dynamic Chunk Resizing & Overlap Expansion',
    targetCategory: 'context_dilution',
    description: 'Target evidence was split across chunk boundaries or drowned out in 1,200 token oversized chunks.',
    prescribedAction: 'Reduce chunk size to 512 tokens and increase overlap to 128 tokens with semantic boundary preservation.',
    configurationChange: { chunkSize: 512, chunkOverlap: 128 },
    expectedMetricImpact: '+12.1% Contextual Precision, -45% Needle-in-Haystack dropoffs',
    affectedCasesCount: 3
  },
  {
    id: 'rem-3',
    title: 'Strict Grounding System Prompt & Citation Mandate',
    targetCategory: 'generator_hallucination',
    description: 'Model answered plausible but fabricated details when retrieved passages had slight ambiguity.',
    prescribedAction: 'Inject strict citation syntax [Chunk X] and explicit instruction: "If facts are not explicitly documented, output Context Insufficient."',
    configurationChange: { systemPromptMode: 'strict_citation_with_abstention', temperature: 0.1 },
    expectedMetricImpact: '+15.2% Faithfulness, -80% Unsupported Claims',
    affectedCasesCount: 5
  },
  {
    id: 'rem-4',
    title: 'Temporal Cross-Source Disambiguation Filter',
    targetCategory: 'conflicting_sources',
    description: 'Retrieved older 2021 regulatory clauses alongside 2024 revised amendments without timestamp weighting.',
    prescribedAction: 'Add metadata filter sorting by effective_date DESC and include version banner in prompt.',
    configurationChange: { metadataFilters: { enforceRecency: true, maxAgeDays: 730 } },
    expectedMetricImpact: '+22.0% G-Eval Correctness on multi-version corpus',
    affectedCasesCount: 2
  }
];

export const SAMPLE_EXPERIMENTS: EvaluationRun[] = [
  {
    id: 'run-legal-hybrid-v1',
    name: 'Legal RAG Bench - Hybrid (Qdrant + FastEmbed BM25)',
    createdAt: '2026-10-12 14:32:00',
    datasetVersion: 'v2.0-legal-bench',
    datasetName: 'Isaacus Legal RAG Benchmark (Statutes & Precedents)',
    totalCases: 6,
    ragStrategy: 'vector_hybrid',
    modelName: 'gemini-2.5-flash',
    embeddingModel: 'text-embedding-3-small + BM25',
    topK: 6,
    chunkSize: 512,
    chunkOverlap: 128,
    averageScores: {
      faithfulness: 0.912,
      answerRelevancy: 0.934,
      contextualPrecision: 0.887,
      contextualRecall: 0.892,
      gEvalCorrectness: 0.905,
      tokenF1: 0.841,
      rougeL: 0.812,
      citationGroundingRatio: 0.933
    },
    performance: {
      p50LatencySec: 0.95,
      p95LatencySec: 1.82,
      avgLatencySec: 1.12,
      totalCostUsd: 0.00341,
      costPer1kQueries: 0.568,
      totalTokens: 5210,
      errorRatePercent: 0.0
    },
    failureCounts: {
      retrieval_starvation: 0,
      context_dilution: 1,
      conflicting_sources: 0,
      generator_hallucination: 0,
      negative_constraint_fail: 0,
      none: 5
    },
    uncertainCount: 1,
    results: [
      {
        id: 'tc-101',
        testSetId: 'ts-legal-01',
        question: 'Under Delaware General Corporation Law § 141(a), who possesses the statutory authority to manage the business and affairs of a corporation?',
        expectedAnswer: 'Under DGCL § 141(a), the business and affairs of every corporation organized under this chapter shall be managed by or under the direction of a board of directors, except as may be otherwise provided in this chapter or in its certificate of incorporation.',
        generatedAnswer: 'Pursuant to DGCL § 141(a), the business and affairs of a Delaware corporation are managed by or under the direction of its board of directors. This fundamental managerial power resides exclusively in the board unless a distinct governance allocation is formally set forth in the certificate of incorporation.',
        difficulty: 'easy',
        ragStrategy: 'vector_hybrid',
        modelName: 'gemini-2.5-flash',
        latencySeconds: 0.88,
        promptTokens: 820,
        completionTokens: 68,
        costUsd: 0.000164,
        retrievedChunks: [
          {
            id: 'chunk-dgcl-141a',
            source: 'delaware_code_title8_ch1.pdf',
            chunkIndex: 0,
            score: 0.94,
            isGoldEvidence: true,
            text: 'Section 141. Board of directors; powers; number, qualifications, terms and quorum; committees; classes of directors; nonstock corporations; reliance upon books; action without meeting; removal. (a) The business and affairs of every corporation organized under this chapter shall be managed by or under the direction of a board of directors, except as may be otherwise provided in this chapter or in its certificate of incorporation.'
          },
          {
            id: 'chunk-dgcl-141c',
            source: 'delaware_code_title8_ch1.pdf',
            chunkIndex: 2,
            score: 0.81,
            isGoldEvidence: false,
            text: 'Section 141(c). The board of directors may designate 1 or more committees, each committee to consist of 1 or more of the directors of the corporation. Any such committee, to the extent provided in the resolution of the board of directors, or in the bylaws of the corporation, shall have and may exercise all the powers and authority of the board of directors.'
          }
        ],
        claims: [
          {
            id: 'claim-1',
            sentence: 'Pursuant to DGCL § 141(a), the business and affairs of a Delaware corporation are managed by or under the direction of its board of directors.',
            status: 'fully_supported',
            confidence: 0.98,
            supportingChunkIds: ['chunk-dgcl-141a'],
            reasoning: 'Exact textual paraphrase of Section 141(a) statutory provision.'
          },
          {
            id: 'claim-2',
            sentence: 'This fundamental managerial power resides exclusively in the board unless a distinct governance allocation is formally set forth in the certificate of incorporation.',
            status: 'fully_supported',
            confidence: 0.94,
            supportingChunkIds: ['chunk-dgcl-141a'],
            reasoning: 'Directly supported by the exception clause "except as may be otherwise provided in this chapter or in its certificate of incorporation".'
          }
        ],
        deterministic: {
          tokenF1: 0.882,
          rougeL: 0.844,
          exactMatch: false,
          lexicalPrecision: 0.895,
          lexicalRecall: 0.871,
          contextLexicalOverlap: 0.952,
          citationGroundingRatio: 1.0,
          answerLengthWords: 43
        },
        judge: {
          faithfulness: 1.0,
          faithfulnessReason: 'All claims are strictly substantiated by chunk-dgcl-141a with no unsupported deductions.',
          answerRelevancy: 0.98,
          relevancyReason: 'Directly and completely answers the statutory question regarding authority under DGCL § 141(a).',
          contextualPrecision: 1.0,
          precisionReason: 'The primary governing chunk was returned at rank 1 with 0.94 similarity score.',
          contextualRecall: 1.0,
          recallReason: 'Retrieved chunk contains 100% of the facts necessary to reproduce the gold standard answer.',
          gEvalCorrectness: 0.99,
          gEvalReason: 'Substantively flawless legal alignment with expected DGCL standard.',
          judgeConfidence: 0.96
        },
        failureCategory: 'none',
        humanReview: {
          status: 'verified_correct',
          reviewedBy: 'Senior Legal AI Engineer',
          reviewedAt: '2026-10-12 16:10:00',
          notes: 'High fidelity extraction; accurate citation to Delaware Code Title 8.'
        }
      },
      {
        id: 'tc-102',
        testSetId: 'ts-legal-01',
        question: 'What are the required elements to establish a prima facie breach of fiduciary duty of loyalty under Kahn v. M&F Worldwide Corp (MFW)?',
        expectedAnswer: 'Under MFW, business judgment review applies to a controlling shareholder buyout only if conditioned ab initio upon both: (1) negotiation and approval by a fully empowered, independent special committee of directors, and (2) the uncoerced, fully informed vote of a majority of the minority stockholders.',
        generatedAnswer: 'Under Kahn v. M&F Worldwide Corp, to maintain business judgment review in a controlling buyout, two conditions are mandatory from the outset: negotiation and approval by an independent special committee, and an uncoerced majority-of-the-minority stockholder vote. Additionally, the special committee must be authorized to select its own independent advisors and say no definitively.',
        difficulty: 'hard',
        ragStrategy: 'vector_hybrid',
        modelName: 'gemini-2.5-flash',
        latencySeconds: 1.25,
        promptTokens: 1150,
        completionTokens: 82,
        costUsd: 0.000222,
        retrievedChunks: [
          {
            id: 'chunk-mfw-opinion',
            source: 'kahn_v_mfw_88_a3d_635.pdf',
            chunkIndex: 4,
            score: 0.91,
            isGoldEvidence: true,
            text: 'We hold that business judgment is the standard of review that should govern mergers between a controlling stockholder and its corporate subsidiary, where the merger is conditioned ab initio upon both the negotiation and approval of an independent, adequately-empowered Special Committee that fulfills its duty of care, and the uncoerced, fully-informed vote of a majority of the minority stockholders.'
          },
          {
            id: 'chunk-mfw-advisors',
            source: 'kahn_v_mfw_88_a3d_635.pdf',
            chunkIndex: 5,
            score: 0.86,
            isGoldEvidence: true,
            text: 'The Special Committee must be empowered to freely select its own legal and financial advisors, and empowered to definitively say no to the proposed transaction.'
          }
        ],
        claims: [
          {
            id: 'claim-1',
            sentence: 'Under Kahn v. M&F Worldwide Corp, to maintain business judgment review in a controlling buyout, two conditions are mandatory from the outset: negotiation and approval by an independent special committee, and an uncoerced majority-of-the-minority stockholder vote.',
            status: 'fully_supported',
            confidence: 0.97,
            supportingChunkIds: ['chunk-mfw-opinion'],
            reasoning: 'Directly supported by Kahn v. MFW holding cited in chunk 4.'
          },
          {
            id: 'claim-2',
            sentence: 'Additionally, the special committee must be authorized to select its own independent advisors and say no definitively.',
            status: 'fully_supported',
            confidence: 0.95,
            supportingChunkIds: ['chunk-mfw-advisors'],
            reasoning: 'Directly corroborated by chunk 5.'
          }
        ],
        deterministic: {
          tokenF1: 0.825,
          rougeL: 0.795,
          exactMatch: false,
          lexicalPrecision: 0.840,
          lexicalRecall: 0.810,
          contextLexicalOverlap: 0.920,
          citationGroundingRatio: 1.0,
          answerLengthWords: 55
        },
        judge: {
          faithfulness: 0.98,
          faithfulnessReason: 'Both claims corroborated by Kahn v. MFW excerpts.',
          answerRelevancy: 0.96,
          relevancyReason: 'Precise legal doctrine articulated clearly.',
          contextualPrecision: 0.94,
          precisionReason: 'Both supporting chunks ranked within top 2.',
          contextualRecall: 0.95,
          recallReason: 'Both prongs of the MFW framework retrieved intact.',
          gEvalCorrectness: 0.97,
          gEvalReason: 'Comprehensive legal formulation.',
          judgeConfidence: 0.94
        },
        failureCategory: 'none',
        humanReview: {
          status: 'verified_correct',
          reviewedBy: 'Senior Legal AI Engineer',
          reviewedAt: '2026-10-12 16:15:00',
          notes: 'Excellent dual-clause synthesis.'
        }
      },
      {
        id: 'tc-103',
        testSetId: 'ts-legal-01',
        question: 'What is the statutory deadline for a shareholder to demand appraisal rights under DGCL § 262(d)(1) prior to a merger vote?',
        expectedAnswer: 'Under DGCL § 262(d)(1), the written demand for appraisal must be delivered to the corporation before the taking of the vote on the merger or consolidation.',
        generatedAnswer: 'Shareholders seeking appraisal must deliver a written demand to the corporation within 20 days after the mailing of the notice of merger, or before the vote is taken at the meeting.',
        difficulty: 'medium',
        ragStrategy: 'vector_hybrid',
        modelName: 'gemini-2.5-flash',
        latencySeconds: 1.05,
        promptTokens: 890,
        completionTokens: 42,
        costUsd: 0.000159,
        retrievedChunks: [
          {
            id: 'chunk-dgcl-262d1',
            source: 'delaware_code_title8_ch1.pdf',
            chunkIndex: 8,
            score: 0.82,
            isGoldEvidence: true,
            text: 'Section 262(d)(1). If a vote is to be taken, a written demand for appraisal must be delivered to the corporation before the taking of the vote on the merger or consolidation.'
          },
          {
            id: 'chunk-dgcl-262d2',
            source: 'delaware_code_title8_ch1.pdf',
            chunkIndex: 14,
            score: 0.79,
            isGoldEvidence: false,
            text: 'Section 262(d)(2). In mergers approved under § 251(h) without a vote, the corporation shall notify each stockholder within 10 days, and the stockholder must demand appraisal within 20 days after the date of mailing of such notice.'
          }
        ],
        claims: [
          {
            id: 'claim-1',
            sentence: 'Shareholders seeking appraisal must deliver a written demand to the corporation within 20 days after the mailing of the notice of merger, or before the vote is taken at the meeting.',
            status: 'partially_supported',
            confidence: 0.68,
            supportingChunkIds: ['chunk-dgcl-262d1', 'chunk-dgcl-262d2'],
            reasoning: 'Conflated subsection (d)(1) (before vote) with subsection (d)(2) (20 days for non-vote short-form / 251(h) mergers).'
          }
        ],
        deterministic: {
          tokenF1: 0.625,
          rougeL: 0.580,
          exactMatch: false,
          lexicalPrecision: 0.650,
          lexicalRecall: 0.601,
          contextLexicalOverlap: 0.875,
          citationGroundingRatio: 0.68,
          answerLengthWords: 29
        },
        judge: {
          faithfulness: 0.72,
          faithfulnessReason: 'The model mixed up subsection (d)(1) requirements with subsection (d)(2). In a vote scenario, the 20-day rule does not apply.',
          answerRelevancy: 0.82,
          relevancyReason: 'Addressed appraisal deadlines but introduced factual ambiguity.',
          contextualPrecision: 0.78,
          precisionReason: 'Retriever returned both (d)(1) and (d)(2), confusing the generator.',
          contextualRecall: 0.85,
          recallReason: 'Both sections were returned.',
          gEvalCorrectness: 0.70,
          gEvalReason: 'Legally imprecise; conflates voting and non-voting merger procedures.',
          judgeConfidence: 0.78
        },
        failureCategory: 'context_dilution',
        failureDetails: 'Generator merged distinct statutory clauses (d)(1) vs (d)(2) because chunk-dgcl-262d2 was placed alongside chunk-dgcl-262d1.',
        suggestedFix: 'Add section-level hierarchical reranking or instruct generator to specify scenario conditions (voting vs non-voting tender offers).',
        humanReview: {
          status: 'unreviewed',
          notes: 'Uncertain evaluation: judge penalized heavily for legal conflation. Worth auditing.'
        }
      }
    ]
  },
  {
    id: 'run-legal-dense-v1',
    name: 'Legal RAG Bench - Pure Dense (ChromaDB Vector)',
    createdAt: '2026-10-12 11:20:00',
    datasetVersion: 'v2.0-legal-bench',
    datasetName: 'Isaacus Legal RAG Benchmark (Statutes & Precedents)',
    totalCases: 6,
    ragStrategy: 'vector_semantic',
    modelName: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    topK: 4,
    chunkSize: 1024,
    chunkOverlap: 64,
    averageScores: {
      faithfulness: 0.748,
      answerRelevancy: 0.812,
      contextualPrecision: 0.695,
      contextualRecall: 0.710,
      gEvalCorrectness: 0.735,
      tokenF1: 0.672,
      rougeL: 0.640,
      citationGroundingRatio: 0.720
    },
    performance: {
      p50LatencySec: 1.45,
      p95LatencySec: 2.65,
      avgLatencySec: 1.62,
      totalCostUsd: 0.00395,
      costPer1kQueries: 0.658,
      totalTokens: 6120,
      errorRatePercent: 0.0
    },
    failureCounts: {
      retrieval_starvation: 2,
      context_dilution: 2,
      conflicting_sources: 0,
      generator_hallucination: 1,
      negative_constraint_fail: 1,
      none: 2
    },
    uncertainCount: 2,
    results: [
      {
        id: 'tc-201',
        testSetId: 'ts-legal-01',
        question: 'Under Delaware General Corporation Law § 141(a), who possesses the statutory authority to manage the business and affairs of a corporation?',
        expectedAnswer: 'Under DGCL § 141(a), the business and affairs of every corporation organized under this chapter shall be managed by or under the direction of a board of directors, except as may be otherwise provided in this chapter or in its certificate of incorporation.',
        generatedAnswer: 'The board of directors manages the corporation under Section 141.',
        difficulty: 'easy',
        ragStrategy: 'vector_semantic',
        modelName: 'gpt-4o-mini',
        latencySeconds: 1.15,
        promptTokens: 910,
        completionTokens: 15,
        costUsd: 0.000146,
        retrievedChunks: [
          {
            id: 'chunk-dgcl-141a-oversized',
            source: 'delaware_code_title8_ch1.pdf',
            chunkIndex: 0,
            score: 0.78,
            isGoldEvidence: true,
            text: 'Section 141. Board of directors; powers... (a) The business and affairs of every corporation... shall be managed by or under the direction of a board of directors...'
          }
        ],
        claims: [
          {
            id: 'claim-1',
            sentence: 'The board of directors manages the corporation under Section 141.',
            status: 'partially_supported',
            confidence: 0.85,
            supportingChunkIds: ['chunk-dgcl-141a-oversized'],
            reasoning: 'Omitted the crucial "or under direction of" and certificate of incorporation exception.'
          }
        ],
        deterministic: {
          tokenF1: 0.58,
          rougeL: 0.54,
          exactMatch: false,
          lexicalPrecision: 0.90,
          lexicalRecall: 0.45,
          contextLexicalOverlap: 0.75,
          citationGroundingRatio: 0.85,
          answerLengthWords: 11
        },
        judge: {
          faithfulness: 0.88,
          faithfulnessReason: 'Supported by chunk, but truncated important statutory nuance.',
          answerRelevancy: 0.80,
          relevancyReason: 'Brief and lacks statutory exceptions.',
          contextualPrecision: 0.78,
          precisionReason: 'Top chunk had text, but lower relevance score than hybrid.',
          contextualRecall: 0.65,
          recallReason: 'Failed to retrieve exception clause in full.',
          gEvalCorrectness: 0.72,
          gEvalReason: 'Too terse for formal legal evaluation.',
          judgeConfidence: 0.82
        },
        failureCategory: 'context_dilution',
        humanReview: {
          status: 'unreviewed',
          notes: ''
        }
      },
      {
        id: 'tc-202',
        testSetId: 'ts-legal-01',
        question: 'Under what specific standard does Delaware review director conduct during a hostile tender offer defensive response under Unocal Corp. v. Mesa Petroleum Co.?',
        expectedAnswer: 'Under Unocal, defensive tactics receive enhanced scrutiny requiring directors to establish: (1) reasonable grounds for believing a danger to corporate policy and effectiveness existed, and (2) the defensive measure adopted was reasonable in relation to the threat posed (proportionality).',
        generatedAnswer: 'Delaware applies the business judgment rule if directors acted in good faith, or entire fairness if they were interested.',
        difficulty: 'hard',
        ragStrategy: 'vector_semantic',
        modelName: 'gpt-4o-mini',
        latencySeconds: 1.85,
        promptTokens: 1200,
        completionTokens: 25,
        costUsd: 0.000195,
        retrievedChunks: [
          {
            id: 'chunk-general-fiduciary',
            source: 'aronson_v_lewis.pdf',
            chunkIndex: 2,
            score: 0.61,
            isGoldEvidence: false,
            text: 'Under Aronson v. Lewis, directors are presumed to have acted on an informed basis, in good faith and in the honest belief that the action taken was in the best interests of the company.'
          }
        ],
        claims: [
          {
            id: 'claim-1',
            sentence: 'Delaware applies the business judgment rule if directors acted in good faith, or entire fairness if they were interested.',
            status: 'unsupported',
            confidence: 0.35,
            supportingChunkIds: [],
            reasoning: 'Completely missed Unocal intermediate enhanced scrutiny doctrine; retrieved irrelevant Aronson chunk.'
          }
        ],
        deterministic: {
          tokenF1: 0.22,
          rougeL: 0.18,
          exactMatch: false,
          lexicalPrecision: 0.30,
          lexicalRecall: 0.18,
          contextLexicalOverlap: 0.15,
          citationGroundingRatio: 0.0,
          answerLengthWords: 20
        },
        judge: {
          faithfulness: 0.42,
          faithfulnessReason: 'The model failed to answer the question about Unocal and hallucinated standard BJR without enhanced scrutiny.',
          answerRelevancy: 0.35,
          relevancyReason: 'Missed Unocal standard completely.',
          contextualPrecision: 0.25,
          precisionReason: 'Retriever completely failed to return Unocal v. Mesa Petroleum text.',
          contextualRecall: 0.10,
          recallReason: 'Zero required legal tests were retrieved in context.',
          gEvalCorrectness: 0.20,
          gEvalReason: 'Factually erroneous legal standard for hostile tender defense.',
          judgeConfidence: 0.98
        },
        failureCategory: 'retrieval_starvation',
        failureDetails: 'Dense semantic embeddings with small topK failed to match the legal query to the Unocal precedent.',
        suggestedFix: 'Implement Hybrid Search (BM25 + Dense) or broaden topK to 8.',
        humanReview: {
          status: 'verified_correct',
          reviewedBy: 'Senior Legal AI Engineer',
          reviewedAt: '2026-10-12 16:30:00',
          notes: 'Classic retrieval starvation failure. Dense embeddings alone failed on specific case citation.'
        }
      }
    ]
  },
  {
    id: 'run-legal-frontier-gemini',
    name: 'Legal RAG Bench - Gemini 2.5 Pro (Deep Research / Agentic)',
    createdAt: '2026-10-13 09:15:00',
    datasetVersion: 'v2.0-legal-bench',
    datasetName: 'Isaacus Legal RAG Benchmark (Statutes & Precedents)',
    totalCases: 6,
    ragStrategy: 'rlm_rag',
    modelName: 'gpt-4o',
    embeddingModel: 'text-embedding-3-large + Hybrid',
    topK: 10,
    chunkSize: 512,
    chunkOverlap: 128,
    averageScores: {
      faithfulness: 0.965,
      answerRelevancy: 0.978,
      contextualPrecision: 0.932,
      contextualRecall: 0.954,
      gEvalCorrectness: 0.962,
      tokenF1: 0.892,
      rougeL: 0.865,
      citationGroundingRatio: 0.982
    },
    performance: {
      p50LatencySec: 3.85,
      p95LatencySec: 6.20,
      avgLatencySec: 4.15,
      totalCostUsd: 0.04820,
      costPer1kQueries: 8.033,
      totalTokens: 14200,
      errorRatePercent: 0.0
    },
    failureCounts: {
      retrieval_starvation: 0,
      context_dilution: 0,
      conflicting_sources: 0,
      generator_hallucination: 0,
      negative_constraint_fail: 0,
      none: 6
    },
    uncertainCount: 0,
    results: []
  }
];
