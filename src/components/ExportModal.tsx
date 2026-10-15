import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileCode, FileText } from 'lucide-react';
import { EvaluationRun } from '../types/reliability';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: EvaluationRun;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, run }) => {
  const [activeFormat, setActiveFormat] = useState<'csv' | 'json' | 'markdown'>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate CSV
  const generateCSV = (): string => {
    const headers = [
      'case_id',
      'difficulty',
      'rag_strategy',
      'model_name',
      'faithfulness',
      'answer_relevancy',
      'contextual_precision',
      'contextual_recall',
      'token_f1',
      'rouge_l',
      'citation_grounding_ratio',
      'latency_sec',
      'cost_usd',
      'failure_category',
      'human_review_status',
      'question',
      'expected_answer',
      'generated_answer'
    ];

    const rows = run.results.map(r => [
      `"${r.id}"`,
      `"${r.difficulty}"`,
      `"${r.ragStrategy}"`,
      `"${r.modelName}"`,
      r.judge.faithfulness.toFixed(3),
      r.judge.answerRelevancy.toFixed(3),
      r.judge.contextualPrecision.toFixed(3),
      r.judge.contextualRecall.toFixed(3),
      r.deterministic.tokenF1.toFixed(3),
      r.deterministic.rougeL.toFixed(3),
      r.deterministic.citationGroundingRatio.toFixed(3),
      r.latencySeconds.toFixed(3),
      r.costUsd.toFixed(6),
      `"${r.failureCategory}"`,
      `"${r.humanReview.status}"`,
      `"${r.question.replace(/"/g, '""')}"`,
      `"${r.expectedAnswer.replace(/"/g, '""')}"`,
      `"${r.generatedAnswer.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Generate JSON
  const generateJSON = (): string => {
    return JSON.stringify(run, null, 2);
  };

  // Generate Markdown
  const generateMarkdown = (): string => {
    return `# AI Reliability Intelligence Report: ${run.name}

- **Dataset**: ${run.datasetName} (${run.datasetVersion})
- **RAG Strategy**: ${run.ragStrategy}
- **Model**: ${run.modelName}
- **Timestamp**: ${run.createdAt}
- **Total Test Cases**: ${run.totalCases}

## 1. Executive Reliability Metrics

| Metric | Score | SLA Target | Status |
| :--- | :--- | :--- | :--- |
| Faithfulness (Hallucination Risk) | ${(run.averageScores.faithfulness * 100).toFixed(1)}% | >= 85.0% | ${run.averageScores.faithfulness >= 0.85 ? 'PASSED' : 'BREACH'} |
| Answer Relevancy | ${(run.averageScores.answerRelevancy * 100).toFixed(1)}% | >= 80.0% | ${run.averageScores.answerRelevancy >= 0.80 ? 'PASSED' : 'BREACH'} |
| Contextual Precision | ${(run.averageScores.contextualPrecision * 100).toFixed(1)}% | >= 75.0% | ${run.averageScores.contextualPrecision >= 0.75 ? 'PASSED' : 'BREACH'} |
| Contextual Recall | ${(run.averageScores.contextualRecall * 100).toFixed(1)}% | >= 75.0% | ${run.averageScores.contextualRecall >= 0.75 ? 'PASSED' : 'BREACH'} |
| Token F1 (Deterministic) | ${(run.averageScores.tokenF1 * 100).toFixed(1)}% | >= 70.0% | ${run.averageScores.tokenF1 >= 0.70 ? 'PASSED' : 'BREACH'} |
| Citation Grounding Ratio | ${(run.averageScores.citationGroundingRatio * 100).toFixed(1)}% | >= 80.0% | ${run.averageScores.citationGroundingRatio >= 0.80 ? 'PASSED' : 'BREACH'} |

## 2. FinOps & Latency Economics

- **P50 Latency**: ${run.performance.p50LatencySec.toFixed(2)}s
- **P95 Latency**: ${run.performance.p95LatencySec.toFixed(2)}s
- **Cost / 1k Queries**: $${run.performance.costPer1kQueries.toFixed(3)}
- **Total Run Footprint**: ${run.performance.totalTokens} tokens ($${run.performance.totalCostUsd.toFixed(5)})

## 3. Failure Analysis Breakdown

- Retrieval Starvation: ${run.failureCounts.retrieval_starvation} cases
- Context Dilution: ${run.failureCounts.context_dilution} cases
- Generator Hallucination: ${run.failureCounts.generator_hallucination} cases
- Conflicting Sources: ${run.failureCounts.conflicting_sources} cases
- Clean Passes: ${run.failureCounts.none} cases
`;
  };

  const getContent = () => {
    if (activeFormat === 'csv') return generateCSV();
    if (activeFormat === 'json') return generateJSON();
    return generateMarkdown();
  };

  const handleDownload = () => {
    const content = getContent();
    const mime = activeFormat === 'csv' ? 'text/csv' : activeFormat === 'json' ? 'application/json' : 'text/markdown';
    const ext = activeFormat === 'csv' ? 'csv' : activeFormat === 'json' ? 'json' : 'md';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reliability_report_${run.id}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-base">Export Reliability Evaluation Reports</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveFormat('csv')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeFormat === 'csv'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>CSV Dataset Export</span>
          </button>

          <button
            onClick={() => setActiveFormat('json')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeFormat === 'json'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>JSON Run Manifest</span>
          </button>

          <button
            onClick={() => setActiveFormat('markdown')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeFormat === 'markdown'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Markdown Executive Audit</span>
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-5">
          <pre className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto scrollbar-thin">
            {getContent()}
          </pre>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Exported data includes all deterministic metrics, LLM explanations, and human audit flags.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
