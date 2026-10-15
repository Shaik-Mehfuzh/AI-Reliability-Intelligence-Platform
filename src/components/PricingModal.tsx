import React, { useState } from 'react';
import { X, DollarSign, Check, Info } from 'lucide-react';
import { ModelPricing } from '../types/reliability';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingConfig: Record<string, ModelPricing>;
  onSavePricing: (newConfig: Record<string, ModelPricing>) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  pricingConfig,
  onSavePricing
}) => {
  const [config, setConfig] = useState<Record<string, ModelPricing>>(pricingConfig);

  if (!isOpen) return null;

  const handleChange = (modelName: string, field: 'promptCostPer1M' | 'completionCostPer1M', value: number) => {
    setConfig(prev => ({
      ...prev,
      [modelName]: {
        ...prev[modelName],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSavePricing(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">Model Pricing & FinOps Schedule</h3>
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
            Configure prompt and completion costs per 1,000,000 tokens in USD. Changes immediately update all cost estimations, latency-cost Pareto frontiers, and budget simulations.
          </p>

          <div className="divide-y divide-slate-800/80">
            {Object.entries(config).map(([modelName, pricing]) => (
              <div key={modelName} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-semibold text-slate-200 block">{modelName}</span>
                  <span className="text-[11px] text-slate-500">{pricing.provider}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Prompt / 1M ($):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={pricing.promptCostPer1M}
                      onChange={(e) => handleChange(modelName, 'promptCostPer1M', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Completion / 1M ($):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={pricing.completionCostPer1M}
                      onChange={(e) => handleChange(modelName, 'completionCostPer1M', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
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
            <span>Apply Pricing Updates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
