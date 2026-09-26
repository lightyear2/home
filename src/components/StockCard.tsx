import React from 'react';
import { EvaluatedStock } from '../types/stock';
import { formatCurrency, formatVolume, MARKET_BADGES } from '../utils/signals';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockCardProps {
  stock: EvaluatedStock;
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string, e: React.MouseEvent) => void;
  onSelectStock: (stock: EvaluatedStock) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  isWatchlisted,
  onToggleWatchlist,
  onSelectStock,
}) => {
  const marketInfo = MARKET_BADGES[stock.market];
  const isPositive = stock.changePercent >= 0;
  const isZero = stock.changePercent === 0;

  // Render a tiny SVG sparkline of the 50-day price history with 50-DMA line
  const minPrice = Math.min(...stock.history50d, stock.ma50) * 0.98;
  const maxPrice = Math.max(...stock.history50d, stock.ma50) * 1.02;
  const priceRange = maxPrice - minPrice || 1;
  const width = 110;
  const height = 30;

  const points = stock.history50d
    .map((p, i) => {
      const x = (i / (stock.history50d.length - 1)) * width;
      const y = height - ((p - minPrice) / priceRange) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const maY = (height - ((stock.ma50 - minPrice) / priceRange) * height).toFixed(1);

  // Signal color helpers
  const getSignalBadge = (signal: 'BUY' | 'NEUTRAL' | 'SELL') => {
    switch (signal) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'SELL':
        return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
      case 'NEUTRAL':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    }
  };

  return (
    <div
      onClick={() => onSelectStock(stock)}
      className="group relative bg-[#111726] hover:bg-[#151d30] border border-slate-800/90 hover:border-slate-700 rounded-lg p-3.5 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Top Row: Ticker, Name, Market & Watchlist */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-sm text-white tracking-wide">
              {stock.ticker}
            </span>
            <span className="text-[11px] text-slate-400">
              {marketInfo.flag}
            </span>
          </div>
          <div className="text-xs text-slate-300 truncate font-normal" title={stock.name}>
            {stock.name}
          </div>
        </div>

        <button
          onClick={(e) => onToggleWatchlist(stock.ticker, e)}
          className="p-1 rounded text-slate-500 hover:text-amber-400 transition-colors shrink-0"
          title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-label={isWatchlisted ? `Remove ${stock.ticker} from watchlist` : `Add ${stock.ticker} to watchlist`}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              isWatchlisted ? 'fill-amber-400 text-amber-400' : 'stroke-current'
            }`}
          />
        </button>
      </div>

      {/* Second Row: Clean Metadata with QuantToGo MCP ticker */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2.5 flex-wrap">
        <span className="truncate max-w-[105px]">{stock.sector}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span
          className="font-mono text-[10px] text-cyan-400 font-medium bg-cyan-500/10 px-1 rounded border border-cyan-500/20"
          title={`QuantToGo MCP: ${stock.quantToGoSymbol} (github.com/QuantToGo/quanttogo-mcp)`}
        >
          QTG: {stock.quantToGoSymbol}
        </span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono text-[10px] text-slate-400">Cap {stock.marketCap}</span>
      </div>

      {/* Third Row: Price, 24h Change & 50-DMA Sparkline */}
      <div className="flex items-baseline justify-between gap-2 py-1.5 border-t border-slate-800/60 mb-2.5">
        <div>
          <div className="font-mono text-base font-bold text-slate-100 tabular-nums">
            {formatCurrency(stock.currency)}{stock.price.toFixed(2)}
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
              isPositive ? 'text-emerald-400' : isZero ? 'text-slate-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isZero ? (
              <Minus className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* 50-Day Mini Price Sparkline with 50-DMA Dashed Benchmark */}
        <div className="flex flex-col items-end">
          <svg width={width} height={height} className="overflow-visible">
            {/* 50-DMA reference line */}
            <line
              x1="0"
              y1={maY}
              x2={width}
              y2={maY}
              stroke="#64748b"
              strokeDasharray="2 2"
              strokeWidth="0.8"
              opacity="0.7"
            />
            {/* 50-day price polyline */}
            <polyline
              fill="none"
              stroke={
                stock.priceSignal.signal === 'BUY'
                  ? '#34d399'
                  : stock.priceSignal.signal === 'SELL'
                  ? '#f87171'
                  : '#fbbf24'
              }
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
            50-DMA: {stock.ma50.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Fourth Row: Triple Signal Alignment Matrix */}
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/50 text-[10px]">
        {/* Signal 1: Price vs 50-DMA */}
        <div className="bg-[#0e1422] p-1.5 rounded border border-slate-800/80">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-slate-400">Price</span>
            <span
              className={`px-1 py-0.2 rounded font-semibold text-[9px] border ${getSignalBadge(
                stock.priceSignal.signal
              )}`}
            >
              {stock.priceSignal.signal}
            </span>
          </div>
          <div className="font-mono text-slate-300 tabular-nums truncate">
            {stock.priceSignal.deltaPercent >= 0 ? '+' : ''}
            {stock.priceSignal.deltaPercent.toFixed(1)}% MA
          </div>
        </div>

        {/* Signal 2: Volume vs Weekly Avg */}
        <div className="bg-[#0e1422] p-1.5 rounded border border-slate-800/80">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-slate-400">Vol</span>
            <span
              className={`px-1 py-0.2 rounded font-semibold text-[9px] border ${getSignalBadge(
                stock.volumeSignal.signal
              )}`}
            >
              {stock.volumeSignal.signal}
            </span>
          </div>
          <div className="font-mono text-slate-300 tabular-nums truncate">
            {(stock.currentVolume / stock.weeklyAvgVolume).toFixed(2)}x Wk
          </div>
        </div>

        {/* Signal 3: P/E vs Sector Avg */}
        <div className="bg-[#0e1422] p-1.5 rounded border border-slate-800/80">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-slate-400">P/E</span>
            <span
              className={`px-1 py-0.2 rounded font-semibold text-[9px] border ${getSignalBadge(
                stock.peSignal.signal
              )}`}
            >
              {stock.peSignal.signal}
            </span>
          </div>
          <div className="font-mono text-slate-300 tabular-nums truncate">
            {stock.pe.toFixed(1)}x ({stock.peSignal.deltaPercent <= 0 ? '' : '+'}
            {stock.peSignal.deltaPercent.toFixed(0)}%)
          </div>
        </div>
      </div>
    </div>
  );
};
