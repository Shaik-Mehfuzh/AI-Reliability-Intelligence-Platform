import React, { useState } from 'react';
import { X, ShieldAlert, Check, Plus, Trash2 } from 'lucide-react';
import { QualityGateRule } from '../types/reliability';

interface QualityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: QualityGateRule[];
  onSaveRules: (newRules: QualityGateRule[]) => void;
}

export const QualityGateModal: React.FC<QualityGateModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules
}) => {
  const [currentRules, setCurrentRules] = useState<QualityGateRule[]>(rules);

  if (!isOpen) return null;

  const handleThresholdChange = (id: string, newThreshold: number) => {
    setCurrentRules(prev => prev.map(r => r.id === id ? { ...r, threshold: newThreshold } : r));
  };

  const handleSeverityChange = (id: string, severity: 'error' | 'warning') => {
    setCurrentRules(prev => prev.map(r => r.id === id ? { ...r, severity } : r));
  };

  const handleDeleteRule = (id: string) => {
    setCurrentRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = () => {
    onSaveRules(currentRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-base">Quality Gate & CI Regression Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            Define programmatic SLA thresholds that evaluate candidate model configurations and RAG indexes. Breaches can either warn or fail continuous integration pipelines.
          </p>

          <div className="space-y-3">
            {currentRules.map((rule) => (
              <div key={rule.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">{rule.name}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={rule.severity}
                      onChange={(e) => handleSeverityChange(rule.id, e.target.value as 'error' | 'warning')}
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border focus:outline-none ${
                        rule.severity === 'error' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      <option value="error">ERROR (Blocks CI)</option>
                      <option value="warning">WARNING (Soft Alert)</option>
                    </select>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-[11px] text-slate-400">{rule.description}</span>

                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs font-mono text-slate-300">{rule.operator}</span>
                    <input
                      type="number"
                      step="0.05"
                      value={rule.threshold}
                      onChange={(e) => handleThresholdChange(rule.id, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Save Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
};
