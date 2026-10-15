import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { OverviewTab } from './components/OverviewTab';
import { InspectionTab } from './components/InspectionTab';
import { ComparisonTab } from './components/ComparisonTab';
import { FailureAnalysisTab } from './components/FailureAnalysisTab';
import { RegressionTab } from './components/RegressionTab';
import { PlaygroundTab } from './components/PlaygroundTab';
import { PricingModal } from './components/PricingModal';
import { QualityGateModal } from './components/QualityGateModal';
import { ExportModal } from './components/ExportModal';
import { RunEvaluationModal } from './components/RunEvaluationModal';
import { 
  SAMPLE_EXPERIMENTS, 
  DEFAULT_MODEL_PRICING, 
  DEFAULT_QUALITY_GATES 
} from './data/benchmarkData';
import { evaluateQualityGate } from './utils/metricsEngine';
import { 
  EvaluationRun, 
  ModelPricing, 
  QualityGateRule, 
  ReviewStatus 
} from './types/reliability';

export default function App() {
  const [runs, setRuns] = useState<EvaluationRun[]>(SAMPLE_EXPERIMENTS);
  const [selectedRunId, setSelectedRunId] = useState<string>(SAMPLE_EXPERIMENTS[0].id);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [pricingConfig, setPricingConfig] = useState<Record<string, ModelPricing>>(DEFAULT_MODEL_PRICING);
  const [qualityGateRules, setQualityGateRules] = useState<QualityGateRule[]>(DEFAULT_QUALITY_GATES);

  // Modals
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isQualityGatesOpen, setIsQualityGatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  // Current Active Run
  const currentRun = useMemo(() => {
    return runs.find(r => r.id === selectedRunId) || runs[0];
  }, [runs, selectedRunId]);

  // Evaluate Quality Gate against current active run
  const qualityGateEvaluations = useMemo(() => {
    return evaluateQualityGate(currentRun, qualityGateRules);
  }, [currentRun, qualityGateRules]);

  const isQualityGatePassed = useMemo(() => {
    return qualityGateEvaluations.every(g => g.passed);
  }, [qualityGateEvaluations]);

  // Counts
  const unreviewedCount = useMemo(() => {
    return currentRun.results.filter(r => r.humanReview.status === 'unreviewed').length;
  }, [currentRun]);

  const failureCount = useMemo(() => {
    return currentRun.results.filter(r => r.failureCategory !== 'none').length;
  }, [currentRun]);

  // Update human review for a specific test case
  const handleUpdateReview = (
    caseId: string,
    status: ReviewStatus,
    notes?: string,
    overrideFaithfulness?: number
  ) => {
    setRuns(prevRuns => {
      return prevRuns.map(run => {
        if (run.id !== currentRun.id) return run;

        const updatedResults = run.results.map(c => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            judge: {
              ...c.judge,
              faithfulness: overrideFaithfulness !== undefined ? overrideFaithfulness : c.judge.faithfulness
            },
            humanReview: {
              status,
              reviewedBy: 'Lead AI Engineer',
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              notes: notes !== undefined ? notes : c.humanReview.notes,
              overriddenScore: overrideFaithfulness !== undefined ? { faithfulness: overrideFaithfulness } : c.humanReview.overriddenScore
            }
          };
        });

        // Recalculate average faithfulness
        const totalFaith = updatedResults.reduce((acc, curr) => acc + curr.judge.faithfulness, 0);
        const avgFaith = updatedResults.length > 0 ? totalFaith / updatedResults.length : run.averageScores.faithfulness;

        return {
          ...run,
          averageScores: {
            ...run.averageScores,
            faithfulness: Number(avgFaith.toFixed(3))
          },
          results: updatedResults
        };
      });
    });
  };

  const handleRunCreated = (newRun: EvaluationRun) => {
    setRuns(prev => [newRun, ...prev]);
    setSelectedRunId(newRun.id);
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        runs={runs}
        selectedRunId={selectedRunId}
        onSelectRun={setSelectedRunId}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenQualityGates={() => setIsQualityGatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRunModal={() => setIsRunModalOpen(true)}
        qualityGatePassed={isQualityGatePassed}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreviewedCount={unreviewedCount}
        failureCount={failureCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'overview' && (
          <OverviewTab
            run={currentRun}
            qualityGateEvaluations={qualityGateEvaluations}
            onNavigateToInspector={() => setActiveTab('inspector')}
            onNavigateToFailures={() => setActiveTab('failures')}
          />
        )}

        {activeTab === 'inspector' && (
          <InspectionTab
            cases={currentRun.results}
            onUpdateReview={handleUpdateReview}
          />
        )}

        {activeTab === 'comparisons' && (
          <ComparisonTab
            runs={runs}
            pricingConfig={pricingConfig}
          />
        )}

        {activeTab === 'failures' && (
          <FailureAnalysisTab
            run={currentRun}
          />
        )}

        {activeTab === 'regression' && (
          <RegressionTab
            run={currentRun}
            qualityGateRules={qualityGateRules}
            qualityGateEvaluations={qualityGateEvaluations}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundTab />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>AI Reliability Intelligence Platform</span>
          <span>•</span>
          <span>Extending open-source RAG-evaluator</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Deterministic Metrics + DeepEval Judge + Sentence Citations + CI Gates
        </div>
      </footer>

      {/* Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        pricingConfig={pricingConfig}
        onSavePricing={setPricingConfig}
      />

      <QualityGateModal
        isOpen={isQualityGatesOpen}
        onClose={() => setIsQualityGatesOpen(false)}
        rules={qualityGateRules}
        onSaveRules={setQualityGateRules}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        run={currentRun}
      />

      <RunEvaluationModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRunCreated={handleRunCreated}
      />
    </div>
  );
}
