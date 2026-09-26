import { StockRaw, EvaluatedStock, SignalBreakdown, SignalType, FinalSignalType, ScreenerConfig, Market } from '../types/stock';

export const DEFAULT_CONFIG: ScreenerConfig = {
  maNeutralBandPercent: 0.8, // within ±0.8% of 50-DMA is Neutral
  volumeSurgeRatio: 1.05,    // >= 1.05 is elevated volume, <= 0.95 is falling volume
  peTolerancePercent: 5.0,   // within ±5% of sector avg P/E is Neutral
};

// Calculate sector average P/E across the stock universe
export function computeSectorAveragePEs(stocks: StockRaw[]): Record<string, number> {
  const sectorGroups: Record<string, number[]> = {};

  for (const stock of stocks) {
    if (!sectorGroups[stock.sector]) {
      sectorGroups[stock.sector] = [];
    }
    sectorGroups[stock.sector].push(stock.pe);
  }

  const averages: Record<string, number> = {};
  for (const [sector, pes] of Object.entries(sectorGroups)) {
    const sum = pes.reduce((a, b) => a + b, 0);
    averages[sector] = Number((sum / pes.length).toFixed(1));
  }

  return averages;
}

// Compute individual signals and synthesize final signal for a stock
export function evaluateStock(
  stock: StockRaw,
  sectorAvgPE: number,
  config: ScreenerConfig = DEFAULT_CONFIG
): EvaluatedStock {
  // ------------------------------------------
  // 1. PRICE SIGNAL: Price vs 50-Day Moving Average
  // Rule: If Price vs Moving Average is positive, signal is SELL; if negative, signal is BUY
  // ------------------------------------------
  const priceDeltaPercent = ((stock.price - stock.ma50) / stock.ma50) * 100;
  let priceSignal: SignalType = 'NEUTRAL';
  let priceReason = '';

  if (priceDeltaPercent > config.maNeutralBandPercent) {
    priceSignal = 'SELL';
    priceReason = `Price is +${priceDeltaPercent.toFixed(1)}% above 50-DMA (${stock.ma50.toFixed(2)}), signalling overextended price / mean-reversion sell`;
  } else if (priceDeltaPercent < -config.maNeutralBandPercent) {
    priceSignal = 'BUY';
    priceReason = `Price is ${priceDeltaPercent.toFixed(1)}% below 50-DMA (${stock.ma50.toFixed(2)}), signalling dip-buying opportunity below moving average`;
  } else {
    priceSignal = 'NEUTRAL';
    priceReason = `Price is hovering within ±${config.maNeutralBandPercent}% of 50-DMA (${priceDeltaPercent >= 0 ? '+' : ''}${priceDeltaPercent.toFixed(2)}%)`;
  }

  const priceBreakdown: SignalBreakdown = {
    signal: priceSignal,
    label: 'Price vs 50-DMA',
    value: stock.price,
    benchmarkValue: stock.ma50,
    deltaPercent: priceDeltaPercent,
    reason: priceReason,
  };

  // ------------------------------------------
  // 2. VOLUME SIGNAL: Volume vs Moving Average (Weekly Average)
  // Rule: If Volume vs Moving Average is positive, signal is BUY; if negative, signal is SELL
  // ------------------------------------------
  const volumeRatio = stock.currentVolume / stock.weeklyAvgVolume;
  const volumeDeltaPercent = (volumeRatio - 1) * 100;
  let volumeSignal: SignalType = 'NEUTRAL';
  let volumeReason = '';

  const isVolumeRising = volumeRatio >= config.volumeSurgeRatio;
  const isVolumeFalling = volumeRatio <= 1 / config.volumeSurgeRatio; // e.g. <= 0.952

  if (isVolumeRising) {
    volumeSignal = 'BUY';
    volumeReason = `Volume is positive vs moving average (+${volumeDeltaPercent.toFixed(1)}% vs weekly avg), confirming strong institutional interest and liquidity`;
  } else if (isVolumeFalling) {
    volumeSignal = 'SELL';
    volumeReason = `Volume is below moving average (${volumeDeltaPercent.toFixed(1)}% vs weekly avg), signalling declining participation / liquidity outflow`;
  } else {
    volumeSignal = 'NEUTRAL';
    volumeReason = `Volume is flat relative to weekly moving average (${volumeDeltaPercent >= 0 ? '+' : ''}${volumeDeltaPercent.toFixed(1)}%)`;
  }

  const volumeBreakdown: SignalBreakdown = {
    signal: volumeSignal,
    label: 'Volume vs Moving Avg',
    value: stock.currentVolume,
    benchmarkValue: stock.weeklyAvgVolume,
    deltaPercent: volumeDeltaPercent,
    reason: volumeReason,
  };

  // ------------------------------------------
  // 3. P/E SIGNAL: Trailing P/E vs Industry / Sector Average
  // Rule: If P/E vs Industry is low, signal is BUY; if high, signal is SELL
  // ------------------------------------------
  const peDeltaPercent = ((stock.pe - sectorAvgPE) / sectorAvgPE) * 100;
  let peSignal: SignalType = 'NEUTRAL';
  let peReason = '';

  if (peDeltaPercent < -config.peTolerancePercent) {
    peSignal = 'BUY';
    peReason = `P/E of ${stock.pe.toFixed(1)}x is low vs ${stock.sector} industry average (${sectorAvgPE.toFixed(1)}x), trading at a ${Math.abs(peDeltaPercent).toFixed(1)}% value discount`;
  } else if (peDeltaPercent > config.peTolerancePercent) {
    peSignal = 'SELL';
    peReason = `P/E of ${stock.pe.toFixed(1)}x is high vs ${stock.sector} industry average (${sectorAvgPE.toFixed(1)}x), trading at a ${peDeltaPercent.toFixed(1)}% valuation premium`;
  } else {
    peSignal = 'NEUTRAL';
    peReason = `P/E of ${stock.pe.toFixed(1)}x is roughly in line with ${stock.sector} industry average (${sectorAvgPE.toFixed(1)}x)`;
  }

  const peBreakdown: SignalBreakdown = {
    signal: peSignal,
    label: 'P/E vs Industry Avg',
    value: stock.pe,
    benchmarkValue: sectorAvgPE,
    deltaPercent: peDeltaPercent,
    reason: peReason,
  };

  // ------------------------------------------
  // 4. FINAL SIGNAL SYNTHESIS
  // ------------------------------------------
  const signals: SignalType[] = [priceSignal, volumeSignal, peSignal];
  const buyCount = signals.filter((s) => s === 'BUY').length;
  const sellCount = signals.filter((s) => s === 'SELL').length;
  const neutralCount = signals.filter((s) => s === 'NEUTRAL').length;

  let finalSignal: FinalSignalType = 'HOLD';
  let finalReason = '';
  // Score: Buy = +1, Neutral = 0, Sell = -1
  const finalScore = buyCount * 1 - sellCount * 1;

  if (buyCount === 3) {
    finalSignal = 'STRONG_BUY';
    finalReason = 'Highest conviction: Price below 50-DMA, volume positive vs moving average, and low P/E vs industry average all align bullishly.';
  } else if (sellCount === 3) {
    finalSignal = 'STRONG_SELL';
    finalReason = 'Highest conviction sell: Price extended above 50-DMA, volume below moving average, and high P/E vs industry average all align bearishly.';
  } else if (buyCount === 2) {
    finalSignal = 'BUY';
    if (sellCount === 1) {
      const opposing =
        priceSignal === 'SELL'
          ? 'price is above 50-DMA'
          : volumeSignal === 'SELL'
          ? 'volume is below moving average'
          : 'P/E is above industry average';
      finalReason = `Bullish bias dominates (2 Buys). Downgraded from Strong Buy because ${opposing}.`;
    } else {
      finalReason = 'Solid bullish setup: Two buy signals with one neutral reading.';
    }
  } else if (sellCount === 2) {
    finalSignal = 'SELL';
    if (buyCount === 1) {
      const positive =
        peSignal === 'BUY'
          ? 'low industry P/E'
          : volumeSignal === 'BUY'
          ? 'positive volume surge'
          : 'discounted price below MA';
      finalReason = `Bearish pressure dominates (2 Sells), despite supportive ${positive}.`;
    } else {
      finalReason = 'Bearish setup: Two sell signals with one neutral reading.';
    }
  } else {
    // 1 Buy, 1 Sell, 1 Neutral OR 3 Neutrals OR 1 Buy + 2 Neutrals OR 1 Sell + 2 Neutrals
    finalSignal = 'HOLD';
    if (neutralCount === 3) {
      finalReason = 'Neutral equilibrium: Price, volume, and valuation are all roughly in line with benchmarks.';
    } else if (buyCount === 1 && sellCount === 1) {
      finalReason = 'Conflicting signals: Bullish and bearish factors cancel out; maintain hold.';
    } else {
      finalReason = 'Indecisive signal profile: Insufficient alignment to trigger actionable conviction.';
    }
  }

  return {
    ...stock,
    priceSignal: priceBreakdown,
    volumeSignal: volumeBreakdown,
    peSignal: peBreakdown,
    finalSignal,
    finalScore,
    finalReason,
  };
}

export function evaluateAllStocks(
  stocks: StockRaw[],
  config: ScreenerConfig = DEFAULT_CONFIG
): EvaluatedStock[] {
  const sectorAvgPEs = computeSectorAveragePEs(stocks);
  return stocks.map((stock) => {
    const sectorAvg = sectorAvgPEs[stock.sector] || 15.0;
    return evaluateStock(stock, sectorAvg, config);
  });
}

export function formatCurrency(currency: string): string {
  switch (currency) {
    case 'SGD': return 'S$';
    case 'CNY': return '¥';
    case 'HKD': return 'HK$';
    case 'USD': return '$';
    default: return '$';
  }
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}k`;
  return vol.toLocaleString();
}

export const SIGNAL_METADATA: Record<
  FinalSignalType,
  { label: string; tag: string; bg: string; border: string; text: string; dot: string; order: number }
> = {
  STRONG_BUY: {
    label: 'Strong Buy',
    tag: '3x Buy Alignment',
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    order: 1,
  },
  BUY: {
    label: 'Buy',
    tag: 'Bullish Dominant',
    bg: 'bg-teal-950/20',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    order: 2,
  },
  HOLD: {
    label: 'Hold',
    tag: 'Mixed / Neutral',
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    order: 3,
  },
  SELL: {
    label: 'Sell',
    tag: 'Bearish Dominant',
    bg: 'bg-orange-950/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    order: 4,
  },
  STRONG_SELL: {
    label: 'Strong Sell',
    tag: '3x Sell Alignment',
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    order: 5,
  },
};

export const MARKET_BADGES: Record<Market, { flag: string; code: string; name: string }> = {
  Singapore: { flag: '🇸🇬', code: 'SGX', name: 'STI 30' },
  China: { flag: '🇨🇳', code: 'SSE/SZSE', name: 'CSI 300' },
  'Hong Kong': { flag: '🇭🇰', code: 'HKEX', name: 'Hang Seng' },
  US: { flag: '🇺🇸', code: 'NYSE/NASD', name: 'S&P/Dow' },
};
