import React from 'react';
import { EvaluatedStock } from '../types/stock';
import { SIGNAL_METADATA } from '../utils/signals';

interface SectorMatrixViewProps {
  stocks: EvaluatedStock[];
  onSelectStock: (stock: EvaluatedStock) => void;
}

export const SectorMatrixView: React.FC<SectorMatrixViewProps> = ({
  stocks,
  onSelectStock,
}) => {
  // Group stocks by sector
  const sectorGroups: Record<string, EvaluatedStock[]> = {};
  for (const stock of stocks) {
    if (!sectorGroups[stock.sector]) {
      sectorGroups[stock.sector] = [];
    }
    sectorGroups[stock.sector].push(stock);
  }

  const sortedSectors = Object.entries(sectorGroups).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <div className="p-6 max-w-[1720px] mx-auto">
      <div className="mb-4">
        <h2 className="text-base font-bold text-white mb-1">
          Sector Valuation & Signal Dispersion Matrix
        </h2>
        <p className="text-xs text-slate-400">
          Compare sector average trailing P/E multiples and observe how Price, Volume, and Valuation signals distribute across industry peer groups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSectors.map(([sectorName, sectorStocks]) => {
          const avgPE = (
            sectorStocks.reduce((sum, s) => sum + s.pe, 0) / sectorStocks.length
          ).toFixed(1);

          const strongBuys = sectorStocks.filter((s) => s.finalSignal === 'STRONG_BUY').length;
          const buys = sectorStocks.filter((s) => s.finalSignal === 'BUY').length;
          const holds = sectorStocks.filter((s) => s.finalSignal === 'HOLD').length;
          const sells = sectorStocks.filter((s) => s.finalSignal === 'SELL').length;
          const strongSells = sectorStocks.filter((s) => s.finalSignal === 'STRONG_SELL').length;

          return (
            <div
              key={sectorName}
              className="bg-[#0d121f] rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between"
            >
              <div>
                {/* Sector Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{sectorName}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {sectorStocks.length} {sectorStocks.length === 1 ? 'stock' : 'stocks'} across markets
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Sector Avg P/E
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      {avgPE}x
                    </span>
                  </div>
                </div>

                {/* Signal Distribution Bar */}
                <div className="mb-3">
                  <div className="text-[10px] text-slate-400 mb-1 flex justify-between font-mono">
                    <span>Conviction Distribution</span>
                    <span>
                      {strongBuys + buys} Bull · {holds} Hold · {sells + strongSells} Bear
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
                    {strongBuys > 0 && (
                      <div
                        style={{ width: `${(strongBuys / sectorStocks.length) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Strong Buy: ${strongBuys}`}
                      />
                    )}
                    {buys > 0 && (
                      <div
                        style={{ width: `${(buys / sectorStocks.length) * 100}%` }}
                        className="bg-teal-500 h-full"
                        title={`Buy: ${buys}`}
                      />
                    )}
                    {holds > 0 && (
                      <div
                        style={{ width: `${(holds / sectorStocks.length) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`Hold: ${holds}`}
                      />
                    )}
                    {sells > 0 && (
                      <div
                        style={{ width: `${(sells / sectorStocks.length) * 100}%` }}
                        className="bg-orange-500 h-full"
                        title={`Sell: ${sells}`}
                      />
                    )}
                    {strongSells > 0 && (
                      <div
                        style={{ width: `${(strongSells / sectorStocks.length) * 100}%` }}
                        className="bg-rose-500 h-full"
                        title={`Strong Sell: ${strongSells}`}
                      />
                    )}
                  </div>
                </div>

                {/* Stock Chips in this Sector */}
                <div className="space-y-1.5 mt-3">
                  {sectorStocks.map((stock) => {
                    const signalMeta = SIGNAL_METADATA[stock.finalSignal];
                    return (
                      <div
                        key={stock.id}
                        onClick={() => onSelectStock(stock)}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#111726] hover:bg-[#161f33] border border-slate-800/80 transition-colors cursor-pointer text-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {stock.ticker}
                          </span>
                          <span className="text-slate-400 truncate max-w-[130px]">
                            {stock.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 tabular-nums">
                            {stock.pe.toFixed(1)}x
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${signalMeta.border} ${signalMeta.bg} ${signalMeta.text}`}
                          >
                            {signalMeta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
