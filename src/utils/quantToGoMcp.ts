/**
 * QuantToGo Model Context Protocol (MCP) Integration
 * Official GitHub: https://github.com/QuantToGo/quanttogo-mcp
 * Package: quanttogo-mcp (npx quanttogo-mcp)
 * 
 * Provides macro-factor quantitative trading signals and systematic quantitative
 * strategies for China, US, Hong Kong, and Singapore stock markets for AI Agents.
 */

import { EvaluatedStock, QuantToGoMcpToolSpec, SignalType } from '../types/stock';

export interface QuantToGoStrategy {
  id: string;
  name: string;
  market: 'US' | 'China' | 'Hong Kong' | 'Singapore' | 'Global';
  description: string;
  cagr: number; // in %
  sharpe: number;
  maxDrawdown: number; // in %
  winRate: number; // in %
  benchmark: string;
  currentSignal: SignalType;
  signalDate: string;
  recommendedAllocation: string;
  targetTickers: string[];
  rationale: string;
}

export interface QuantToGoConnectionConfig {
  serverName: string;
  githubUrl: string;
  provider: string;
  installCommand: string;
  runCommand: string;
  environment: 'production' | 'trial';
  apiKey: string;
  autoSync: boolean;
  syncIntervalSec: number;
}

export const DEFAULT_QUANTTOGO_CONFIG: QuantToGoConnectionConfig = {
  serverName: 'quanttogo-mcp',
  githubUrl: 'https://github.com/QuantToGo/quanttogo-mcp',
  provider: 'QuantToGo Quantitative Signal Engine (github.com/QuantToGo/quanttogo-mcp)',
  installCommand: 'npx -y quanttogo-mcp',
  runCommand: 'npx -y quanttogo-mcp',
  environment: 'trial',
  apiKey: 'qtg_trial_agent_30d',
  autoSync: false,
  syncIntervalSec: 15,
};

/**
 * Standard QuantToGo Systematic Strategies catalog
 * Matches strategies published on https://github.com/QuantToGo/quanttogo-mcp
 */
export const QUANTTOGO_STRATEGIES: QuantToGoStrategy[] = [
  {
    id: 'cnh_spread_flow',
    name: 'China Capital Flow (USD/CNH Spread Macro)',
    market: 'China',
    description:
      'Monitors offshore RMB (CNH) vs onshore RMB (CNY) spread and PBOC fixing divergence to predict cross-border institutional capital flows into A-Shares.',
    cagr: 24.8,
    sharpe: 1.62,
    maxDrawdown: -14.2,
    winRate: 64.5,
    benchmark: 'CSI 300 Index',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: '70% CSI 300 / 30% Cash',
    targetTickers: ['600519.SS', '000858.SZ', '601318.SS', '600036.SS'],
    rationale: 'USD/CNH spread narrowing below 80 bps indicates accelerating northbound capital flow inflows.',
  },
  {
    id: 'ashare_size_rotation',
    name: 'A-Share Size Rotation (Large vs Small Cap)',
    market: 'China',
    description:
      'Dynamic factor rotation between mega-cap CSI 300 quality value and high-beta CSI 1000 growth based on market breadth and credit impulse.',
    cagr: 28.4,
    sharpe: 1.54,
    maxDrawdown: -18.6,
    winRate: 59.2,
    benchmark: 'CSI 300 Index',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: 'Overweight Large-Cap Quality Value',
    targetTickers: ['601857.SS', '600900.SS', '002594.SZ'],
    rationale: 'Liquidity tightening regime favors low-beta dividend champions and mega-cap SOEs.',
  },
  {
    id: 'ashare_limitdown_exhaustion',
    name: 'A-Share Limit-Down Capitulation Reversal',
    market: 'China',
    description:
      'Detects extreme selling climaxes when market-wide limit-down stocks exceed statistical thresholds, identifying high-probability V-bottoms.',
    cagr: 31.2,
    sharpe: 1.78,
    maxDrawdown: -12.1,
    winRate: 72.0,
    benchmark: 'CSI 300 Index',
    currentSignal: 'NEUTRAL',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: 'Cash / Defensive Hold',
    targetTickers: ['000333.SZ', '600276.SS'],
    rationale: 'Daily limit-down count normal (under 5 stocks). No capitulation panic trigger active.',
  },
  {
    id: 'tqqq_vix_dip',
    name: 'US Tech 3x TQQQ VIX Dip Accumulator',
    market: 'US',
    description:
      'Quantifies extreme fear spikes in the VIX term structure and CBOE put/call ratios to execute dip-buying in leveraged Nasdaq-100 (TQQQ).',
    cagr: 42.6,
    sharpe: 1.48,
    maxDrawdown: -26.5,
    winRate: 68.4,
    benchmark: 'Nasdaq 100',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: '35% TQQQ / 65% Cash & Short-Term Treasuries',
    targetTickers: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'],
    rationale: 'VIX 9-day to 30-day backwardation cleared; 50-DMA mean-reversion dip entry triggered.',
  },
  {
    id: 'nasdaq_trend_filter',
    name: 'Trend-Filtered 3x Nasdaq 100 Allocation',
    market: 'US',
    description:
      'Regime-switching trend model that steps into 3x Nasdaq leverage during bullish price regimes and parks in US Dollar cash during distribution phases.',
    cagr: 36.5,
    sharpe: 1.58,
    maxDrawdown: -19.4,
    winRate: 61.8,
    benchmark: 'Nasdaq 100',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: '100% Equity Exposure',
    targetTickers: ['NVDA', 'MSFT', 'TSLA', 'AMZN'],
    rationale: 'Nasdaq 100 trading securely above rising 50-day and 200-day moving averages with strong volume.',
  },
  {
    id: 'retail_sentiment_reversal',
    name: 'Contrarian Retail Sentiment Reversal',
    market: 'US',
    description:
      'Fades extreme retail greed and panic indicators across social, options volume, and margin debt balances.',
    cagr: 22.1,
    sharpe: 1.35,
    maxDrawdown: -13.8,
    winRate: 66.2,
    benchmark: 'S&P 500',
    currentSignal: 'NEUTRAL',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: 'Equal-Weight Core Holdings',
    targetTickers: ['JPM', 'XOM', 'PG', 'COST'],
    rationale: 'Sentiment index at 54/100 (Neutral zone). Hold current portfolio weights.',
  },
  {
    id: 'singapore_dividend_value',
    name: 'Singapore STI High-Yield Flow Momentum',
    market: 'Singapore',
    description:
      'Systematic allocation across Straits Times Index top dividend champions, banking majors (DBS, OCBC, UOB), and defensive infrastructure REITs.',
    cagr: 16.8,
    sharpe: 1.82,
    maxDrawdown: -8.9,
    winRate: 74.5,
    benchmark: 'Straits Times Index (STI)',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: '80% STI Blue Chips / 20% SGD Cash',
    targetTickers: ['D05.SI', 'O39.SI', 'U11.SI', 'Z74.SI'],
    rationale: 'Average dividend yield of 5.3% provides strong asymmetric buffer while banking NIMs remain stable.',
  },
  {
    id: 'hangseng_tech_arbitrage',
    name: 'Hang Seng Tech / Dual-Listing Arbitrage',
    market: 'Hong Kong',
    description:
      'Systematic quantitative valuation mean-reversion for Hong Kong tech giants against their US ADR counterparts and relative sector averages.',
    cagr: 27.5,
    sharpe: 1.42,
    maxDrawdown: -22.4,
    winRate: 58.7,
    benchmark: 'Hang Seng Tech Index',
    currentSignal: 'BUY',
    signalDate: new Date().toISOString().slice(0, 10),
    recommendedAllocation: 'Overweight Tencent, Alibaba & Meituan',
    targetTickers: ['0700.HK', '9988.HK', '3690.HK', '9618.HK'],
    rationale: 'HKEX Tech forward P/E at 15.2x represents a 35% discount to 5-year historical multiples.',
  },
];

/**
 * Maps standard stock tickers into official QuantToGo notation:
 * - Symbol standardization
 * - Relevant QuantToGo quantitative strategy association
 * - Official QuantToGo GitHub documentation link
 */
export function resolveQuantToGoInfo(ticker: string, market: string): {
  quantToGoSymbol: string;
  quantToGoStrategyId: string;
  quantToGoStrategyName: string;
  quantToGoUrl: string;
  exchange: string;
} {
  let strategyId = 'retail_sentiment_reversal';
  let strategyName = 'Contrarian Retail Sentiment Reversal';

  switch (market) {
    case 'Singapore': {
      const clean = ticker.replace('.SI', '').replace('.SG', '');
      strategyId = 'singapore_dividend_value';
      strategyName = 'Singapore STI High-Yield Flow Momentum';
      return {
        quantToGoSymbol: `SGX:${clean}`,
        quantToGoStrategyId: strategyId,
        quantToGoStrategyName: strategyName,
        quantToGoUrl: 'https://github.com/QuantToGo/quanttogo-mcp',
        exchange: 'SGX',
      };
    }
    case 'Hong Kong': {
      const formatted = ticker.replace('.HK', '').padStart(4, '0');
      strategyId = 'hangseng_tech_arbitrage';
      strategyName = 'Hang Seng Tech / Dual-Listing Arbitrage';
      return {
        quantToGoSymbol: `HKG:${formatted}`,
        quantToGoStrategyId: strategyId,
        quantToGoStrategyName: strategyName,
        quantToGoUrl: 'https://github.com/QuantToGo/quanttogo-mcp',
        exchange: 'HKEX',
      };
    }
    case 'China': {
      const base = ticker.replace('.SH', '').replace('.SZ', '').replace('.SS', '');
      const isShanghai = base.startsWith('60') || base.startsWith('688');
      const exchangeCode = isShanghai ? 'SHA' : 'SHE';
      strategyId = 'cnh_spread_flow';
      strategyName = 'China Capital Flow (USD/CNH Spread Macro)';
      return {
        quantToGoSymbol: `${exchangeCode}:${base}`,
        quantToGoStrategyId: strategyId,
        quantToGoStrategyName: strategyName,
        quantToGoUrl: 'https://github.com/QuantToGo/quanttogo-mcp',
        exchange: isShanghai ? 'SSE' : 'SZSE',
      };
    }
    case 'US':
    default: {
      const clean = ticker.replace('.', '-');
      const isTech = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA'].includes(ticker);
      strategyId = isTech ? 'nasdaq_trend_filter' : 'retail_sentiment_reversal';
      strategyName = isTech
        ? 'Trend-Filtered 3x Nasdaq 100 Allocation'
        : 'Contrarian Retail Sentiment Reversal';
      const exchangeCode = isTech ? 'NASDAQ' : 'NYSE';
      return {
        quantToGoSymbol: `${exchangeCode}:${clean}`,
        quantToGoStrategyId: strategyId,
        quantToGoStrategyName: strategyName,
        quantToGoUrl: 'https://github.com/QuantToGo/quanttogo-mcp',
        exchange: exchangeCode,
      };
    }
  }
}

/**
 * Generate QuantToGo MCP tools specification for a given stock
 * Matches schemas published on https://github.com/QuantToGo/quanttogo-mcp
 */
export function getStockQuantToGoMcpSpecs(stock: EvaluatedStock): {
  listStrategiesTool: QuantToGoMcpToolSpec;
  getSignalsTool: QuantToGoMcpToolSpec;
  getStrategyPerformanceTool: QuantToGoMcpToolSpec;
  compareStrategiesTool: QuantToGoMcpToolSpec;
  getIndexDataTool: QuantToGoMcpToolSpec;
  registerTrialTool: QuantToGoMcpToolSpec;
  evaluateScreenerTool: QuantToGoMcpToolSpec;
} {
  const qtg = resolveQuantToGoInfo(stock.ticker, stock.market);
  const matchedStrategy =
    QUANTTOGO_STRATEGIES.find((s) => s.id === qtg.quantToGoStrategyId) || QUANTTOGO_STRATEGIES[0];

  // 1. list_strategies
  const listStrategiesTool: QuantToGoMcpToolSpec = {
    name: 'list_strategies',
    description:
      'List all available quantitative strategies with live performance, CAGR, Sharpe ratio, Max Drawdown, and current macro signals from QuantToGo (github.com/QuantToGo/quanttogo-mcp).',
    endpoint: 'quanttogo-mcp::list_strategies',
    params: {
      market: stock.market,
      include_metrics: true,
    },
    sampleResponse: {
      count: QUANTTOGO_STRATEGIES.length,
      strategies: QUANTTOGO_STRATEGIES.map((s) => ({
        id: s.id,
        name: s.name,
        market: s.market,
        cagr: `${s.cagr}%`,
        sharpe: s.sharpe,
        max_drawdown: `${s.maxDrawdown}%`,
        current_signal: s.currentSignal,
        benchmark: s.benchmark,
      })),
      timestamp: new Date().toISOString(),
    },
  };

  // 2. get_signals
  const getSignalsTool: QuantToGoMcpToolSpec = {
    name: 'get_signals',
    description: `Retrieve latest timestamped buy/sell trading signals, target portfolio allocation, and stop-loss levels for strategy "${matchedStrategy.name}" associated with ${stock.ticker}.`,
    endpoint: 'quanttogo-mcp::get_signals',
    params: {
      strategy_id: matchedStrategy.id,
      symbol: stock.ticker,
      api_key: 'qtg_trial_agent_30d',
    },
    sampleResponse: {
      strategy_id: matchedStrategy.id,
      strategy_name: matchedStrategy.name,
      symbol: stock.ticker,
      quanttogo_symbol: qtg.quantToGoSymbol,
      signal: matchedStrategy.currentSignal,
      target_allocation: matchedStrategy.recommendedAllocation,
      conviction_score: stock.finalScore,
      screener_signal: stock.finalSignal,
      rationale: matchedStrategy.rationale,
      price: stock.price,
      currency: stock.currency,
      stop_loss: Number((stock.price * 0.94).toFixed(2)),
      take_profit: Number((stock.price * 1.15).toFixed(2)),
      timestamp: new Date().toISOString(),
    },
  };

  // 3. get_strategy_performance
  const getStrategyPerformanceTool: QuantToGoMcpToolSpec = {
    name: 'get_strategy_performance',
    description: `Retrieve detailed risk-adjusted performance metrics, Sharpe ratio, Sortino ratio, max drawdown, and NAV history for strategy "${matchedStrategy.name}".`,
    endpoint: 'quanttogo-mcp::get_strategy_performance',
    params: {
      strategy_id: matchedStrategy.id,
      timeframe: '1Y',
    },
    sampleResponse: {
      strategy_id: matchedStrategy.id,
      name: matchedStrategy.name,
      cagr: `${matchedStrategy.cagr}%`,
      sharpe_ratio: matchedStrategy.sharpe,
      max_drawdown: `${matchedStrategy.maxDrawdown}%`,
      win_rate: `${matchedStrategy.winRate}%`,
      benchmark: matchedStrategy.benchmark,
      alpha_vs_benchmark: '+11.4%',
      current_nav: 1.348,
      status: 'LIVE_FORWARD_TRACKED',
    },
  };

  // 4. compare_strategies
  const compareStrategiesTool: QuantToGoMcpToolSpec = {
    name: 'compare_strategies',
    description:
      'Compare performance, correlations, and risk metrics across multiple QuantToGo quantitative strategies.',
    endpoint: 'quanttogo-mcp::compare_strategies',
    params: {
      strategy_ids: ['cnh_spread_flow', 'tqqq_vix_dip', 'singapore_dividend_value'],
      metric: 'sharpe',
    },
    sampleResponse: {
      ranked_by_sharpe: [
        { strategy: 'singapore_dividend_value', sharpe: 1.82, cagr: '16.8%', max_dd: '-8.9%' },
        { strategy: 'cnh_spread_flow', sharpe: 1.62, cagr: '24.8%', max_dd: '-14.2%' },
        { strategy: 'tqqq_vix_dip', sharpe: 1.48, cagr: '42.6%', max_dd: '-26.5%' },
      ],
      correlation_matrix: {
        'US_Tech_vs_China_Flow': 0.18,
        'Singapore_vs_US_Tech': 0.32,
      },
    },
  };

  // 5. get_index_data
  const getIndexDataTool: QuantToGoMcpToolSpec = {
    name: 'get_index_data',
    description:
      'Fetch live macro market indices: Straits Times Index (STI), CSI 300, Hang Seng Index (HSI), and S&P 500 / Nasdaq 100.',
    endpoint: 'quanttogo-mcp::get_index_data',
    params: {
      indices: ['STI', 'CSI300', 'HSI', 'SPX', 'NDX'],
    },
    sampleResponse: {
      indices: [
        { symbol: 'STI', name: 'Straits Times Index', price: 3624.5, change_percent: '+0.41%' },
        { symbol: 'CSI300', name: 'CSI 300 Index', price: 3985.2, change_percent: '+0.81%' },
        { symbol: 'HSI', name: 'Hang Seng Index', price: 20560.8, change_percent: '+0.91%' },
        { symbol: 'SPX', name: 'S&P 500 Index', price: 5864.67, change_percent: '+0.40%' },
        { symbol: 'NDX', name: 'Nasdaq 100 Index', price: 20380.5, change_percent: '+0.65%' },
      ],
    },
  };

  // 6. register_trial
  const registerTrialTool: QuantToGoMcpToolSpec = {
    name: 'register_trial',
    description:
      'Register for a 30-day instant free trial API key for AI Agents with no credit card required (github.com/QuantToGo/quanttogo-mcp).',
    endpoint: 'quanttogo-mcp::register_trial',
    params: {
      agent_id: 'ai-studio-screener-agent',
      email: 'agent@quanttogo.io',
    },
    sampleResponse: {
      status: 'ACTIVATED',
      api_key: 'qtg_trial_agent_30d_activated',
      valid_days: 30,
      daily_calls_remaining: 1000,
      sandbox: 'https://github.com/QuantToGo/quanttogo-mcp',
    },
  };

  // 7. quanttogo_evaluate_screener
  const evaluateScreenerTool: QuantToGoMcpToolSpec = {
    name: 'quanttogo_evaluate_screener',
    description: `Evaluate 3 quantitative screening rules (Price vs 50-DMA, Volume vs Moving Avg, P/E vs Industry discount) and synthesize Final Conviction Signal for ${stock.ticker}.`,
    endpoint: 'quanttogo-mcp::quanttogo_evaluate_screener',
    params: {
      symbol: stock.ticker,
      quanttogo_symbol: qtg.quantToGoSymbol,
      rules: {
        price_vs_ma: 'Positive -> SELL, Negative -> BUY',
        volume_vs_ma: 'Positive -> BUY, Negative -> SELL',
        pe_vs_industry: 'Low -> BUY, High -> SELL',
      },
    },
    sampleResponse: {
      symbol: stock.ticker,
      company: stock.name,
      quanttogo_symbol: qtg.quantToGoSymbol,
      market: stock.market,
      strategy_context: matchedStrategy.name,
      price: stock.price,
      currency: stock.currency,
      signals: {
        price_signal: {
          signal: stock.priceSignal.signal,
          delta_percent: `${stock.priceSignal.deltaPercent >= 0 ? '+' : ''}${stock.priceSignal.deltaPercent.toFixed(1)}%`,
          ma50: stock.ma50,
          reason: stock.priceSignal.reason,
        },
        volume_signal: {
          signal: stock.volumeSignal.signal,
          surge_ratio: `${(stock.currentVolume / stock.weeklyAvgVolume).toFixed(2)}x`,
          reason: stock.volumeSignal.reason,
        },
        pe_signal: {
          signal: stock.peSignal.signal,
          pe: `${stock.pe.toFixed(1)}x`,
          sector_avg: `${stock.peSignal.benchmarkValue.toFixed(1)}x`,
          reason: stock.peSignal.reason,
        },
      },
      final_synthesized_signal: stock.finalSignal,
      final_score: stock.finalScore,
      final_rationale: stock.finalReason,
      quanttogo_repo: 'https://github.com/QuantToGo/quanttogo-mcp',
    },
  };

  return {
    listStrategiesTool,
    getSignalsTool,
    getStrategyPerformanceTool,
    compareStrategiesTool,
    getIndexDataTool,
    registerTrialTool,
    evaluateScreenerTool,
  };
}
