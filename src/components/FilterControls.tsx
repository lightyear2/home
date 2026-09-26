import React from 'react';
import { FilterState, FinalSignalType } from '../types/stock';
import { Search, Star, RotateCcw, ArrowUpDown, X } from 'lucide-react';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  availableSectors: string[];
  totalFiltered: number;
  totalAvailable: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableSectors,
  totalFiltered,
  totalAvailable,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.sector !== 'ALL' ||
    filters.finalSignal !== 'ALL' ||
    filters.watchlistOnly;

  return (
    <div className="bg-[#0b0f17] border-b border-slate-800/80 px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Search & Selectors Group */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[320px]">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-[320px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search ticker, company, or sector..."
              className="w-full bg-[#131b2c] border border-slate-800 focus:border-slate-600 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sector Dropdown */}
          <div className="relative">
            <select
              value={filters.sector}
              onChange={(e) => onFilterChange('sector', e.target.value)}
              aria-label="Filter stocks by sector"
              className="bg-[#131b2c] border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-600 cursor-pointer"
            >
              <option value="ALL">All Sectors ({availableSectors.length})</option>
              {availableSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Final Signal Dropdown */}
          <div className="relative">
            <select
              value={filters.finalSignal}
              onChange={(e) => onFilterChange('finalSignal', e.target.value as FinalSignalType | 'ALL')}
              aria-label="Filter stocks by final signal"
              className="bg-[#131b2c] border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-600 cursor-pointer font-medium"
            >
              <option value="ALL">All Signals</option>
              <option value="STRONG_BUY">Strong Buy (3x Buy)</option>
              <option value="BUY">Buy (Bullish Dominant)</option>
              <option value="HOLD">Hold (Neutral / Balanced)</option>
              <option value="SELL">Sell (Bearish Dominant)</option>
              <option value="STRONG_SELL">Strong Sell (3x Sell)</option>
            </select>
          </div>

          {/* Watchlist Toggle */}
          <button
            onClick={() => onFilterChange('watchlistOnly', !filters.watchlistOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filters.watchlistOnly
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                : 'bg-[#131b2c] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                filters.watchlistOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
              }`}
            />
            <span>Watchlist</span>
          </button>

          {/* Reset Filters button if any filter applied */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Sort & Counter Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value as FilterState['sortBy'])}
              aria-label="Sort stocks by metric"
              className="bg-[#131b2c] border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="ticker">Ticker</option>
              <option value="changePercent">24h Change %</option>
              <option value="ma50Delta">50-DMA Distance %</option>
              <option value="volumeRatio">Volume Surge Ratio</option>
              <option value="pe">P/E Ratio</option>
            </select>
            <button
              onClick={() => onFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-[#131b2c] border border-slate-800 rounded font-mono text-[11px] text-slate-300 hover:text-white"
              title="Toggle sort direction"
            >
              {filters.sortDirection.toUpperCase()}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 border-l border-slate-800 pl-3">
            Showing <span className="text-slate-200 font-semibold">{totalFiltered}</span> of {totalAvailable}
          </div>
        </div>
      </div>
    </div>
  );
};
