import React from 'react';
import { EvaluatedStock, Market } from '../types/stock';
import { SIGNAL_METADATA } from '../utils/signals';

interface MarketBreadthBarProps {
  stocks: EvaluatedStock[];
  selectedMarket: Market | 'ALL';
  onSelectMarket: (market: Market | 'ALL') => void;
}

export const MarketBreadthBar: React.FC<MarketBreadthBarProps> = ({
  stocks,
  selectedMarket,
  onSelectMarket,
}) => {
  // Counts by market
  const markets: { id: Market | 'ALL'; label: string; count: number; flag: string }[] = [
    { id: 'ALL', label: 'All Markets', count: stocks.length, flag: '🌐' },
    { id: 'Singapore', label: 'Singapore (STI 30)', count: stocks.filter(s => s.market === 'Singapore').length, flag: '🇸🇬' },
    { id: 'China', label: 'China (CSI 10)', count: stocks.filter(s => s.market === 'China').length, flag: '🇨🇳' },
    { id: 'Hong Kong', label: 'Hong Kong (HSI 10)', count: stocks.filter(s => s.market === 'Hong Kong').length, flag: '🇭🇰' },
    { id: 'US', label: 'US (S&P/Dow 12)', count: stocks.filter(s => s.market === 'US').length, flag: '🇺🇸' },
  ];

  // Active subset based on market filter
  const activeStocks = selectedMarket === 'ALL'
    ? stocks
    : stocks.filter(s => s.market === selectedMarket);

  const strongBuyCount = activeStocks.filter(s => s.finalSignal === 'STRONG_BUY').length;
  const buyCount = activeStocks.filter(s => s.finalSignal === 'BUY').length;
  const holdCount = activeStocks.filter(s => s.finalSignal === 'HOLD').length;
  const sellCount = activeStocks.filter(s => s.finalSignal === 'SELL').length;
  const strongSellCount = activeStocks.filter(s => s.finalSignal === 'STRONG_SELL').length;

  const total = activeStocks.length || 1;
  const bullishPct = Math.round(((strongBuyCount + buyCount) / total) * 100);
  const neutralPct = Math.round((holdCount / total) * 100);
  const bearishPct = Math.round(((sellCount + strongSellCount) / total) * 100);

  return (
    <div className="bg-[#0e1420] border-b border-slate-800/80 px-6 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Market Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {markets.map((m) => {
            const isActive = selectedMarket === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMarket(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-700/80 text-white shadow-sm ring-1 ring-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{m.flag}</span>
                <span>{m.label}</span>
                <span className="font-mono text-[11px] opacity-70">({m.count})</span>
              </button>
            );
          })}
        </div>

        {/* Aggregate Breadth Bar & Conviction Summary */}
        <div className="flex items-center gap-4 text-xs">
          {/* Signal conviction proportion bar */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Universe Breadth:</span>
            <div className="w-36 h-2 rounded-full overflow-hidden flex bg-slate-800 ring-1 ring-slate-700/50">
              <div
                style={{ width: `${(strongBuyCount + buyCount) / total * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Bullish: ${bullishPct}%`}
              />
              <div
                style={{ width: `${holdCount / total * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Neutral: ${neutralPct}%`}
              />
              <div
                style={{ width: `${(sellCount + strongSellCount) / total * 100}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Bearish: ${bearishPct}%`}
              />
            </div>
            <span className="font-mono text-[11px] text-emerald-400 font-semibold">{bullishPct}% Bull</span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[11px] text-amber-400 font-semibold">{neutralPct}% Hold</span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[11px] text-rose-400 font-semibold">{bearishPct}% Bear</span>
          </div>

          {/* Quick Signal Pill Counters */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SB: {strongBuyCount}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-950/40 border border-teal-500/20 text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>B: {buyCount}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>H: {holdCount}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-950/40 border border-orange-500/20 text-orange-300">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>S: {sellCount}</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>SS: {strongSellCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
