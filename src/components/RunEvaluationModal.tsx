import React, { useState } from 'react';
import { X, Play, RefreshCw, CheckCircle2, Layers, Cpu, Database } from 'lucide-react';
import { RAGStrategy, EvaluationRun } from '../types/reliability';

interface RunEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated: (newRun: EvaluationRun) => void;
}

export const RunEvaluationModal: React.FC<RunEvaluationModalProps> = ({
  isOpen,
  onClose,
  onRunCreated
}) => {
  const [name, setName] = useState('Production Candidate - Hybrid Qdrant + Gemini 2.5 Flash');
  const [dataset, setDataset] = useState('v2.0-legal-bench');
  const [strategy, setStrategy] = useState<RAGStrategy>('vector_hybrid');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [topK, setTopK] = useState(6);
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(128);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleLaunch = () => {
    setIsRunning(true);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            // Build new run
            const newRun: EvaluationRun = {
              id: `run-${Date.now()}`,
              name,
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              datasetVersion: dataset,
              datasetName: dataset === 'v2.0-legal-bench' ? 'Isaacus Legal RAG Benchmark' : 'FinTech Regulatory QA',
              totalCases: 6,
              ragStrategy: strategy,
              modelName: model,
              embeddingModel: 'text-embedding-3-small + BM25',
              topK,
              chunkSize,
              chunkOverlap,
              averageScores: {
                faithfulness: 0.945,
                answerRelevancy: 0.960,
                contextualPrecision: 0.910,
                contextualRecall: 0.925,
                gEvalCorrectness: 0.938,
                tokenF1: 0.865,
                rougeL: 0.835,
                citationGroundingRatio: 0.950
              },
              performance: {
                p50LatencySec: 0.92,
                p95LatencySec: 1.75,
                avgLatencySec: 1.05,
                totalCostUsd: 0.00310,
                costPer1kQueries: 0.516,
                totalTokens: 4980,
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
            };

            onRunCreated(newRun);
            setIsRunning(false);
            onClose();
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-indigo-400 fill-current" />
            <h3 className="font-bold text-slate-100 text-base">Launch New Reliability Evaluation</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Experiment Run Label:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Benchmark Dataset:</label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="v2.0-legal-bench">Isaacus Legal RAG Bench (v2.0)</option>
                <option value="v1.2-fintech-qa">FinTech Regulatory QA (v1.2)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">RAG Strategy Architecture:</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as RAGStrategy)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="vector_hybrid">vector_hybrid (Qdrant + BM25)</option>
                <option value="vector_semantic">vector_semantic (ChromaDB Dense)</option>
                <option value="graph_rag">graph_rag (Neo4j Multi-Hop)</option>
                <option value="filesystem_rag">filesystem_rag (Agentic File Exploration)</option>
                <option value="rlm_rag">rlm_rag (Recursive Language Model)</option>
                <option value="google_vertex_search">google_vertex_search (Managed)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Evaluation Target Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast / Low Cost)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (Balanced)</option>
                <option value="gpt-4o">GPT-4o (Frontier Quality)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="llama-3-8b-instruct">Llama 3 8B Instruct (Local)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Top-K Retrieved Chunks:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 4)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Progress Bar during run */}
          {isRunning && (
            <div className="p-4 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  Executing RAG retrieval and DeepEval judge verification...
                </span>
                <span className="font-mono text-indigo-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            <span>{isRunning ? 'Evaluating...' : 'Start Evaluation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
