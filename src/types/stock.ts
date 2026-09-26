export type Market = 'Singapore' | 'China' | 'Hong Kong' | 'US';

export type Currency = 'SGD' | 'CNY' | 'HKD' | 'USD';

export type SignalType = 'BUY' | 'NEUTRAL' | 'SELL';

export type FinalSignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface StockRaw {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  ma50: number;
  currentVolume: number;
  weeklyAvgVolume: number;
  pe: number; // Trailing P/E
  marketCap: string;
  dividendYield: number; // in percentage e.g. 4.5
  high52w: number;
  low52w: number;
  history50d: number[]; // 50 daily closing prices
  volumeHistory5d: number[];
  quantToGoSymbol: string; // Standardized QuantToGo symbol e.g. SGX:D05, NASDAQ:AAPL, HKG:0700, SHA:600519
  quantToGoUrl: string; // https://github.com/QuantToGo/quanttogo-mcp
  quantToGoStrategyId?: string;
  quantToGoStrategyName?: string;
  exchange: string; // SGX, HKEX, NASDAQ, NYSE, SHA, SHE
}

export type RawStockInput = Omit<
  StockRaw,
  'quantToGoSymbol' | 'quantToGoUrl' | 'quantToGoStrategyId' | 'quantToGoStrategyName' | 'exchange'
>;

export interface QuantToGoMcpToolSpec {
  name: string;
  description: string;
  endpoint: string;
  params: Record<string, unknown>;
  sampleResponse: Record<string, unknown>;
}

export interface SignalBreakdown {
  signal: SignalType;
  label: string;
  value: number;
  benchmarkValue: number;
  deltaPercent: number;
  reason: string;
}

export interface EvaluatedStock extends StockRaw {
  priceSignal: SignalBreakdown;
  volumeSignal: SignalBreakdown;
  peSignal: SignalBreakdown;
  finalSignal: FinalSignalType;
  finalScore: number;
  finalReason: string;
  isCustomized?: boolean;
}

export interface ScreenerConfig {
  maNeutralBandPercent: number; // Default 0.8%
  volumeSurgeRatio: number; // Default 1.05
  peTolerancePercent: number; // Default 5.0%
}

export type ViewMode = 'kanban' | 'table' | 'sector-matrix';

export interface FilterState {
  search: string;
  market: Market | 'ALL';
  sector: string | 'ALL';
  finalSignal: FinalSignalType | 'ALL';
  watchlistOnly: boolean;
  sortBy: 'ticker' | 'name' | 'changePercent' | 'pe' | 'ma50Delta' | 'volumeRatio';
  sortDirection: 'asc' | 'desc';
}
