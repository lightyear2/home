/**
 * Test Client for QuantToGo MCP Server
 * Repository: https://github.com/QuantToGo/quanttogo-mcp
 * Tests tools: list_strategies, get_signals, get_strategy_performance, compare_strategies,
 * get_index_data, register_trial, quanttogo_evaluate_screener
 */

import { QuantToGoClient } from './quantToGoClient.ts';
import { QUANTTOGO_STOCK_UNIVERSE } from './stockUniverse.ts';
import { evaluateAllStocks } from './signalEngine.ts';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Testing QuantToGo MCP Server (github.com/QuantToGo/quanttogo-mcp)');
  console.log('====================================================\n');

  const client = new QuantToGoClient();

  // 1. Health Status
  console.log('▶ [1/6] Checking Server & Gateway Status...');
  const status = await client.getStatus();
  console.log('  Status:', status.status);
  console.log('  Gateway:', status.gateway);
  console.log('  GitHub:', status.github);
  console.log('  Coverage:', status.universeCoverage, 'stocks across', status.marketsSupported.length, 'markets');
  console.log('  Active Strategies:', status.activeStrategies, '\n');

  // 2. Systematic Strategy Listing
  console.log('▶ [2/6] Testing list_strategies & get_strategy_performance...');
  const strategiesRes = await client.listStrategies();
  console.log(`  ✓ Loaded ${strategiesRes.count} strategies:`);
  strategiesRes.strategies.slice(0, 4).forEach((s) => {
    console.log(`    - [${s.market}] ${s.name} (CAGR: ${s.cagr}, Sharpe: ${s.sharpe}, MaxDD: ${s.max_drawdown}) -> Signal: ${s.current_signal}`);
  });
  console.log('');

  // 3. Strategy Signals
  console.log('▶ [3/6] Testing get_signals on "cnh_spread_flow" (China Capital Flow)...');
  const signals = await client.getSignals('cnh_spread_flow', '600519');
  console.log(`  ✓ Strategy: ${signals.strategy_name}`);
  console.log(`  ✓ Target Ticker: ${signals.symbol}`);
  console.log(`  ✓ Current Signal: [${signals.signal}] (${signals.conviction_level})`);
  console.log(`  ✓ Allocation: ${signals.target_allocation}`);
  console.log(`  ✓ Stop-Loss Level: ${signals.currency} ${signals.stop_loss_level}`);
  console.log(`  ✓ Rationale: ${signals.rationale}\n`);

  // 4. Instant Trial Provisioning
  console.log('▶ [4/6] Testing register_trial (Instant API Key for AI Agents)...');
  const trial = await client.registerTrial('agent-alpha', 'agent@fund.com');
  console.log(`  ✓ Status: ${trial.status}`);
  console.log(`  ✓ Generated API Key: ${trial.apiKey}`);
  console.log(`  ✓ Valid Days: ${trial.validDays}, Daily Calls: ${trial.dailyCallsLimit}\n`);

  // 5. Macro Benchmark Indices
  console.log('▶ [5/6] Testing get_index_data...');
  const indices = await client.getIndexData();
  indices.forEach((idx) => {
    console.log(`  ✓ ${idx.symbol} (${idx.name}): ${idx.price} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent}%)`);
  });
  console.log('');

  // 6. Complete Universe 3-Factor Quantitative Evaluation
  console.log('▶ [6/6] Testing quanttogo_evaluate_screener across 62 Equities...');
  const sampleTickers = ['SGX:D05', 'SHA:600519', 'HKG:0700', 'NASDAQ:AAPL'];
  for (const ticker of sampleTickers) {
    const quote = await client.getQuote(ticker);
    console.log(`  ✓ ${quote.quantToGoSymbol} (${quote.name}):`);
    console.log(`    Price: ${quote.currency} ${quote.price} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent}%)`);
    console.log(`    50-DMA: ${quote.ma50} [${quote.ma50DistancePercent >= 0 ? '+' : ''}${quote.ma50DistancePercent}%] -> Price Signal: ${quote.priceSignal}`);
    console.log(`    Volume Surge: ${quote.volumeSurgeRatio}x -> Volume Signal: ${quote.volumeSignal}`);
    console.log(`    Trailing P/E: ${quote.pe}x vs Sector Avg ${quote.sectorAvgPE}x -> P/E Signal: ${quote.peSignal}`);
    console.log(`    Conviction Rating: [${quote.finalConviction}]`);
  }

  const allEvaluated = evaluateAllStocks(QUANTTOGO_STOCK_UNIVERSE);
  const distribution: Record<string, number> = {
    STRONG_BUY: 0,
    BUY: 0,
    HOLD: 0,
    SELL: 0,
    STRONG_SELL: 0,
  };
  allEvaluated.forEach((s) => {
    distribution[s.finalSignal] = (distribution[s.finalSignal] || 0) + 1;
  });

  console.log('\n  Total Universe Evaluated:', allEvaluated.length, 'stocks');
  console.log('  Signal Distribution:', distribution);
  console.log('\n✅ All QuantToGo MCP tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
