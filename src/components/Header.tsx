import React, { useState } from 'react';
import { ViewMode } from '../types/stock';
import {
  SlidersHorizontal,
  Download,
  Kanban,
  Table,
  BarChart2,
  GitBranch,
  RefreshCw,
  Clock,
  Globe,
  ChevronDown,
} from 'lucide-react';

export interface MarketSessionTag {
  market: string;
  code: string;
  exchange: string;
  localTime: string;
  localDate?: string;
  isOpen: boolean;
  status: string;
  tradingHours?: string;
}

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  onOpenQuantToGoMcp?: () => void;
  totalStocksCount: number;
  lastUpdatedTime?: string;
  isSyncing?: boolean;
  onTriggerSync?: () => void;
  marketSessions?: MarketSessionTag[];
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenSettings,
  onExportCsv,
  onOpenQuantToGoMcp,
  totalStocksCount,
  lastUpdatedTime,
  isSyncing,
  onTriggerSync,
  marketSessions,
}) => {
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0e1422]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Live MCP Backend Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm tracking-wider">
            QT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Multi-Market Equity Screener
              </h1>

              {/* MCP Live Status Pill */}
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold shadow-sm">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <span>MCP Live</span>
                  {lastUpdatedTime && (
                    <span className="text-slate-400 font-normal">
                      · {new Date(lastUpdatedTime).toLocaleTimeString()}
                    </span>
                  )}
                </span>

                {onTriggerSync && (
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="p-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-colors"
                    title="Sync latest prices from QuantToGo MCP backend"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-normal mt-0.5">
              <span>{totalStocksCount} Stocks</span>
              <span aria-hidden="true">·</span>
              <span>4 Markets</span>
              <span aria-hidden="true">·</span>
              <span>Time-Updated Quotes (QuantToGo MCP)</span>
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

        {/* Zone 3: Market Clock, MCP Hub, Parameters & Export */}
        <div className="flex items-center gap-2">
          {/* Regional Market Hours Dropdown */}
          {marketSessions && marketSessions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-[#131b2c] hover:bg-[#1a253d] border border-slate-800 rounded-lg transition-colors"
                title="View regional exchange trading times"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xl:inline">Regional Times</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showSessionsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0e1422] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Exchange Clocks (MCP Source)</span>
                    </span>
                    <button
                      onClick={() => setShowSessionsDropdown(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  {marketSessions.map((s) => (
                    <div
                      key={s.market}
                      className="flex items-center justify-between p-1.5 rounded bg-[#121929] border border-slate-800/80"
                    >
                      <div>
                        <div className="font-bold text-slate-200 text-[11px]">
                          {s.market} ({s.code})
                        </div>
                        <div className="text-[10px] text-slate-500">{s.exchange}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-400 font-bold text-[11px]">{s.localTime}</div>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            s.isOpen
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
