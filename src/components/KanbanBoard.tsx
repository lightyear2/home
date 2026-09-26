import React from 'react';
import { EvaluatedStock, FinalSignalType } from '../types/stock';
import { StockCard } from './StockCard';
import { SIGNAL_METADATA } from '../utils/signals';
import { Sparkles, ShieldAlert, ArrowUpRight, Scale, Info } from 'lucide-react';

interface KanbanBoardProps {
  stocks: EvaluatedStock[];
  watchlist: Set<string>;
  onToggleWatchlist: (ticker: string, e: React.MouseEvent) => void;
  onSelectStock: (stock: EvaluatedStock) => void;
}

const COLUMNS: {
  id: FinalSignalType;
  icon: React.ReactNode;
  subtitle: string;
}[] = [
  {
    id: 'STRONG_BUY',
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
    subtitle: '3x Buy (Price < MA, Vol > Avg, Low P/E)',
  },
  {
    id: 'BUY',
    icon: <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />,
    subtitle: '2x Buy (Bullish Dominant)',
  },
  {
    id: 'HOLD',
    icon: <Scale className="w-3.5 h-3.5 text-amber-400" />,
    subtitle: 'Neutral / Mixed signals',
  },
  {
    id: 'SELL',
    icon: <ArrowUpRight className="w-3.5 h-3.5 text-orange-400 rotate-90" />,
    subtitle: '2x Sell (Bearish Dominant)',
  },
  {
    id: 'STRONG_SELL',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    subtitle: '3x Sell (Price > MA, Vol < Avg, High P/E)',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stocks,
  watchlist,
  onToggleWatchlist,
  onSelectStock,
}) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colMeta = SIGNAL_METADATA[col.id];
          const columnStocks = stocks.filter((s) => s.finalSignal === col.id);
          const avgChange =
            columnStocks.length > 0
              ? columnStocks.reduce((sum, s) => sum + s.changePercent, 0) / columnStocks.length
              : 0;

          return (
            <div
              key={col.id}
              className="flex flex-col bg-[#0d121f] rounded-xl border border-slate-800/80 overflow-hidden min-h-[580px]"
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b ${colMeta.border} ${colMeta.bg}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colMeta.dot}`} />
                    <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{colMeta.label}</span>
                    </h3>
                  </div>

                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-200">
                    {columnStocks.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span className="truncate" title={col.subtitle}>
                    {col.subtitle}
                  </span>
                  {columnStocks.length > 0 && (
                    <span
                      className={`font-mono tabular-nums font-semibold shrink-0 ml-1.5 ${
                        avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {avgChange >= 0 ? '+' : ''}
                      {avgChange.toFixed(2)}% avg
                    </span>
                  )}
                </div>
              </div>

              {/* Column Content / Cards List */}
              <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-250px)]">
                {columnStocks.length > 0 ? (
                  columnStocks.map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      isWatchlisted={watchlist.has(stock.ticker)}
                      onToggleWatchlist={onToggleWatchlist}
                      onSelectStock={onSelectStock}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg m-1">
                    <Info className="w-5 h-5 mb-2 opacity-50" />
                    <p className="text-xs font-medium text-slate-400 mb-1">No stocks in this signal</p>
                    <p className="text-[11px] text-slate-500 max-w-[180px]">
                      Try changing market or sector filters above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
