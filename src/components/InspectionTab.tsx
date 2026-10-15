import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  Tag, 
  ChevronRight,
  UserCheck,
  Edit3,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { TestCaseResult, ReviewStatus, FailureCategory, QuestionDifficulty } from '../types/reliability';

interface InspectionTabProps {
  cases: TestCaseResult[];
  onUpdateReview: (caseId: string, status: ReviewStatus, notes?: string, overrideFaithfulness?: number) => void;
}

export const InspectionTab: React.FC<InspectionTabProps> = ({ cases, onUpdateReview }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedFailure, setSelectedFailure] = useState<string>('all');
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<string>('all');

  // Human review modal / edit state
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [overrideScore, setOverrideScore] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  // Filtering
  const filteredCases = cases.filter(c => {
    if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
    if (selectedFailure !== 'all' && c.failureCategory !== selectedFailure) return false;
    if (selectedReviewFilter !== 'all' && c.humanReview.status !== selectedReviewFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inQuestion = c.question.toLowerCase().includes(q);
      const inAnswer = c.generatedAnswer.toLowerCase().includes(q);
      const inExpected = c.expectedAnswer.toLowerCase().includes(q);
      if (!inQuestion && !inAnswer && !inExpected) return false;
    }
    return true;
  });

  const handleSelectCase = (c: TestCaseResult) => {
    setSelectedCaseId(c.id);
    setActiveClaimId(null);
    setHighlightedChunkId(null);
    setReviewNotes(c.humanReview.notes || '');
    setOverrideScore(c.humanReview.overriddenScore?.faithfulness?.toString() || '');
    setSaveSuccessMsg(false);
  };

  const handleSaveReview = (status: ReviewStatus) => {
    if (!activeCase) return;
    const numOverride = overrideScore ? parseFloat(overrideScore) : undefined;
    onUpdateReview(activeCase.id, status, reviewNotes, numOverride);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleClaimClick = (claimId: string, chunkIds: string[]) => {
    setActiveClaimId(claimId);
    if (chunkIds.length > 0) {
      setHighlightedChunkId(chunkIds[0]);
    } else {
      setHighlightedChunkId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions, answers, ground truth..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Failure Filter */}
          <select
            value={selectedFailure}
            onChange={(e) => setSelectedFailure(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Failure Types</option>
            <option value="none">No Failures (Passed)</option>
            <option value="retrieval_starvation">Retrieval Starvation</option>
            <option value="context_dilution">Context Dilution</option>
            <option value="generator_hallucination">Hallucination / Drift</option>
            <option value="conflicting_sources">Conflicting Sources</option>
          </select>

          {/* Review Filter */}
          <select
            value={selectedReviewFilter}
            onChange={(e) => setSelectedReviewFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Review Statuses</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="verified_correct">Verified Correct</option>
            <option value="judge_incorrect">Judge Incorrect</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Left Test Cases List, Right Deep Evidence Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Test Cases List (4 columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Evaluated Test Cases ({filteredCases.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to inspect</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[820px] overflow-y-auto">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No test cases match current filter criteria.
              </div>
            ) : (
              filteredCases.map((tc) => {
                const isSelected = tc.id === activeCase?.id;
                const isPassing = tc.judge.faithfulness >= 0.85 && tc.judge.answerRelevancy >= 0.80;

                return (
                  <div
                    key={tc.id}
                    onClick={() => handleSelectCase(tc)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tc.id}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                          tc.difficulty === 'easy' ? 'bg-emerald-950 text-emerald-400' :
                          tc.difficulty === 'medium' ? 'bg-amber-950 text-amber-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {tc.difficulty}
                        </span>
                      </div>

                      <span className={`text-[11px] font-mono font-bold ${isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Faith: {(tc.judge.faithfulness * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                      {tc.question}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
                      <span>F1: {(tc.deterministic.tokenF1 * 100).toFixed(0)}%</span>
                      <span>Chunks: {tc.retrievedChunks.length}</span>
                      <span className={`${
                        tc.failureCategory === 'none' ? 'text-slate-400' : 'text-amber-400 font-semibold'
                      }`}>
                        {tc.failureCategory === 'none' ? 'Passed' : tc.failureCategory.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Deep Evidence & Citation Inspector (7 columns) */}
        {activeCase ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Case Overview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded border border-indigo-800">
                    {activeCase.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Difficulty: <strong className="text-slate-200 uppercase">{activeCase.difficulty}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Latency: <strong className="text-slate-200">{activeCase.latencySeconds.toFixed(2)}s</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    activeCase.humanReview.status === 'verified_correct' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    activeCase.humanReview.status === 'judge_incorrect' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    Review: {activeCase.humanReview.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Question */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Question / Prompt:</span>
                <p className="text-sm font-semibold text-slate-100 mt-1 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  {activeCase.question}
                </p>
              </div>

              {/* Expected Gold Answer */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected Ground Truth:</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  {activeCase.expectedAnswer}
                </p>
              </div>

              {/* Generated Answer with Interactive Claim Citations */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    Generated Model Response (Click Sentence Claims to Inspect Evidence):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Model: {activeCase.modelName}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  {activeCase.claims.map((claim) => {
                    const isActive = activeClaimId === claim.id;
                    const statusColor = 
                      claim.status === 'fully_supported' ? 'border-emerald-500/50 hover:bg-emerald-950/20' :
                      claim.status === 'partially_supported' ? 'border-amber-500/50 hover:bg-amber-950/20' :
                      'border-rose-500/60 bg-rose-950/10 hover:bg-rose-950/30';

                    return (
                      <div
                        key={claim.id}
                        onClick={() => handleClaimClick(claim.id, claim.supportingChunkIds)}
                        className={`p-2 rounded-md border text-xs cursor-pointer transition-all ${statusColor} ${
                          isActive ? 'ring-2 ring-indigo-500 bg-indigo-950/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-100 leading-relaxed font-medium">
                            {claim.sentence}
                          </span>
                          <span className={`text-[10px] whitespace-nowrap font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            claim.status === 'fully_supported' ? 'bg-emerald-950 text-emerald-300' :
                            claim.status === 'partially_supported' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                          }`}>
                            {claim.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Claim reasoning popup when active */}
                        {isActive && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                            <span>Claim Audit: {claim.reasoning}</span>
                            <span className="font-mono text-indigo-400">Confidence: {(claim.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Retrieved Context Passages */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  Retrieved Context Chunks ({activeCase.retrievedChunks.length})
                </h4>
                <span className="text-xs text-slate-400">
                  {highlightedChunkId ? `Highlighting: ${highlightedChunkId}` : 'Passages supplied to generator'}
                </span>
              </div>

              <div className="space-y-3">
                {activeCase.retrievedChunks.map((chunk, idx) => {
                  const isHighlighted = highlightedChunkId === chunk.id;
                  return (
                    <div
                      key={chunk.id}
                      className={`p-3.5 rounded-lg border text-xs transition-all ${
                        isHighlighted
                          ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-[10px]">
                            Rank #{idx + 1} ({chunk.id})
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[220px]">
                            {chunk.source} (chunk {chunk.chunkIndex})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {chunk.isGoldEvidence && (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-semibold">
                              Gold Evidence
                            </span>
                          )}
                          <span className="text-slate-300">
                            Score: {(chunk.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {chunk.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Comparison: Deterministic vs. Judge Reasoning */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Detailed Metric Scores & Judge Reasoning</span>
                <span className="text-xs font-mono text-slate-400 font-normal">
                  Judge Uncertainty: {( (1 - activeCase.judge.judgeConfidence) * 100 ).toFixed(1)}%
                </span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Faithfulness</span>
                  <span className="text-base font-bold font-mono text-indigo-300">
                    {(activeCase.judge.faithfulness * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Answer Relevancy</span>
                  <span className="text-base font-bold font-mono text-indigo-300">
                    {(activeCase.judge.answerRelevancy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Context Precision</span>
                  <span className="text-base font-bold font-mono text-indigo-300">
                    {(activeCase.judge.contextualPrecision * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Context Recall</span>
                  <span className="text-base font-bold font-mono text-indigo-300">
                    {(activeCase.judge.contextualRecall * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Deterministic Metrics row */}
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Token F1:</span>{' '}
                  <span className="text-emerald-400 font-bold">{(activeCase.deterministic.tokenF1 * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500">ROUGE-L:</span>{' '}
                  <span className="text-emerald-400 font-bold">{(activeCase.deterministic.rougeL * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Context Overlap:</span>{' '}
                  <span className="text-emerald-400 font-bold">{(activeCase.deterministic.contextLexicalOverlap * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Words:</span>{' '}
                  <span className="text-slate-200">{activeCase.deterministic.answerLengthWords}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-slate-300">Judge Rationale:</span>
                <p className="text-slate-400 leading-relaxed">{activeCase.judge.faithfulnessReason}</p>
              </div>
            </div>

            {/* Human in the Loop Audit & Review Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  Human-in-the-Loop Auditor Review
                </h4>
                {saveSuccessMsg && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
                    <Check className="h-3.5 w-3.5" /> Saved to Audit Trail
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Auditor Notes & Dispute Rationale:</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Document discrepancies between human evaluation and automated judge..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Score Override:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      placeholder="e.g. 0.95"
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveReview('verified_correct')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 text-xs font-semibold transition-colors"
                    >
                      Verify Correct
                    </button>
                    <button
                      onClick={() => handleSaveReview('judge_incorrect')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 text-xs font-semibold transition-colors"
                    >
                      Flag Judge Error
                    </button>
                    <button
                      onClick={() => handleSaveReview('disputed')}
                      className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-xs font-semibold transition-colors"
                    >
                      Dispute Case
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
            Select a test case on the left to begin deep evidence inspection.
          </div>
        )}
      </div>
    </div>
  );
};
