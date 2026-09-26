/**
 * Type definitions for QuantToGo MCP Server
 * GitHub Repository: https://github.com/QuantToGo/quanttogo-mcp
 * Package: quanttogo-mcp (npx quanttogo-mcp)
 * Model Context Protocol (MCP) Standard for Quantitative Macro Trading Signals & Alpha Strategies
 */

export type MarketRegion = 'Singapore' | 'China' | 'Hong Kong' | 'US' | 'Global';
export type CurrencyCode = 'SGD' | 'CNY' | 'HKD' | 'USD';

export type SignalType = 'BUY' | 'NEUTRAL' | 'SELL';
export type FinalSignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface QuantToGoStrategyDefinition {
  id: string;
  name: string;
  market: MarketRegion;
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

export interface QuantToGoStockDefinition {
  ticker: string;              // Base symbol e.g. "D05", "AAPL", "600519", "0700"
  name: string;                // Company name
  quantToGoSymbol: string;     // Standard format: "SGX:D05", "NASDAQ:AAPL", "SHA:600519", "HKG:0700"
  exchange: string;            // "SGX", "HKEX", "NASDAQ", "NYSE", "SHA", "SHE"
  market: MarketRegion;        // Market region
  currency: CurrencyCode;      // Local currency
  sector: string;              // GICS Sector
  price: number;               // Current market price
  change: number;              // Absolute change
  changePercent: number;       // Daily percent change
  ma50: number;                // 50-Day Simple Moving Average
  currentVolume: number;       // Latest trading volume
  weeklyAvgVolume: number;     // Average daily volume over past week
  pe: number;                  // Trailing Price-to-Earnings ratio
  low52w: number;              // 52-week low
  high52w: number;             // 52-week high
  marketCap: string;           // Market capitalization formatted
  dividendYield: number;       // Dividend yield percentage
  quantToGoStrategyId: string; // Associated QuantToGo strategy
  quantToGoUrl: string;        // https://github.com/QuantToGo/quanttogo-mcp
}

export interface SignalBreakdown {
  signal: SignalType;
  label: string;
  value: number;
  benchmarkValue: number;
  deltaPercent: number;
  reason: string;
}

export interface EvaluatedStock extends QuantToGoStockDefinition {
  priceSignal: SignalBreakdown;
  volumeSignal: SignalBreakdown;
  peSignal: SignalBreakdown;
  finalSignal: FinalSignalType;
  finalScore: number;
  finalReason: string;
  sectorAvgPE: number;
}

export interface QuantToGoQuoteResponse {
  quantToGoSymbol: string;
  ticker: string;
  name: string;
  exchange: string;
  market: MarketRegion;
  currency: CurrencyCode;
  price: number;
  change: number;
  changePercent: number;
  ma50: number;
  ma50DistancePercent: number;
  priceSignal: SignalType;
  volume: number;
  weeklyAvgVolume: number;
  volumeSurgeRatio: number;
  volumeSignal: SignalType;
  pe: number;
  sectorAvgPE: number;
  peDiscountPercent: number;
  peSignal: SignalType;
  finalConviction: FinalSignalType;
  high52w: number;
  low52w: number;
  marketCap: string;
  dividendYield: number;
  quantToGoStrategy: string;
  quantToGoUrl: string;
  mcpSource: string;
  timestamp: string;
}

export interface QuantToGoHistoricalBar {
  dayIndex: number;
  dateOffset: string;
  close: number;
  volume: number;
  ma50Snapshot: number;
}

export interface QuantToGoHistoricalResponse {
  quantToGoSymbol: string;
  ticker: string;
  exchange: string;
  pointsCount: number;
  currentPrice: number;
  ma50: number;
  history50d: number[];
  recentBars: QuantToGoHistoricalBar[];
}

export interface MarketIndexSummary {
  symbol: string;
  name: string;
  market: MarketRegion;
  price: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
}

export interface QuantToGoTrialResponse {
  status: 'ACTIVATED';
  apiKey: string;
  validDays: number;
  dailyCallsLimit: number;
  environment: 'trial';
  githubUrl: string;
  issuedAt: string;
}
