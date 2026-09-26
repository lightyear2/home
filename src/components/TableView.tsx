import React, { useState } from 'react';
import { EvaluatedStock, SignalType, FinalSignalType } from '../types/stock';
import { formatCurrency, formatVolume, MARKET_BADGES, SIGNAL_METADATA } from '../utils/signals';
import {
  NewsSentimentData,
  fetchNewsSentimentForStock,
  getSentimentBadgeProps,
} from '../utils/newsSentiment';
import { NewsSentimentModal } from './NewsSentimentModal';
import {
  Star,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

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
  // Store fetched news sentiments by ticker
  const [sentimentMap, setSentimentMap] = useState<Record<string, NewsSentimentData>>({});
  const [loadingTickers, setLoadingTickers] = useState<Set<string>>(new Set());

  // Modal inspection state for headlines
  const [modalData, setModalData] = useState<NewsSentimentData | null>(null);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);

  // Helper to fetch news sentiment for a ticker using Google Search Grounding
  const handleFetchSentiment = async (
    stock: EvaluatedStock,
    openModal = false,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    // If already in map and modal requested, just open modal
    if (sentimentMap[stock.ticker] && openModal) {
      setModalData(sentimentMap[stock.ticker]);
      return;
    }

    if (openModal) {
      setModalData(null);
      setIsModalLoading(true);
    }

    setLoadingTickers((prev) => new Set(prev).add(stock.ticker));

    try {
      const result = await fetchNewsSentimentForStock({
        ticker: stock.ticker,
        name: stock.name,
        market: stock.market,
      });

      setSentimentMap((prev) => ({ ...prev, [stock.ticker]: result }));
      if (openModal) {
        setModalData(result);
      }
    } catch (err) {
      console.error('Failed to fetch sentiment:', err);
    } finally {
      setLoadingTickers((prev) => {
        const next = new Set(prev);
        next.delete(stock.ticker);
        return next;
      });
      setIsModalLoading(false);
    }
  };

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
                {/* News Sentiment Column grounded via Google Search */}
                <th className="py-3 px-4 text-center min-w-[170px]">
                  <div className="flex items-center justify-center gap-1 text-cyan-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>News Sentiment</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-normal lowercase tracking-normal">
                    google search grounded
                  </div>
                </th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stocks.map((stock) => {
                const marketInfo = MARKET_BADGES[stock.market];
                const isWatchlisted = watchlist.has(stock.ticker);
                const isPos = stock.changePercent >= 0;
                const isZero = stock.changePercent === 0;

                const sentiment = sentimentMap[stock.ticker];
                const isLoadingSentiment = loadingTickers.has(stock.ticker);
                const badgeProps = sentiment ? getSentimentBadgeProps(sentiment.sentimentScore) : null;

                return (
                  <tr
                    key={stock.id}
                    onClick={() => {
                      onSelectStock(stock);
                      // Proactively trigger news sentiment fetch if not already loaded
                      if (!sentiment && !isLoadingSentiment) {
                        handleFetchSentiment(stock, false);
                      }
                    }}
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

                    {/* NEWS SENTIMENT SCORE COLUMN (Grounded with Google Search) */}
                    <td className="py-3 px-4 text-center font-sans">
                      {sentiment ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalData(sentiment);
                          }}
                          className="inline-flex flex-col items-center justify-center cursor-pointer group/pill"
                          title="Click to view grounded headlines & Google Search sources"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border transition-all ${badgeProps?.text} ${badgeProps?.bg} ${badgeProps?.border} group-hover/pill:brightness-125`}
                            >
                              {sentiment.sentimentScore >= 0
                                ? `+${sentiment.sentimentScore}`
                                : sentiment.sentimentScore}{' '}
                              ({badgeProps?.label})
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1 group-hover/pill:text-cyan-400">
                            <Globe className="w-2.5 h-2.5" />
                            <span>{sentiment.headlines.length} headlines</span>
                          </span>
                        </div>
                      ) : isLoadingSentiment ? (
                        <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-mono text-[11px]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px] text-slate-400">Searching...</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleFetchSentiment(stock, true, e)}
                          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/30 text-[10px] font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                          title="Search recent headlines and analyze sentiment using Google Search Grounding"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Fetch Sentiment</span>
                        </button>
                      )}
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

      {/* Headlines & News Sentiment Modal */}
      {modalData && (
        <NewsSentimentModal
          data={modalData}
          isLoading={isModalLoading}
          onRefresh={(ticker) => {
            const stock = stocks.find((s) => s.ticker === ticker);
            if (stock) handleFetchSentiment(stock, true);
          }}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
};
