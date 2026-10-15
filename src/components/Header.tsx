import React from 'react';
import { 
  ShieldCheck, 
  GitFork, 
  Settings2, 
  ShieldAlert, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Sparkles
} from 'lucide-react';
import { EvaluationRun } from '../types/reliability';

interface HeaderProps {
  runs: EvaluationRun[];
  selectedRunId: string;
  onSelectRun: (runId: string) => void;
  onOpenPricing: () => void;
  onOpenQualityGates: () => void;
  onOpenExport: () => void;
  onOpenRunModal: () => void;
  qualityGatePassed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  runs,
  selectedRunId,
  onSelectRun,
  onOpenPricing,
  onOpenQualityGates,
  onOpenExport,
  onOpenRunModal,
  qualityGatePassed
}) => {
  const currentRun = runs.find(r => r.id === selectedRunId) || runs[0];
  const totalCases = currentRun?.results.length || 0;
  const unreviewedCount = currentRun?.results.filter(r => r.humanReview.status === 'unreviewed').length || 0;
  const failureCount = currentRun?.results.filter(r => r.failureCategory !== 'none').length || 0;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">AI Reliability Intelligence Platform</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                RAG-evaluator v2.4+
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic diagnostics, LLM-as-judge calibration, failure clustering & regression CI
            </p>
          </div>
        </div>

        {/* Global Controls & Run Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Run Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Run:</span>
            <select
              value={selectedRunId}
              onChange={(e) => onSelectRun(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[240px] truncate"
            >
              {runs.map(run => (
                <option key={run.id} value={run.id} className="bg-slate-900 text-slate-100">
                  {run.name} ({run.ragStrategy})
                </option>
              ))}
            </select>
          </div>

          {/* Quality Gate Status Badge */}
          <button
            onClick={onOpenQualityGates}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              qualityGatePassed
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
            }`}
          >
            {qualityGatePassed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>SLA Passed</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span>SLA Breached</span>
              </>
            )}
          </button>

          {/* Pricing Config */}
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
            title="Configure token pricing models"
          >
            <Settings2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Pricing Config</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
            title="Export CSV / JSON / Markdown Audit"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          {/* Run New Evaluation */}
          <button
            onClick={onOpenRunModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Evaluation</span>
          </button>
        </div>
      </div>
    </header>
  );
};
