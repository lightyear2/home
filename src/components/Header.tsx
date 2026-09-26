import React from 'react';
import { ViewMode } from '../types/stock';
import { SlidersHorizontal, Download, Kanban, Table, BarChart2, GitBranch } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  onOpenQuantToGoMcp?: () => void;
  totalStocksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenSettings,
  onExportCsv,
  onOpenQuantToGoMcp,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0e1422]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm tracking-wider">
            QT
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Multi-Market Equity Screener
            </h1>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-normal">
              <span>62 Stocks</span>
              <span aria-hidden="true">·</span>
              <span>4 Markets</span>
              <span aria-hidden="true">·</span>
              <span>Price · Volume · P/E Signals</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Primary View Switcher */}
        <nav className="flex items-center gap-1 bg-[#131b2c] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'kanban'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'table'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Screener Table</span>
          </button>
          <button
            onClick={() => onViewModeChange('sector-matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'sector-matrix'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Sector Matrix</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {onOpenQuantToGoMcp && (
            <button
              onClick={onOpenQuantToGoMcp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
              title="QuantToGo MCP Server (github.com/QuantToGo/quanttogo-mcp)"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>QuantToGo MCP</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#131b2c] hover:bg-[#1a253d] border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
            title="Adjust 50-DMA, Volume Surge & P/E Thresholds"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Signal Parameters</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
