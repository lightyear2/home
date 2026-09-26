import React from 'react';
import { EvaluatedStock, SignalType, FinalSignalType } from '../types/stock';
import { formatCurrency, formatVolume, MARKET_BADGES, SIGNAL_METADATA } from '../utils/signals';
import { Star, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TableViewProps {
  stocks: EvaluatedStock[];
  watchlist: Set<string>;
  onToggleWatchlist: (ticker: string, e: React.MouseEvent) => void;
  onSelectStock: (stock: EvaluatedStock) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  stocks,
  watchlist,
  onToggleWatchlist,
  onSelectStock,
}) => {
  const getSignalBadge = (signal: SignalType) => {
    switch (signal) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'SELL':
        return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
      case 'NEUTRAL':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
    }
  };

  const getFinalSignalBadge = (signal: FinalSignalType) => {
    const meta = SIGNAL_METADATA[signal];
    return `${meta.text} ${meta.bg} ${meta.border}`;
  };

  return (
    <div className="p-6">
      <div className="bg-[#0d121f] rounded-xl border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121929] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4 w-10 text-center">★</th>
                <th className="py-3 px-4">Ticker / QuantToGo (QTG)</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4 text-center">Price Signal (50-DMA)</th>
                <th className="py-3 px-4 text-center">Volume Signal (Wk Avg)</th>
                <th className="py-3 px-4 text-center">P/E Signal (Sector Avg)</th>
                <th className="py-3 px-4 text-center">Final Signal</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stocks.map((stock) => {
                const marketInfo = MARKET_BADGES[stock.market];
                const isWatchlisted = watchlist.has(stock.ticker);
                const isPos = stock.changePercent >= 0;
                const isZero = stock.changePercent === 0;

                return (
                  <tr
                    key={stock.id}
                    onClick={() => onSelectStock(stock)}
                    className="hover:bg-[#141d30] transition-colors cursor-pointer group"
                  >
                    {/* Watchlist toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => onToggleWatchlist(stock.ticker, e)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                        aria-label={isWatchlisted ? `Remove ${stock.ticker} from watchlist` : `Add ${stock.ticker} to watchlist`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isWatchlisted ? 'fill-amber-400 text-amber-400' : 'stroke-current'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Ticker / Company */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white text-xs">
                          {stock.ticker}
                        </span>
                        <span
                          className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 font-medium"
                          title={`QuantToGo MCP: ${stock.quantToGoSymbol} (github.com/QuantToGo/quanttogo-mcp)`}
                        >
                          {stock.quantToGoSymbol}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {stock.name}
                      </div>
                    </td>

                    {/* Market */}
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{marketInfo.flag}</span>
                        <span>{marketInfo.code}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{stock.currency}</div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-4 font-sans text-slate-300 text-xs">
                      {stock.sector}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-slate-100 tabular-nums">
                      {formatCurrency(stock.currency)}{stock.price.toFixed(2)}
                    </td>

                    {/* 24h Change */}
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-semibold ${
                        isPos ? 'text-emerald-400' : isZero ? 'text-slate-400' : 'text-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {isPos ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isZero ? (
                          <Minus className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-[10px] opacity-75">
                        {isPos ? '+' : ''}{stock.change.toFixed(2)}
                      </div>
                    </td>

                    {/* Price Signal vs 50-DMA */}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSignalBadge(
                            stock.priceSignal.signal
                          )}`}
                        >
                          {stock.priceSignal.signal}
                        </span>
                        <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                          {stock.priceSignal.deltaPercent >= 0 ? '+' : ''}
                          {stock.priceSignal.deltaPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        DMA {stock.ma50.toFixed(2)}
                      </div>
                    </td>

                    {/* Volume Signal vs Weekly Avg */}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSignalBadge(
                            stock.volumeSignal.signal
                          )}`}
                        >
                          {stock.volumeSignal.signal}
                        </span>
                        <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                          {(stock.currentVolume / stock.weeklyAvgVolume).toFixed(2)}x
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {formatVolume(stock.currentVolume)} / {formatVolume(stock.weeklyAvgVolume)}
                      </div>
                    </td>

                    {/* P/E Signal vs Sector Avg */}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSignalBadge(
                            stock.peSignal.signal
                          )}`}
                        >
                          {stock.peSignal.signal}
                        </span>
                        <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                          {stock.pe.toFixed(1)}x
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Sec: {stock.peSignal.benchmarkValue.toFixed(1)}x ({stock.peSignal.deltaPercent <= 0 ? '' : '+'}
                        {stock.peSignal.deltaPercent.toFixed(0)}%)
                      </div>
                    </td>

                    {/* Final Signal */}
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getFinalSignalBadge(
                          stock.finalSignal
                        )}`}
                      >
                        {SIGNAL_METADATA[stock.finalSignal].label}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
