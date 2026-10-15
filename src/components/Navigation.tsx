import React from 'react';
import { 
  BarChart3, 
  Search, 
  Layers, 
  Flame, 
  GitCommit, 
  TerminalSquare 
} from 'lucide-react';

export type ActiveTab = 'overview' | 'inspector' | 'comparisons' | 'failures' | 'regression' | 'playground';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreviewedCount: number;
  failureCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unreviewedCount,
  failureCount
}) => {
  const tabs = [
    {
      id: 'overview' as ActiveTab,
      label: 'Diagnostics Overview',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'inspector' as ActiveTab,
      label: 'Deep Evidence Inspector',
      icon: Search,
      badge: unreviewedCount > 0 ? `${unreviewedCount} to audit` : null,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      id: 'comparisons' as ActiveTab,
      label: 'Model & Strategy Comparison',
      icon: Layers,
      badge: 'Pareto Frontier'
    },
    {
      id: 'failures' as ActiveTab,
      label: 'Root Cause & Failure Clustering',
      icon: Flame,
      badge: failureCount > 0 ? `${failureCount} failures` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
    },
    {
      id: 'regression' as ActiveTab,
      label: 'Regression Suite & CI Gates',
      icon: GitCommit,
      badge: 'v2.0 vs v1.0'
    },
    {
      id: 'playground' as ActiveTab,
      label: 'Live Reliability Tester',
      icon: TerminalSquare,
      badge: 'Interactive'
    }
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 px-6">
      <div className="flex space-x-1 overflow-x-auto scrollbar-none py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                  tab.badgeColor || (isActive ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-800 text-slate-400 border-slate-700')
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
