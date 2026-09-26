import React, { useState, useEffect } from 'react';
import { EvaluatedStock, ScreenerConfig } from '../types/stock';
import { evaluateStock, formatCurrency, formatVolume, MARKET_BADGES, SIGNAL_METADATA } from '../utils/signals';
import { getStockQuantToGoMcpSpecs, resolveQuantToGoInfo, QUANTTOGO_STRATEGIES } from '../utils/quantToGoMcp';
import {
  X,
  Star,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Sliders,
  RotateCcw,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Code2,
  GitBranch,
  Layers,
} from 'lucide-react';

interface StockDetailModalProps {
  stock: EvaluatedStock | null;
  config: ScreenerConfig;
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  config,
  isWatchlisted,
  onToggleWatchlist,
  onClose,
}) => {
  // Simulator state: test what-if price delta % and volume delta %
  const [simPriceDeltaPct, setSimPriceDeltaPct] = useState<number>(0);
  const [simVolumeDeltaPct, setSimVolumeDeltaPct] = useState<number>(0);

  // Tab state: 'analysis' | 'quanttogo-mcp'
  const [modalTab, setModalTab] = useState<'analysis' | 'quanttogo-mcp'>('analysis');
  const [copiedMcpJson, setCopiedMcpJson] = useState<boolean>(false);
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<boolean>(false);

  // Reset simulator state when stock changes
  useEffect(() => {
    setSimPriceDeltaPct(0);
    setSimVolumeDeltaPct(0);
  }, [stock?.ticker, stock?.finalSignal]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!stock) return null;

  const marketInfo = MARKET_BADGES[stock.market];
  const sectorAvgPE = stock.peSignal.benchmarkValue;

  // Compute simulated stock if sliders are shifted
  const simPrice = Number((stock.price * (1 + simPriceDeltaPct / 100)).toFixed(2));
  const simChange = Number((stock.change + (simPrice - stock.price)).toFixed(2));
  const simChangePercent = Number((stock.changePercent + simPriceDeltaPct).toFixed(2));
  const simCurrentVolume = Math.round(stock.currentVolume * (1 + simVolumeDeltaPct / 100));
  // P/E scales with price if earnings stay constant
  const simPE = Number((stock.pe * (simPrice / stock.price)).toFixed(1));

  const simulatedStock = evaluateStock(
    {
      ...stock,
      price: simPrice,
      change: simChange,
      changePercent: simChangePercent,
      currentVolume: simCurrentVolume,
      pe: simPE,
    },
    sectorAvgPE,
    config
  );

  const activeStock = simPriceDeltaPct !== 0 || simVolumeDeltaPct !== 0 ? simulatedStock : stock;
  const finalMeta = SIGNAL_METADATA[activeStock.finalSignal];

  // SVG Chart Dimensions for 50-day price history
  const chartW = 540;
  const chartH = 160;
  const padX = 20;
  const padY = 20;

  const allPoints = [...stock.history50d, stock.ma50];
  const minVal = Math.min(...allPoints) * 0.97;
  const maxVal = Math.max(...allPoints) * 1.03;
  const rangeVal = maxVal - minVal || 1;

  const pricePoints = stock.history50d.map((val, idx) => {
    const x = padX + (idx / (stock.history50d.length - 1)) * (chartW - 2 * padX);
    const y = chartH - padY - ((val - minVal) / rangeVal) * (chartH - 2 * padY);
    return { x, y, val };
  });

  const polylinePoints = pricePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const maY = chartH - padY - ((stock.ma50 - minVal) / rangeVal) * (chartH - 2 * padY);

  // 52-week position
  const range52 = stock.high52w - stock.low52w || 1;
  const pct52 = Math.min(100, Math.max(0, ((stock.price - stock.low52w) / range52) * 100));

  const qtgInfo = resolveQuantToGoInfo(activeStock.ticker, activeStock.market);
  const matchedStrategy =
    QUANTTOGO_STRATEGIES.find((s) => s.id === qtgInfo.quantToGoStrategyId) || QUANTTOGO_STRATEGIES[0];
  const mcpSpecs = getStockQuantToGoMcpSpecs(activeStock);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0e1422] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800 bg-[#121929]/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl shrink-0">
              {marketInfo.flag}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xl font-bold text-white tracking-wide">
                  {stock.ticker}
                </span>
                <span className="text-xs text-slate-400 font-sans">
                  {marketInfo.name} ({marketInfo.code})
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{stock.sector}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-xs text-slate-400">{stock.currency}</span>
                <span className="text-slate-600">·</span>
                <a
                  href="https://github.com/QuantToGo/quanttogo-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1.5 hover:bg-cyan-500/20 transition-colors"
                  title="View Strategy on QuantToGo MCP (github.com/QuantToGo/quanttogo-mcp)"
                >
                  <GitBranch className="w-3 h-3 text-cyan-400" />
                  <span>QTG: {stock.quantToGoSymbol}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-cyan-400 opacity-70" />
                </a>
              </div>
              <h2 className="text-lg font-semibold text-slate-200 mt-0.5">{stock.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist(stock.ticker)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700/60 transition-colors"
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star
                className={`w-4 h-4 ${
                  isWatchlisted ? 'fill-amber-400 text-amber-400' : 'stroke-current'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-[#0e1422] px-6 text-xs font-medium">
          <button
            onClick={() => setModalTab('analysis')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              modalTab === 'analysis'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3-Signal Analysis & 50-DMA</span>
          </button>

          <button
            onClick={() => setModalTab('quanttogo-mcp')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              modalTab === 'quanttogo-mcp'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>QuantToGo Systematic Signals (github.com/QuantToGo/quanttogo-mcp)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {modalTab === 'analysis' && (
            <>
              {/* Key Financial Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111726] p-4 rounded-xl border border-slate-800/80">
                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">Current Price</div>
                  <div className="font-mono text-xl font-bold text-white tabular-nums">
                    {formatCurrency(stock.currency)}{activeStock.price.toFixed(2)}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-mono tabular-nums ${
                      activeStock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeStock.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {activeStock.changePercent >= 0 ? '+' : ''}
                      {activeStock.change.toFixed(2)} ({activeStock.changePercent >= 0 ? '+' : ''}
                      {activeStock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">Market Cap & Yield</div>
                  <div className="font-mono text-sm font-semibold text-slate-200">
                    {stock.marketCap}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Div Yield: <span className="text-emerald-400">{stock.dividendYield}%</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">50-Day Moving Avg</div>
                  <div className="font-mono text-sm font-semibold text-slate-200">
                    {formatCurrency(stock.currency)}{stock.ma50.toFixed(2)}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Dist: {activeStock.priceSignal.deltaPercent >= 0 ? '+' : ''}
                    {activeStock.priceSignal.deltaPercent.toFixed(2)}%
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-0.5">52-Week Range</div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{formatCurrency(stock.currency)}{stock.low52w.toFixed(2)}</span>
                    <span>{formatCurrency(stock.currency)}{stock.high52w.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct52}%` }}
                      className="h-full bg-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* FINAL SIGNAL SYNTHESIS BANNER */}
              <div
                className={`p-4 rounded-xl border ${finalMeta.border} ${finalMeta.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${finalMeta.border} bg-slate-900/60`}
                  >
                    {activeStock.finalSignal === 'STRONG_BUY' ? (
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    ) : activeStock.finalSignal === 'STRONG_SELL' ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    ) : (
                      <span className={`w-3 h-3 rounded-full ${finalMeta.dot}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Final Synthesized Signal:
                      </span>
                      <span className={`font-bold text-base ${finalMeta.text}`}>
                        {finalMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                      {activeStock.finalReason}
                    </p>
                  </div>
                </div>

                {/* Signal Alignment Icons */}
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400">Price</span>
                    <span
                      className={`font-bold text-xs ${
                        activeStock.priceSignal.signal === 'BUY'
                          ? 'text-emerald-400'
                          : activeStock.priceSignal.signal === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {activeStock.priceSignal.signal}
                    </span>
                  </div>
                  <span className="text-slate-600">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400">Vol</span>
                    <span
                      className={`font-bold text-xs ${
                        activeStock.volumeSignal.signal === 'BUY'
                          ? 'text-emerald-400'
                          : activeStock.volumeSignal.signal === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {activeStock.volumeSignal.signal}
                    </span>
                  </div>
                  <span className="text-slate-600">+</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400">P/E</span>
                    <span
                      className={`font-bold text-xs ${
                        activeStock.peSignal.signal === 'BUY'
                          ? 'text-emerald-400'
                          : activeStock.peSignal.signal === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {activeStock.peSignal.signal}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 mx-1" />
                  <span className={`font-bold ${finalMeta.text}`}>{finalMeta.label}</span>
                </div>
              </div>

              {/* THREE INDEPENDENT SIGNALS BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Signal 1: Price Signal */}
                <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Price vs 50-DMA</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                          activeStock.priceSignal.signal === 'BUY'
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                            : activeStock.priceSignal.signal === 'SELL'
                            ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                            : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                        }`}
                      >
                        {activeStock.priceSignal.signal}
                      </span>
                    </div>

                    <div className="space-y-1.5 my-3 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Current Price:</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(stock.currency)}{activeStock.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">50-Day Moving Avg:</span>
                        <span className="text-slate-300">
                          {formatCurrency(stock.currency)}{stock.ma50.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Distance to MA:</span>
                        <span
                          className={`font-semibold ${
                            activeStock.priceSignal.signal === 'BUY'
                              ? 'text-emerald-400'
                              : activeStock.priceSignal.signal === 'SELL'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {activeStock.priceSignal.deltaPercent >= 0 ? '+' : ''}
                          {activeStock.priceSignal.deltaPercent.toFixed(2)}% ({activeStock.priceSignal.signal})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {activeStock.priceSignal.reason}
                  </div>
                </div>

                {/* Signal 2: Volume Signal */}
                <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Volume vs Moving Avg</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                          activeStock.volumeSignal.signal === 'BUY'
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                            : activeStock.volumeSignal.signal === 'SELL'
                            ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                            : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                        }`}
                      >
                        {activeStock.volumeSignal.signal}
                      </span>
                    </div>

                    <div className="space-y-1.5 my-3 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Daily Volume:</span>
                        <span className="text-white font-semibold">
                          {formatVolume(activeStock.currentVolume)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Weekly Avg Volume:</span>
                        <span className="text-slate-300">
                          {formatVolume(stock.weeklyAvgVolume)}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Surge Ratio:</span>
                        <span
                          className={`font-semibold ${
                            activeStock.volumeSignal.signal === 'BUY'
                              ? 'text-emerald-400'
                              : activeStock.volumeSignal.signal === 'SELL'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {(activeStock.currentVolume / stock.weeklyAvgVolume).toFixed(2)}x (
                          {activeStock.volumeSignal.deltaPercent >= 0 ? '+' : ''}
                          {activeStock.volumeSignal.deltaPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {activeStock.volumeSignal.reason}
                  </div>
                </div>

                {/* Signal 3: P/E Valuation Signal */}
                <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                        <span>P/E vs Industry Avg</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                          activeStock.peSignal.signal === 'BUY'
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                            : activeStock.peSignal.signal === 'SELL'
                            ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                            : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                        }`}
                      >
                        {activeStock.peSignal.signal}
                      </span>
                    </div>

                    <div className="space-y-1.5 my-3 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Stock Trailing P/E:</span>
                        <span className="text-white font-semibold">
                          {activeStock.pe.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">{stock.sector} Avg:</span>
                        <span className="text-slate-300">
                          {sectorAvgPE.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Rel. Valuation:</span>
                        <span
                          className={`font-semibold ${
                            activeStock.peSignal.deltaPercent <= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {activeStock.peSignal.deltaPercent <= 0
                            ? `${Math.abs(activeStock.peSignal.deltaPercent).toFixed(1)}% Discount`
                            : `+${activeStock.peSignal.deltaPercent.toFixed(1)}% Premium`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {activeStock.peSignal.reason}
                  </div>
                </div>
              </div>

              {/* 50-DAY PRICE HISTORY SVG CHART */}
              <div className="bg-[#111726] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-xs text-white">50-Day Price Trend & 50-DMA Benchmark</h4>
                    <p className="text-[11px] text-slate-400">
                      Visualizing price momentum vs the 50-day moving average threshold.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span
                        className={`w-3 h-0.5 rounded-full ${
                          activeStock.priceSignal.signal === 'BUY'
                            ? 'bg-emerald-400'
                            : activeStock.priceSignal.signal === 'SELL'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        Closing Price (
                        {activeStock.priceSignal.signal === 'BUY'
                          ? 'Below MA → Buy'
                          : activeStock.priceSignal.signal === 'SELL'
                          ? 'Above MA → Sell'
                          : 'At MA → Neutral'}
                        )
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                      <span>50-DMA ({formatCurrency(stock.currency)}{stock.ma50.toFixed(2)})</span>
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto py-2">
                  <svg
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    className="w-full h-44 overflow-visible"
                  >
                    <line
                      x1={padX}
                      y1={padY}
                      x2={chartW - padX}
                      y2={padY}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={padX}
                      y1={chartH - padY}
                      x2={chartW - padX}
                      y2={chartH - padY}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />

                    {/* 50-DMA Benchmark Line */}
                    <line
                      x1={padX}
                      y1={maY}
                      x2={chartW - padX}
                      y2={maY}
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />

                    {/* Shaded Area under Price Polyline */}
                    <path
                      d={`M ${pricePoints[0].x} ${chartH - padY} L ${polylinePoints} L ${
                        pricePoints[pricePoints.length - 1].x
                      } ${chartH - padY} Z`}
                      fill={
                        activeStock.priceSignal.signal === 'BUY'
                          ? 'rgba(52, 211, 153, 0.08)'
                          : activeStock.priceSignal.signal === 'SELL'
                          ? 'rgba(248, 113, 113, 0.08)'
                          : 'rgba(251, 191, 36, 0.08)'
                      }
                    />

                    {/* Price Polyline */}
                    <polyline
                      fill="none"
                      stroke={
                        activeStock.priceSignal.signal === 'BUY'
                          ? '#34d399'
                          : activeStock.priceSignal.signal === 'SELL'
                          ? '#f87171'
                          : '#fbbf24'
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />

                    {/* Current Price Dot */}
                    <circle
                      cx={pricePoints[pricePoints.length - 1].x}
                      cy={pricePoints[pricePoints.length - 1].y}
                      r="4"
                      className={
                        activeStock.priceSignal.signal === 'BUY'
                          ? 'fill-emerald-400'
                          : activeStock.priceSignal.signal === 'SELL'
                          ? 'fill-rose-400'
                          : 'fill-amber-400'
                      }
                      stroke="#0e1422"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>

              {/* WHAT-IF SCENARIO SIMULATOR */}
              <div className="bg-[#121929] p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-semibold text-xs text-white">Interactive "What-If" Signal Simulator</h4>
                  </div>
                  {(simPriceDeltaPct !== 0 || simVolumeDeltaPct !== 0) && (
                    <button
                      onClick={() => {
                        setSimPriceDeltaPct(0);
                        setSimVolumeDeltaPct(0);
                      }}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Simulator</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3">
                  Adjust price or volume to see in real-time how the 3 independent signals re-evaluate and whether the final conviction level shifts.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Simulate Price Move:</span>
                      <span
                        className={
                          simPriceDeltaPct > 0
                            ? 'text-emerald-400 font-bold'
                            : simPriceDeltaPct < 0
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {simPriceDeltaPct > 0 ? '+' : ''}
                        {simPriceDeltaPct}% (
                        {formatCurrency(stock.currency)}{simPrice.toFixed(2)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="0.5"
                      value={simPriceDeltaPct}
                      onChange={(e) => setSimPriceDeltaPct(parseFloat(e.target.value))}
                      aria-label="Simulate Price Move"
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Simulate Volume Surge:</span>
                      <span
                        className={
                          simVolumeDeltaPct > 0
                            ? 'text-emerald-400 font-bold'
                            : simVolumeDeltaPct < 0
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {simVolumeDeltaPct > 0 ? '+' : ''}
                        {simVolumeDeltaPct}% ({formatVolume(simCurrentVolume)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      step="5"
                      value={simVolumeDeltaPct}
                      onChange={(e) => setSimVolumeDeltaPct(parseFloat(e.target.value))}
                      aria-label="Simulate Volume Surge"
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: QUANTTOGO MCP SYSTEMATIC SIGNALS */}
          {modalTab === 'quanttogo-mcp' && (
            <div className="space-y-6">
              {/* QuantToGo Strategy Match Banner */}
              <div className="bg-[#121929] p-5 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">
                      QuantToGo MCP Strategy Matched: {matchedStrategy.name}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      Strategy ID: {matchedStrategy.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/QuantToGo/quanttogo-mcp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono font-medium"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>github.com/QuantToGo/quanttogo-mcp</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{matchedStrategy.description}</p>

                {/* Strategy Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono pt-2 border-t border-slate-800">
                  <div className="bg-[#0b0f17] p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">CAGR</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">+{matchedStrategy.cagr}%</span>
                  </div>
                  <div className="bg-[#0b0f17] p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">Sharpe Ratio</span>
                    <span className="text-cyan-300 font-bold mt-0.5 block">{matchedStrategy.sharpe}</span>
                  </div>
                  <div className="bg-[#0b0f17] p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">Max Drawdown</span>
                    <span className="text-rose-400 font-bold mt-0.5 block">{matchedStrategy.maxDrawdown}%</span>
                  </div>
                  <div className="bg-[#0b0f17] p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">Win Rate</span>
                    <span className="text-white font-bold mt-0.5 block">{matchedStrategy.winRate}%</span>
                  </div>
                  <div className="bg-[#0b0f17] p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">Benchmark</span>
                    <span className="text-slate-300 font-bold mt-0.5 block truncate">{matchedStrategy.benchmark}</span>
                  </div>
                </div>

                {/* Target Allocation & Rationale */}
                <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between items-center text-slate-400 mb-1 font-mono text-[11px]">
                    <span className="font-semibold text-slate-200">Recommended Allocation:</span>
                    <span className="text-emerald-400 font-bold">{matchedStrategy.recommendedAllocation}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] italic">"{matchedStrategy.rationale}"</p>
                </div>
              </div>

              {/* Quick CLI Banner */}
              <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Run QuantToGo MCP via NPX:</span>
                  </div>
                  <code className="text-cyan-300 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800 block sm:inline-block">
                    npx -y quanttogo-mcp
                  </code>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx -y quanttogo-mcp');
                    setCopiedInstallCmd(true);
                    setTimeout(() => setCopiedInstallCmd(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedInstallCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInstallCmd ? 'Command Copied' : 'Copy CLI Command'}</span>
                </button>
              </div>

              {/* QuantToGo MCP Tools Execution Previews */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>QuantToGo MCP Endpoints for {stock.quantToGoSymbol}</span>
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(mcpSpecs, null, 2));
                      setCopiedMcpJson(true);
                      setTimeout(() => setCopiedMcpJson(false), 2000);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedMcpJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMcpJson ? 'Copied Specs' : 'Copy Tool Responses'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tool 1: get_signals */}
                  <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {mcpSpecs.getSignalsTool.name}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">get_signals</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{mcpSpecs.getSignalsTool.description}</p>
                    <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-amber-400 overflow-x-auto max-h-36">
                      {JSON.stringify(mcpSpecs.getSignalsTool.sampleResponse, null, 2)}
                    </pre>
                  </div>

                  {/* Tool 2: get_strategy_performance */}
                  <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {mcpSpecs.getStrategyPerformanceTool.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">Performance & NAV</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{mcpSpecs.getStrategyPerformanceTool.description}</p>
                    <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-cyan-400 overflow-x-auto max-h-36">
                      {JSON.stringify(mcpSpecs.getStrategyPerformanceTool.sampleResponse, null, 2)}
                    </pre>
                  </div>

                  {/* Tool 3: quanttogo_evaluate_screener */}
                  <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {mcpSpecs.evaluateScreenerTool.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">Multi-Factor Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{mcpSpecs.evaluateScreenerTool.description}</p>
                    <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-40">
                      {JSON.stringify(mcpSpecs.evaluateScreenerTool.sampleResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
