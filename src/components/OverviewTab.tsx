import React from 'react';
import { 
  ShieldCheck, 
  BrainCircuit, 
  Hash, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { EvaluationRun, QualityGateEvaluation } from '../types/reliability';

interface OverviewTabProps {
  run: EvaluationRun;
  qualityGateEvaluations: QualityGateEvaluation[];
  onNavigateToInspector: () => void;
  onNavigateToFailures: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  run,
  qualityGateEvaluations,
  onNavigateToInspector,
  onNavigateToFailures
}) => {
  const scores = run.averageScores;
  const passedGates = qualityGateEvaluations.filter(g => g.passed).length;
  const totalGates = qualityGateEvaluations.length;

  const metricCards = [
    {
      title: 'Faithfulness (Hallucination SLA)',
      type: 'LLM Judge',
      typeBadge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      value: (scores.faithfulness * 100).toFixed(1) + '%',
      raw: scores.faithfulness,
      target: '>= 85.0%',
      passed: scores.faithfulness >= 0.85,
      desc: 'Portion of generated claims strictly derivable from retrieved context without external fabrication.'
    },
    {
      title: 'Answer Relevancy',
      type: 'LLM Judge',
      typeBadge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      value: (scores.answerRelevancy * 100).toFixed(1) + '%',
      raw: scores.answerRelevancy,
      target: '>= 80.0%',
      passed: scores.answerRelevancy >= 0.80,
      desc: 'Assesses whether response directly satisfies user prompt intent without topical drift.'
    },
    {
      title: 'Contextual Precision',
      type: 'LLM Judge',
      typeBadge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      value: (scores.contextualPrecision * 100).toFixed(1) + '%',
      raw: scores.contextualPrecision,
      target: '>= 75.0%',
      passed: scores.contextualPrecision >= 0.75,
      desc: 'Measures whether the most relevant knowledge passages were ranked near top of retrieved list.'
    },
    {
      title: 'Contextual Recall',
      type: 'LLM Judge',
      typeBadge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      value: (scores.contextualRecall * 100).toFixed(1) + '%',
      raw: scores.contextualRecall,
      target: '>= 75.0%',
      passed: scores.contextualRecall >= 0.75,
      desc: 'Verification whether retriever captured all factual premises required to answer the gold benchmark.'
    },
    {
      title: 'G-Eval Semantic Correctness',
      type: 'LLM Judge',
      typeBadge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      value: (scores.gEvalCorrectness * 100).toFixed(1) + '%',
      raw: scores.gEvalCorrectness,
      target: '>= 80.0%',
      passed: scores.gEvalCorrectness >= 0.80,
      desc: 'End-to-end qualitative alignment between generated response and benchmark gold truth.'
    },
    {
      title: 'Citation Grounding Ratio',
      type: 'Deterministic',
      typeBadge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      value: (scores.citationGroundingRatio * 100).toFixed(1) + '%',
      raw: scores.citationGroundingRatio,
      target: '>= 80.0%',
      passed: scores.citationGroundingRatio >= 0.80,
      desc: 'Exact sentence-level claim verification corroborating every sentence with context chunks.'
    },
    {
      title: 'Token F1 Score',
      type: 'Deterministic',
      typeBadge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      value: (scores.tokenF1 * 100).toFixed(1) + '%',
      raw: scores.tokenF1,
      target: '>= 70.0%',
      passed: scores.tokenF1 >= 0.70,
      desc: 'Harmonic mean of lexical token precision and recall against ground truth reference.'
    },
    {
      title: 'ROUGE-L (LCS Overlap)',
      type: 'Deterministic',
      typeBadge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      value: (scores.rougeL * 100).toFixed(1) + '%',
      raw: scores.rougeL,
      target: '>= 65.0%',
      passed: scores.rougeL >= 0.65,
      desc: 'Longest common subsequence ratio between generated response and expected gold text.'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Run Metadata Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                Active Benchmark Run
              </span>
              <span className="text-xs text-slate-400 font-mono">Dataset: {run.datasetVersion}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{run.name}</h2>
            <p className="text-sm text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Strategy: <strong className="text-slate-200">{run.ragStrategy}</strong></span>
              <span>Model: <strong className="text-slate-200">{run.modelName}</strong></span>
              <span>Embedding: <strong className="text-slate-200">{run.embeddingModel}</strong></span>
              <span>Top-K: <strong className="text-slate-200">{run.topK} chunks</strong></span>
              <span>Chunking: <strong className="text-slate-200">{run.chunkSize} tokens (overlap {run.chunkOverlap})</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-right">
              <div className="text-[11px] text-slate-400 font-medium">Cases Evaluated</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{run.totalCases}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-right">
              <div className="text-[11px] text-slate-400 font-medium">Quality Gate</div>
              <div className={`text-2xl font-bold font-mono ${passedGates === totalGates ? 'text-emerald-400' : 'text-amber-400'}`}>
                {passedGates}/{totalGates}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Reliability & Quality Diagnostics (Deterministic vs. LLM Judge)
          </h3>
          <span className="text-xs text-slate-400">Higher is better (normalized 0.0 - 1.0)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${card.typeBadge}`}>
                    {card.type}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Target: {card.target}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{card.title}</h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-slate-100">{card.value}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${card.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {card.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {card.passed ? 'Passing' : 'Below SLA'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full ${card.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.min(card.raw * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Economics & Performance vs Failure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency & Cost Economics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Latency & FinOps Economics
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Disclosed assumptions</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 font-medium">P50 Latency</span>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                {run.performance.p50LatencySec.toFixed(2)}s
              </div>
              <span className="text-[10px] text-slate-500">Median response time</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 font-medium">P95 Latency</span>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                {run.performance.p95LatencySec.toFixed(2)}s
              </div>
              <span className="text-[10px] text-slate-500">95th percentile SLA</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 font-medium">Cost / 1k Queries</span>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                ${run.performance.costPer1kQueries.toFixed(3)}
              </div>
              <span className="text-[10px] text-slate-500">Prompt + completion</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 font-medium">Token Footprint</span>
              <div className="text-lg font-bold font-mono text-violet-300 mt-1">
                {run.performance.totalTokens.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Total run tokens</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
            <div className="font-semibold text-slate-300">Cost Calculation Parameters:</div>
            <div>• Model: {run.modelName}</div>
            <div>• Pricing based on current official provider API schedules (configurable in Pricing Config).</div>
          </div>
        </div>

        {/* Failure Breakdown & Quick Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-rose-400" />
                Root Cause Failure Taxonomy
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated clustering of retrieval vs generator failure patterns
              </p>
            </div>
            <button
              onClick={onNavigateToFailures}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View Full Diagnostics →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Retrieval Starvation</span>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800">
                  {run.failureCounts.retrieval_starvation}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Gold evidence was completely absent from retrieved chunks.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Context Dilution</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800">
                  {run.failureCounts.context_dilution}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Target evidence was present but buried beneath noisy passages.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Hallucination / Drift</span>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800">
                  {run.failureCounts.generator_hallucination}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Generator invented unsupported claims despite retrieved context.
              </p>
            </div>
          </div>

          {/* Action Callout */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Human-in-the-Loop Review Queue
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {run.uncertainCount > 0 
                  ? `${run.uncertainCount} evaluation cases flagged with low judge confidence or high semantic ambiguity.`
                  : 'All evaluation cases have high judge confidence scores.'}
              </p>
            </div>
            <button
              onClick={onNavigateToInspector}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm whitespace-nowrap self-start sm:self-auto"
            >
              Open Case Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
