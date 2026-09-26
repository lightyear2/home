import React, { useState } from 'react';
import { EvaluatedStock } from '../types/stock';
import {
  QuantToGoConnectionConfig,
  QUANTTOGO_STRATEGIES,
  QuantToGoStrategy,
  getStockQuantToGoMcpSpecs,
} from '../utils/quantToGoMcp';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Activity,
  BarChart3,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface QuantToGoMcpModalProps {
  stocks: EvaluatedStock[];
  config: QuantToGoConnectionConfig;
  onUpdateConfig: (newConfig: QuantToGoConnectionConfig) => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onClose: () => void;
  onSelectStock: (stock: EvaluatedStock) => void;
}

export const QuantToGoMcpModal: React.FC<QuantToGoMcpModalProps> = ({
  stocks,
  config,
  onUpdateConfig,
  onTriggerSync,
  isSyncing,
  onClose,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<
    'strategies' | 'tools' | 'evaluator' | 'quickstart' | 'trial'
  >('strategies');
  const [selectedStrategy, setSelectedStrategy] = useState<QuantToGoStrategy>(
    QUANTTOGO_STRATEGIES[0]
  );
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<boolean>(false);
  const [copiedConfigJson, setCopiedConfigJson] = useState<boolean>(false);
  const [copiedToolJson, setCopiedToolJson] = useState<string | null>(null);
  const [testTicker, setTestTicker] = useState<string>('D05.SI');
  const [trialEmail, setTrialEmail] = useState<string>('trader@hedgefund.io');
  const [trialApiKey, setTrialApiKey] = useState<string>(config.apiKey || 'qtg_trial_agent_30d');
  const [trialRegistered, setTrialRegistered] = useState<boolean>(false);

  const selectedStock = stocks.find((s) => s.ticker === testTicker) || stocks[0];
  const mcpSpecs = getStockQuantToGoMcpSpecs(selectedStock);

  const claudeDesktopConfigJson = {
    mcpServers: {
      quanttogo: {
        command: 'npx',
        args: ['-y', 'quanttogo-mcp'],
        env: {
          QUANTTOGO_API_KEY: trialApiKey,
        },
      },
      'quanttogo-local': {
        command: 'npx',
        args: ['-y', 'tsx', 'mcp/server.ts'],
        env: {},
      },
    },
  };

  const handleRegisterTrial = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedKey = `qtg_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    setTrialApiKey(generatedKey);
    setTrialRegistered(true);
    onUpdateConfig({
      ...config,
      apiKey: generatedKey,
      environment: 'trial',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0b0f17] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar with QuantToGo Branding */}
        <div className="p-6 border-b border-slate-800 bg-[#0f172a]/90 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-black text-xl shrink-0 shadow-inner">
              QTG
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xl font-bold text-white tracking-wide">
                  QuantToGo MCP
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Quant Signals
                </span>
                <span className="text-slate-600">·</span>
                <a
                  href="https://github.com/QuantToGo/quanttogo-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono hover:underline"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>github.com/QuantToGo/quanttogo-mcp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Macro-factor quantitative trading signals and systematic alpha strategies for US, China, Hong Kong, and Singapore markets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Poll live quant signals from QuantToGo server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSyncing ? 'Polling...' : 'Sync Ticks'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-[#0e1422] px-6 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('strategies')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'strategies'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Quantitative Strategies ({QUANTTOGO_STRATEGIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tools'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>MCP Tools Catalog (8 Tools)</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluator')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'evaluator'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3-Factor Screener Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('quickstart')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quickstart'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Claude & Cursor Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('trial')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'trial'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>30-Day Free Trial Key</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* TAB 1: QUANTITATIVE STRATEGIES */}
          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="bg-[#121929] p-4 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="font-bold text-white">Live Forward-Tracked Alpha Strategies:</span>
                  <span className="text-slate-400 ml-1.5">
                    QuantToGo serves timestamped, auditable buy/sell signals designed for systematic allocators and autonomous AI agents.
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">Benchmark:</span>
                  <span className="text-cyan-400 font-semibold">CSI 300 / Nasdaq 100 / STI</span>
                </div>
              </div>

              {/* Strategies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUANTTOGO_STRATEGIES.map((strat) => {
                  const isSelected = selectedStrategy.id === strat.id;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => setSelectedStrategy(strat)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#142036] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                          : 'bg-[#111726] border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{strat.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono bg-slate-800 text-slate-300">
                              {strat.market}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            ID: {strat.id}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                            strat.currentSignal === 'BUY'
                              ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                              : strat.currentSignal === 'SELL'
                              ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                              : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                          }`}
                        >
                          {strat.currentSignal}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mb-3 line-clamp-2">{strat.description}</p>

                      {/* Performance Metrics Row */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center font-mono text-[11px]">
                        <div className="bg-[#0b0f17] p-1.5 rounded">
                          <span className="text-[10px] text-slate-500 block">CAGR</span>
                          <span className="text-emerald-400 font-bold">+{strat.cagr}%</span>
                        </div>
                        <div className="bg-[#0b0f17] p-1.5 rounded">
                          <span className="text-[10px] text-slate-500 block">Sharpe</span>
                          <span className="text-cyan-300 font-bold">{strat.sharpe}</span>
                        </div>
                        <div className="bg-[#0b0f17] p-1.5 rounded">
                          <span className="text-[10px] text-slate-500 block">Max DD</span>
                          <span className="text-rose-400 font-bold">{strat.maxDrawdown}%</span>
                        </div>
                        <div className="bg-[#0b0f17] p-1.5 rounded">
                          <span className="text-[10px] text-slate-500 block">Win Rate</span>
                          <span className="text-slate-200 font-bold">{strat.winRate}%</span>
                        </div>
                      </div>

                      {/* Current Allocation & Rationale */}
                      <div className="mt-3 bg-[#0b0f17]/90 p-2.5 rounded-lg border border-slate-800/80 text-[11px]">
                        <div className="flex justify-between items-center text-slate-400 mb-1 font-mono text-[10px]">
                          <span>TARGET ALLOCATION:</span>
                          <span className="text-emerald-400 font-semibold">{strat.recommendedAllocation}</span>
                        </div>
                        <p className="text-slate-300 italic">{strat.rationale}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MCP TOOLS CATALOG (8 TOOLS) */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-300">
                  Standard JSON-RPC 2.0 tools exposed by <strong className="text-cyan-400 font-mono">quanttogo-mcp</strong>:
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Transport: stdio / SSE Streamable HTTP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. list_strategies */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">list_strategies</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Free Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400">List all available macro and factor quantitative strategies with live performance metrics.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.listStrategiesTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 2. get_signals */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">get_signals</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Authenticated / Trial</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Retrieve timestamped buy/sell signals, target portfolio allocation, and stop-loss levels.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-amber-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.getSignalsTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 3. get_strategy_performance */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">get_strategy_performance</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Free Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Retrieve Sharpe ratio, Sortino, CAGR, Max Drawdown, and historical NAV curve.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-cyan-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.getStrategyPerformanceTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 4. compare_strategies */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">compare_strategies</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Free Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Multi-strategy cross-correlation matrix and risk-return ranking comparison.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-purple-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.compareStrategiesTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 5. get_index_data */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">get_index_data</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Free Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Macro indices: Straits Times Index (STI), CSI 300, Hang Seng Index (HSI), S&P 500, Nasdaq 100.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-sky-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.getIndexDataTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 6. register_trial */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">register_trial</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Instant Provisioning</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Self-serve instant 30-day trial API key generation for autonomous agents without human friction.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-teal-400 overflow-x-auto max-h-32">
                    {JSON.stringify(mcpSpecs.registerTrialTool.sampleResponse, null, 2)}
                  </pre>
                </div>

                {/* 7. quanttogo_evaluate_screener */}
                <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">quanttogo_evaluate_screener</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">62-Stock Multi-Factor Screener</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Evaluates Price vs 50-DMA mean reversion, Volume accumulation, and P/E sector discount into synthesized conviction.</p>
                  <pre className="p-2.5 bg-[#0b0f17] rounded border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-40">
                    {JSON.stringify(mcpSpecs.evaluateScreenerTool.sampleResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 3-FACTOR SCREENER INTEGRATION */}
          {activeTab === 'evaluator' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 bg-[#111726] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">Select Stock to Evaluate:</span>
                  <select
                    value={testTicker}
                    onChange={(e) => setTestTicker(e.target.value)}
                    className="bg-[#0b0f17] text-white font-mono text-xs border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
                  >
                    {stocks.map((s) => (
                      <option key={s.id} value={s.ticker}>
                        {s.ticker} ({s.quantToGoSymbol}) - {s.name} [{s.market}]
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectStock(selectedStock);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Full Detail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Evaluated Live Result for Selected Stock */}
              <div className="bg-[#111726] p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedStock.name}</span>
                      <span className="font-mono text-cyan-400 text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {selectedStock.quantToGoSymbol}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sector: {selectedStock.sector} · Market: {selectedStock.market} · Price: {selectedStock.currency} {selectedStock.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Synthesized Conviction</span>
                    <span
                      className={`text-sm font-bold font-mono px-2 py-0.5 rounded border ${
                        selectedStock.finalSignal === 'STRONG_BUY' || selectedStock.finalSignal === 'BUY'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                          : selectedStock.finalSignal === 'STRONG_SELL' || selectedStock.finalSignal === 'SELL'
                          ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                          : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                      }`}
                    >
                      {selectedStock.finalSignal} ({selectedStock.finalScore}/3)
                    </span>
                  </div>
                </div>

                {/* 3 Rules Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Rule 1: Price vs 50-DMA</div>
                    <div className="text-xs font-mono text-white mb-1">
                      Distance: {selectedStock.priceSignal.deltaPercent >= 0 ? '+' : ''}
                      {selectedStock.priceSignal.deltaPercent.toFixed(1)}% (MA {selectedStock.ma50.toFixed(2)})
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400">Signal: {selectedStock.priceSignal.signal}</span>
                    <p className="text-[11px] text-slate-400 mt-1">{selectedStock.priceSignal.reason}</p>
                  </div>

                  <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Rule 2: Volume Accumulation</div>
                    <div className="text-xs font-mono text-white mb-1">
                      Surge: {(selectedStock.currentVolume / selectedStock.weeklyAvgVolume).toFixed(2)}x Weekly Avg
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400">Signal: {selectedStock.volumeSignal.signal}</span>
                    <p className="text-[11px] text-slate-400 mt-1">{selectedStock.volumeSignal.reason}</p>
                  </div>

                  <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Rule 3: P/E Sector Discount</div>
                    <div className="text-xs font-mono text-white mb-1">
                      P/E: {selectedStock.pe.toFixed(1)}x vs Sector {selectedStock.peSignal.benchmarkValue.toFixed(1)}x
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400">Signal: {selectedStock.peSignal.signal}</span>
                    <p className="text-[11px] text-slate-400 mt-1">{selectedStock.peSignal.reason}</p>
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-white">Synthesized Rationale: </span>
                  {selectedStock.finalReason}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLAUDE & CURSOR SETUP */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5">
              {/* Quick CLI Banner */}
              <div className="bg-[#121929] p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                  <span>{copiedInstallCmd ? 'Command Copied' : 'Copy NPX Command'}</span>
                </button>
              </div>

              {/* Claude Desktop Configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span>Claude Desktop Configuration (claude_desktop_config.json)</span>
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(claudeDesktopConfigJson, null, 2));
                      setCopiedConfigJson(true);
                      setTimeout(() => setCopiedConfigJson(false), 2000);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedConfigJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedConfigJson ? 'Copied Config' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-[#0b0f17] rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {JSON.stringify(claudeDesktopConfigJson, null, 2)}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Agent Prompts Supported:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li><strong className="text-slate-200">"Which China stocks currently have bullish QuantToGo signals and low P/E?"</strong></li>
                  <li><strong className="text-slate-200">"Run get_signals on strategy cnh_spread_flow and suggest portfolio weights."</strong></li>
                  <li><strong className="text-slate-200">"Compare performance between TQQQ VIX dip and Singapore dividend strategies."</strong></li>
                  <li><strong className="text-slate-200">"Evaluate 50-DMA mean reversion on DBS (SGX:D05) and Apple (NASDAQ:AAPL)."</strong></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: 30-DAY FREE TRIAL KEY */}
          {activeTab === 'trial' && (
            <div className="space-y-5">
              <div className="bg-[#121929] p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Instant 30-Day Free Trial for AI Agents</span>
                </div>
                <p className="text-xs text-slate-400">
                  QuantToGo provides instant API keys for AI agents with 1,000 daily requests, live forward-tracked signals, and zero credit card requirements.
                </p>

                <form onSubmit={handleRegisterTrial} className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      placeholder="agent@hedgefund.io"
                      required
                      className="flex-1 bg-[#0b0f17] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{trialRegistered ? 'Re-generate Key' : 'Get Instant API Key'}</span>
                    </button>
                  </div>
                </form>

                {trialApiKey && (
                  <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-xs font-mono">
                    <div className="text-[10px] text-slate-500 mb-1">ACTIVE TRIAL API KEY:</div>
                    <div className="text-emerald-400 font-bold flex items-center justify-between">
                      <span>{trialApiKey}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(trialApiKey);
                          alert('API key copied to clipboard!');
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
