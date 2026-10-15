import React, { useState } from 'react';
import { 
  GitCommit, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  ArrowDownRight, 
  ArrowUpRight, 
  Check, 
  XCircle,
  FileCheck2,
  Copy
} from 'lucide-react';
import { EvaluationRun, QualityGateRule, QualityGateEvaluation } from '../types/reliability';

interface RegressionTabProps {
  run: EvaluationRun;
  qualityGateRules: QualityGateRule[];
  qualityGateEvaluations: QualityGateEvaluation[];
}

export const RegressionTab: React.FC<RegressionTabProps> = ({
  run,
  qualityGateRules,
  qualityGateEvaluations
}) => {
  const [copiedCI, setCopiedCI] = useState(false);

  const passedCount = qualityGateEvaluations.filter(g => g.passed).length;
  const isPassingAll = passedCount === qualityGateEvaluations.length;

  const sampleRegressions = [
    {
      id: 'reg-01',
      questionId: 'tc-103',
      question: 'What is the statutory deadline for a shareholder to demand appraisal rights under DGCL § 262(d)(1)?',
      metric: 'Faithfulness',
      v1Score: 0.94,
      v2Score: 0.72,
      delta: -0.22,
      cause: 'Context dilution between 262(d)(1) and 262(d)(2).'
    }
  ];

  const ciCommand = `# GitHub Actions / CI Runner Step:
uv run python -m rag_evaluator.cli evaluate \\
  --rag-type ${run.ragStrategy} \\
  --test-set ${run.datasetVersion}.json \\
  --quality-gate-config quality_gates.json \\
  --fail-on-breach true

# Result: ${isPassingAll ? 'EXIT CODE 0 (Quality Gate Passed)' : 'EXIT CODE 1 (Pipeline Blocked: SLA Breached)'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ciCommand);
    setCopiedCI(true);
    setTimeout(() => setCopiedCI(false), 2500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-indigo-400" />
              Automated Regression Suite & CI Quality Gate
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Guarantees zero silent quality deterioration across code refactors, prompt modifications, and dependency updates
            </p>
          </div>

          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-xs font-semibold ${
            isPassingAll 
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800' 
              : 'bg-rose-950/70 text-rose-300 border-rose-800 animate-pulse'
          }`}>
            {isPassingAll ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>BUILD PASSED (CI EXIT 0)</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>BUILD BLOCKED (CI EXIT 1)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quality Gate Rule Compliance Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
            Quality Gate Threshold Assertions ({passedCount}/{qualityGateEvaluations.length} Passing)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Contract SLA</span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {qualityGateEvaluations.map((evalItem) => {
            const rule = evalItem.rule;
            return (
              <div key={rule.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{rule.name}</span>
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                      rule.severity === 'error' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rule.description}</p>
                </div>

                <div className="text-right whitespace-nowrap">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Actual: {evalItem.actualValue}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      (Req: {rule.operator} {rule.threshold})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      evalItem.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {evalItem.passed ? <Check className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {evalItem.passed ? 'PASSED' : 'BREACH'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regression Deterioration Alerts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Detected Version Regressions ({sampleRegressions.length} Alert)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Dataset version diff</span>
        </div>

        <div className="space-y-3">
          {sampleRegressions.map((reg) => (
            <div key={reg.id} className="bg-slate-950 border border-amber-800/60 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  {reg.questionId}
                </span>
                <span className="text-rose-400 font-mono font-bold flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  {reg.metric}: {(reg.v1Score * 100).toFixed(0)}% → {(reg.v2Score * 100).toFixed(0)}% ({(reg.delta * 100).toFixed(0)}%)
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Question:</span>
                <p className="text-slate-100 font-medium mt-0.5">{reg.question}</p>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg text-slate-300 text-[11px]">
                <strong>Root Cause:</strong> {reg.cause}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CI/CD Integration Script */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            CI/CD Pipeline Integration Snippet
          </h3>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {copiedCI ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedCI ? 'Copied!' : 'Copy Shell Script'}
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
          {ciCommand}
        </pre>
      </div>
    </div>
  );
};
