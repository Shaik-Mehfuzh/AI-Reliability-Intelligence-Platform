import React, { useState } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Wrench, 
  Sparkles, 
  Layers, 
  FileSearch,
  Check,
  RefreshCw
} from 'lucide-react';
import { EvaluationRun, FailureCategory, RemediationItem } from '../types/reliability';
import { REMEDIATION_CATALOG } from '../data/benchmarkData';

interface FailureAnalysisTabProps {
  run: EvaluationRun;
  onApplyRemediation?: (remediation: RemediationItem) => void;
}

export const FailureAnalysisTab: React.FC<FailureAnalysisTabProps> = ({ run, onApplyRemediation }) => {
  const [selectedCategory, setSelectedCategory] = useState<FailureCategory>('retrieval_starvation');
  const [appliedRemediations, setAppliedRemediations] = useState<string[]>([]);
  const [simulatedMetrics, setSimulatedMetrics] = useState<Record<string, number> | null>(null);

  const failureCategories: {
    id: FailureCategory;
    name: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'retrieval_starvation',
      name: 'Retrieval Starvation',
      description: 'The golden evidence required to formulate a truthful answer was entirely missing from retrieved passages.',
      icon: FileSearch,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40',
      borderColor: 'border-rose-800'
    },
    {
      id: 'context_dilution',
      name: 'Context Dilution (Needle in Haystack)',
      description: 'The relevant knowledge chunk was retrieved, but buried among noisy or irrelevant passages and ignored by the generator.',
      icon: Layers,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800'
    },
    {
      id: 'generator_hallucination',
      name: 'Generator Drift & Hallucination',
      description: 'Retrieved context was sufficient and high-quality, but the generation model invented unsupported claims.',
      icon: Flame,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40',
      borderColor: 'border-purple-800'
    },
    {
      id: 'conflicting_sources',
      name: 'Conflicting Sources & Version Skew',
      description: 'Retriever returned chunks from differing document versions or contradictory clauses, confusing the generator.',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/40',
      borderColor: 'border-orange-800'
    }
  ];

  const categoryCases = run.results.filter(r => r.failureCategory === selectedCategory);
  const relevantRemediations = REMEDIATION_CATALOG.filter(r => r.targetCategory === selectedCategory);

  const handleSimulateFix = (item: RemediationItem) => {
    if (appliedRemediations.includes(item.id)) {
      setAppliedRemediations(appliedRemediations.filter(id => id !== item.id));
      setSimulatedMetrics(null);
    } else {
      setAppliedRemediations([...appliedRemediations, item.id]);
      // Project simulated improvements
      setSimulatedMetrics({
        faithfulness: Math.min(1.0, run.averageScores.faithfulness + 0.08),
        contextualRecall: Math.min(1.0, run.averageScores.contextualRecall + 0.12),
        contextualPrecision: Math.min(1.0, run.averageScores.contextualPrecision + 0.09),
        citationGroundingRatio: Math.min(1.0, run.averageScores.citationGroundingRatio + 0.11),
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Flame className="h-5 w-5 text-rose-400" />
          Failure Root-Cause Clustering & Prescriptive Remediation
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Automatically categorizes failure modes into retrieval vs. generator bottlenecks and provides actionable architectural remedies
        </p>
      </div>

      {/* Failure Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {failureCategories.map((cat) => {
          const count = run.failureCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? `${cat.bgColor} ${cat.borderColor} ring-1 ring-indigo-500 shadow-md`
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <span className="text-xs font-semibold text-slate-200">{cat.name}</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${cat.borderColor} ${cat.color} ${cat.bgColor}`}>
                  {count} cases
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {cat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Failure Category Deep Dive & Prescriptive Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prescriptive Fix Recommendations (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-400" />
              Actionable Remediation Engine
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Prescriptive Fixes</span>
          </div>

          <p className="text-xs text-slate-400">
            Recommended configuration and architectural changes to eliminate recurring failures in this bucket:
          </p>

          <div className="space-y-4">
            {relevantRemediations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                No active failures detected in this category for the current run!
              </div>
            ) : (
              relevantRemediations.map((item) => {
                const isApplied = appliedRemediations.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      isApplied 
                        ? 'bg-indigo-950/40 border-indigo-500' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{item.title}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        Affects {item.affectedCasesCount} cases
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {item.description}
                    </p>

                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                      <strong>Prescribed:</strong> {item.prescribedAction}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-emerald-400 font-medium text-[11px]">
                        Expected: {item.expectedMetricImpact}
                      </span>

                      <button
                        onClick={() => handleSimulateFix(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isApplied
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Simulated</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Simulate Fix</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Simulation Result Callout */}
          {simulatedMetrics && (
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 text-xs space-y-2 animate-fade-in">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Projected Post-Remediation Impact:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div>Faithfulness: <span className="text-emerald-400 font-bold">{(simulatedMetrics.faithfulness * 100).toFixed(1)}% (+8.0%)</span></div>
                <div>Recall: <span className="text-emerald-400 font-bold">{(simulatedMetrics.contextualRecall * 100).toFixed(1)}% (+12.0%)</span></div>
                <div>Precision: <span className="text-emerald-400 font-bold">{(simulatedMetrics.contextualPrecision * 100).toFixed(1)}% (+9.0%)</span></div>
                <div>Citations: <span className="text-emerald-400 font-bold">{(simulatedMetrics.citationGroundingRatio * 100).toFixed(1)}% (+11.0%)</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Impacted Test Cases in this Category (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Impacted Cases in "{failureCategories.find(c => c.id === selectedCategory)?.name}" ({categoryCases.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Trace Logs</span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {categoryCases.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No test cases failed under this category in this run. Clean bill of health!
              </div>
            ) : (
              categoryCases.map((tc) => (
                <div
                  key={tc.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {tc.id}
                    </span>
                    <span className="text-rose-400 font-mono font-semibold">
                      Faithfulness: {(tc.judge.faithfulness * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Question:</span>
                    <p className="text-slate-100 font-medium mt-0.5">{tc.question}</p>
                  </div>

                  {tc.failureDetails && (
                    <div className="bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-lg text-rose-300 text-[11px] space-y-0.5">
                      <span className="font-semibold block">Root Cause Diagnosis:</span>
                      <p>{tc.failureDetails}</p>
                    </div>
                  )}

                  {tc.suggestedFix && (
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-cyan-300">
                      <strong>Target Fix:</strong> {tc.suggestedFix}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
