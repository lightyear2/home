/**
 * Quantitative Signal & Multi-Factor Engine for QuantToGo MCP Server
 * Official GitHub: https://github.com/QuantToGo/quanttogo-mcp
 *
 * Implements transparent quantitative rules:
 * Rule 1 (Price vs 50-DMA):
 *   - Price > 50-DMA (overextended): SELL (mean-reversion)
 *   - Price < 50-DMA (dip): BUY
 *   - Within neutral band: NEUTRAL
 *
 * Rule 2 (Volume vs Moving Average):
 *   - Volume > Moving Average: BUY (institutional accumulation)
 *   - Volume < Moving Average: SELL (waning interest / distribution)
 *   - Within neutral band: NEUTRAL
 *
 * Rule 3 (P/E vs Industry Sector Average):
 *   - Low P/E relative to sector: BUY (valuation discount)
 *   - High P/E relative to sector: SELL (valuation premium)
 *   - Within neutral band: NEUTRAL
 */

import {
  QuantToGoStockDefinition,
  EvaluatedStock,
  SignalType,
  FinalSignalType,
  SignalBreakdown,
} from './types.ts';

export interface SignalEngineConfig {
  maNeutralBandPercent: number; // Default 0.8%
  volumeSurgeRatio: number;     // Default 1.05
  peTolerancePercent: number;   // Default 10.0%
}

export const DEFAULT_SIGNAL_CONFIG: SignalEngineConfig = {
  maNeutralBandPercent: 0.8,
  volumeSurgeRatio: 1.05,
  peTolerancePercent: 10.0,
};

/**
 * Computes average P/E ratio across each sector in the universe
 */
export function computeSectorAveragePEs(
  stocks: QuantToGoStockDefinition[]
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const stock of stocks) {
    if (stock.pe > 0 && stock.pe < 250) {
      sums[stock.sector] = (sums[stock.sector] || 0) + stock.pe;
      counts[stock.sector] = (counts[stock.sector] || 0) + 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const sector in sums) {
    averages[sector] = Number((sums[sector] / counts[sector]).toFixed(1));
  }
  return averages;
}

/**
 * Evaluates Rule 1: Price vs 50-Day Moving Average
 */
export function evaluatePriceVsMA(
  price: number,
  ma50: number,
  bandPct: number
): SignalBreakdown {
  const delta = price - ma50;
  const deltaPercent = Number(((delta / ma50) * 100).toFixed(2));

  let signal: SignalType = 'NEUTRAL';
  let reason = '';

  if (deltaPercent > bandPct) {
    signal = 'SELL';
    reason = `Price is +${deltaPercent}% above 50-DMA (${ma50.toFixed(2)}). Momentum extended, mean-reversion pull-back expected.`;
  } else if (deltaPercent < -bandPct) {
    signal = 'BUY';
    reason = `Price is ${deltaPercent}% below 50-DMA (${ma50.toFixed(2)}). Deep value dip below medium-term mean.`;
  } else {
    signal = 'NEUTRAL';
    reason = `Price is within ±${bandPct}% band of 50-DMA (${ma50.toFixed(2)}). Neutral trend equilibrium.`;
  }

  return {
    signal,
    label: 'Price vs 50-DMA',
    value: price,
    benchmarkValue: ma50,
    deltaPercent,
    reason,
  };
}

/**
 * Evaluates Rule 2: Volume vs Weekly Moving Average
 */
export function evaluateVolumeVsAvg(
  currentVolume: number,
  weeklyAvgVolume: number,
  surgeThreshold: number
): SignalBreakdown {
  const ratio = Number((currentVolume / weeklyAvgVolume).toFixed(2));
  const deltaPercent = Number(((ratio - 1) * 100).toFixed(1));

  let signal: SignalType = 'NEUTRAL';
  let reason = '';

  if (ratio >= surgeThreshold) {
    signal = 'BUY';
    reason = `Volume surge of ${ratio}x vs weekly average. High turnover confirms institutional accumulation.`;
  } else if (ratio <= 1 / surgeThreshold) {
    signal = 'SELL';
    reason = `Volume is only ${ratio}x of weekly average. Thin participation indicates lack of institutional buying interest.`;
  } else {
    signal = 'NEUTRAL';
    reason = `Volume at ${ratio}x normal weekly pace. Regular market turnover.`;
  }

  return {
    signal,
    label: 'Volume Accumulation',
    value: currentVolume,
    benchmarkValue: weeklyAvgVolume,
    deltaPercent,
    reason,
  };
}

/**
 * Evaluates Rule 3: Trailing P/E vs Industry Sector Average
 */
export function evaluatePEVsIndustry(
  stockPE: number,
  sectorAvgPE: number,
  tolerancePct: number
): SignalBreakdown {
  const delta = stockPE - sectorAvgPE;
  const deltaPercent = Number(((delta / sectorAvgPE) * 100).toFixed(1));

  let signal: SignalType = 'NEUTRAL';
  let reason = '';

  if (deltaPercent <= -tolerancePct) {
    signal = 'BUY';
    reason = `P/E of ${stockPE.toFixed(1)}x is ${Math.abs(deltaPercent)}% cheaper than sector average (${sectorAvgPE.toFixed(1)}x). Substantial valuation discount margin.`;
  } else if (deltaPercent >= tolerancePct) {
    signal = 'SELL';
    reason = `P/E of ${stockPE.toFixed(1)}x is +${deltaPercent}% above sector average (${sectorAvgPE.toFixed(1)}x). Rich multiple leaves limited safety buffer.`;
  } else {
    signal = 'NEUTRAL';
    reason = `P/E of ${stockPE.toFixed(1)}x is inline with sector benchmark (${sectorAvgPE.toFixed(1)}x). Fair valuation.`;
  }

  return {
    signal,
    label: 'P/E vs Sector Average',
    value: stockPE,
    benchmarkValue: sectorAvgPE,
    deltaPercent,
    reason,
  };
}

/**
 * Synthesizes final conviction score across all 3 rules
 */
export function synthesizeConviction(
  priceSignal: SignalType,
  volumeSignal: SignalType,
  peSignal: SignalType
): { finalSignal: FinalSignalType; finalScore: number; finalReason: string } {
  const signalToPoints = (s: SignalType): number => {
    if (s === 'BUY') return 1;
    if (s === 'SELL') return -1;
    return 0;
  };

  const score =
    signalToPoints(priceSignal) +
    signalToPoints(volumeSignal) +
    signalToPoints(peSignal);

  let finalSignal: FinalSignalType = 'HOLD';
  let finalReason = '';

  if (score === 3) {
    finalSignal = 'STRONG_BUY';
    finalReason =
      'Triple-factor bullish alignment: Dip below 50-DMA + Institutional volume accumulation + Undervalued P/E multiple.';
  } else if (score >= 1) {
    finalSignal = 'BUY';
    finalReason =
      'Bullish dominant: Positive quantitative alignment with favorable risk/reward asymmetric skew.';
  } else if (score === -3) {
    finalSignal = 'STRONG_SELL';
    finalReason =
      'Triple-factor bearish alignment: Overextended above 50-DMA + Declining volume + Expensive valuation multiple.';
  } else if (score <= -1) {
    finalSignal = 'SELL';
    finalReason =
      'Bearish dominant: Stretched price or premium valuation suggests taking profit or defensive rebalancing.';
  } else {
    finalSignal = 'HOLD';
    finalReason =
      'Balanced market state: Conflicting or neutral factor signals. Maintain existing position.';
  }

  return { finalSignal, finalScore: score, finalReason };
}

/**
 * Complete evaluation of a stock
 */
export function evaluateStock(
  stock: QuantToGoStockDefinition,
  sectorAvgPE: number,
  config: SignalEngineConfig = DEFAULT_SIGNAL_CONFIG
): EvaluatedStock {
  const priceSignal = evaluatePriceVsMA(
    stock.price,
    stock.ma50,
    config.maNeutralBandPercent
  );

  const volumeSignal = evaluateVolumeVsAvg(
    stock.currentVolume,
    stock.weeklyAvgVolume,
    config.volumeSurgeRatio
  );

  const peSignal = evaluatePEVsIndustry(
    stock.pe,
    sectorAvgPE,
    config.peTolerancePercent
  );

  const { finalSignal, finalScore, finalReason } = synthesizeConviction(
    priceSignal.signal,
    volumeSignal.signal,
    peSignal.signal
  );

  return {
    ...stock,
    priceSignal,
    volumeSignal,
    peSignal,
    finalSignal,
    finalScore,
    finalReason,
    sectorAvgPE,
  };
}

/**
 * Evaluates all stocks in the universe
 */
export function evaluateAllStocks(
  stocks: QuantToGoStockDefinition[],
  config: SignalEngineConfig = DEFAULT_SIGNAL_CONFIG
): EvaluatedStock[] {
  const sectorAverages = computeSectorAveragePEs(stocks);
  return stocks.map((stock) =>
    evaluateStock(stock, sectorAverages[stock.sector] || stock.pe, config)
  );
}
