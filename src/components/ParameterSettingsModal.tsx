import React from 'react';
import { ScreenerConfig } from '../types/stock';
import { DEFAULT_CONFIG } from '../utils/signals';
import { X, RotateCcw, Check, SlidersHorizontal, Info } from 'lucide-react';

interface ParameterSettingsModalProps {
  config: ScreenerConfig;
  onChangeConfig: (newConfig: ScreenerConfig) => void;
  onClose: () => void;
}

export const ParameterSettingsModal: React.FC<ParameterSettingsModalProps> = ({
  config,
  onChangeConfig,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0e1422] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#121929]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Signal Sensitivity Parameters</h3>
              <p className="text-[11px] text-slate-400">
                Calibrate thresholds for 50-DMA, volume surge, and P/E tolerance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders Body */}
        <div className="p-6 space-y-6">
          {/* Parameter 1: 50-DMA Neutral Band */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                1. 50-DMA Neutral Band (±%)
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ±{config.maNeutralBandPercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Stocks whose current price is within this percentage of the 50-day moving average are categorized as Neutral. If Price vs Moving Average is positive, signal is <span className="text-rose-400 font-semibold">Sell</span>; if negative, signal is <span className="text-emerald-400 font-semibold">Buy</span>.
            </p>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={config.maNeutralBandPercent}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  maNeutralBandPercent: parseFloat(e.target.value),
                })
              }
              aria-label="50-DMA Neutral Band (±%)"
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>±0.2% (Strict)</span>
              <span>±0.8% (Default)</span>
              <span>±2.5% (Wide)</span>
            </div>
          </div>

          {/* Parameter 2: Volume Surge Ratio */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                2. Volume Surge Ratio Threshold
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {config.volumeSurgeRatio.toFixed(2)}x (+{Math.round((config.volumeSurgeRatio - 1) * 100)}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Volume multiplier vs weekly average required to confirm conviction. If Volume vs Moving Average is positive, signal is <span className="text-emerald-400 font-semibold">Buy</span>; if volume is below average, signal is <span className="text-rose-400 font-semibold">Sell</span>.
            </p>
            <input
              type="range"
              min="1.01"
              max="1.25"
              step="0.01"
              value={config.volumeSurgeRatio}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  volumeSurgeRatio: parseFloat(e.target.value),
                })
              }
              aria-label="Volume Surge Ratio Threshold"
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1.01x (+1%)</span>
              <span>1.05x (Default)</span>
              <span>1.25x (+25%)</span>
            </div>
          </div>

          {/* Parameter 3: P/E Sector Tolerance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                3. P/E Sector Valuation Tolerance (±%)
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ±{config.peTolerancePercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Percentage difference from the industry average trailing P/E. If P/E vs industry is low, signal is <span className="text-emerald-400 font-semibold">Buy</span> (undervalued discount); if high, signal is <span className="text-rose-400 font-semibold">Sell</span> (expensive premium).
            </p>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={config.peTolerancePercent}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  peTolerancePercent: parseFloat(e.target.value),
                })
              }
              aria-label="P/E Sector Valuation Tolerance (±%)"
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>±1.0% (Tight)</span>
              <span>±5.0% (Default)</span>
              <span>±15.0% (Permissive)</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Adjusting parameters dynamically updates all 62 stocks across the Kanban columns, screener table, and sector metrics in real time.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#121929]/50 flex items-center justify-between">
          <button
            onClick={() => onChangeConfig(DEFAULT_CONFIG)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Parameters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
