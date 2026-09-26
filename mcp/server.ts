#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) Server for QuantToGo
 * GitHub: https://github.com/QuantToGo/quanttogo-mcp
 * Standard: Model Context Protocol (JSON-RPC 2.0 over stdio)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { QuantToGoClient } from './quantToGoClient.ts';
import { QUANTTOGO_STOCK_UNIVERSE, QUANTTOGO_STRATEGIES, findStockInUniverse } from './stockUniverse.ts';
import {
  evaluateStock,
  evaluateAllStocks,
  computeSectorAveragePEs,
  DEFAULT_SIGNAL_CONFIG,
} from './signalEngine.ts';

// Initialize QuantToGo Client
const qtgClient = new QuantToGoClient();

// Create MCP Server Instance
const server = new Server(
  {
    name: 'quanttogo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * Register MCP Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'quanttogo_get_status',
        description:
          'Check status and gateway capabilities of the QuantToGo MCP server (github.com/QuantToGo/quanttogo-mcp).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_strategies',
        description:
          'List all available macro and factor quantitative strategies with live performance, CAGR, Sharpe ratio, Max Drawdown, and current signals from QuantToGo.',
        inputSchema: {
          type: 'object',
          properties: {
            market: {
              type: 'string',
              enum: ['ALL', 'US', 'China', 'Hong Kong', 'Singapore', 'Global'],
              description: 'Filter strategies by target market region',
            },
          },
        },
      },
      {
        name: 'get_signals',
        description:
          'Retrieve latest timestamped buy/sell trading signals, target portfolio allocation, and stop-loss levels for a specific QuantToGo strategy.',
        inputSchema: {
          type: 'object',
          properties: {
            strategy_id: {
              type: 'string',
              description: 'Strategy identifier (e.g. "cnh_spread_flow", "tqqq_vix_dip", "ashare_size_rotation", "singapore_dividend_value")',
            },
            symbol: {
              type: 'string',
              description: 'Optional ticker symbol (e.g. "D05", "AAPL", "600519")',
            },
            api_key: {
              type: 'string',
              description: 'QuantToGo API key (optional for preview, required for live production signals)',
            },
          },
          required: ['strategy_id'],
        },
      },
      {
        name: 'get_strategy_performance',
        description:
          'Retrieve detailed risk-adjusted performance metrics, Sharpe ratio, Sortino, max drawdown, and historical NAV for a QuantToGo strategy.',
        inputSchema: {
          type: 'object',
          properties: {
            strategy_id: {
              type: 'string',
              description: 'Strategy identifier (e.g. "cnh_spread_flow", "tqqq_vix_dip")',
            },
            timeframe: {
              type: 'string',
              description: 'Historical timeframe (e.g. "1M", "3M", "1Y", "ALL")',
            },
          },
          required: ['strategy_id'],
        },
      },
      {
        name: 'compare_strategies',
        description:
          'Compare performance, Sharpe ratios, and cross-correlations across multiple QuantToGo quantitative strategies.',
        inputSchema: {
          type: 'object',
          properties: {
            strategy_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of strategy IDs to compare',
            },
          },
        },
      },
      {
        name: 'get_index_data',
        description:
          'Fetch live macro market indices: Straits Times Index (STI), CSI 300, Hang Seng Index (HSI), S&P 500, and Nasdaq 100.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'register_trial',
        description:
          'Register for a 30-day instant free trial API key for AI Agents with no credit card required (github.com/QuantToGo/quanttogo-mcp).',
        inputSchema: {
          type: 'object',
          properties: {
            agent_id: {
              type: 'string',
              description: 'Identifier for the AI agent',
            },
            email: {
              type: 'string',
              description: 'Agent contact or owner email',
            },
          },
        },
      },
      {
        name: 'get_subscription_info',
        description: 'Get subscription tiers, quotas, and API access levels.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_subscription',
        description: 'Verify API key status and remaining daily requests quota.',
        inputSchema: {
          type: 'object',
          properties: {
            api_key: {
              type: 'string',
              description: 'QuantToGo API key to inspect',
            },
          },
        },
      },
      {
        name: 'quanttogo_evaluate_screener',
        description:
          'Evaluate the 3 quantitative screener rules (Price vs 50-DMA mean reversion, Volume accumulation, P/E vs Industry valuation discount) and produce final conviction score.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol (e.g. "SGX:D05", "NASDAQ:AAPL", "HKG:0700", "SHA:600519", or "D05")',
            },
            maNeutralBandPercent: {
              type: 'number',
              description: 'Price vs MA neutral tolerance band percentage (default: 0.8)',
            },
            volumeSurgeRatio: {
              type: 'number',
              description: 'Volume multiplier threshold vs weekly average (default: 1.05)',
            },
            peTolerancePercent: {
              type: 'number',
              description: 'Valuation difference percentage vs sector average (default: 10.0)',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'quanttogo_get_screener_stocks',
        description:
          'Retrieve the complete multi-market stock universe (62 stocks across STI 30, CSI 10, Hang Seng 10, S&P 12) with QuantToGo symbols, exchange codes, and optional quantitative signals evaluation.',
        inputSchema: {
          type: 'object',
          properties: {
            market: {
              type: 'string',
              enum: ['ALL', 'Singapore', 'China', 'Hong Kong', 'US'],
              description: 'Filter by equity market region (default: ALL)',
            },
            includeEvaluation: {
              type: 'boolean',
              description: 'Whether to evaluate Price vs MA, Volume, and P/E signals for each stock (default: true)',
            },
          },
        },
      },
      {
        name: 'quanttogo_get_quote',
        description:
          'Get real-time market quote, 50-day moving average, daily volume, trailing P/E, and quantitative signal analysis for any stock in Singapore, China, Hong Kong, or US.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol or QuantToGo ticker (e.g. "SGX:D05", "NASDAQ:AAPL", "HKG:0700", "SHA:600519")',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'quanttogo_get_50d_history',
        description:
          'Get 50 daily closing prices and moving average bar series used for technical trend analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock symbol or QuantToGo ticker',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'quanttogo_search',
        description:
          'Search for equities across the universe by ticker, QuantToGo symbol, company name, or sector.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search string e.g. "DBS", "Apple", "SGX:D05", "Tencent"',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

/**
 * Handle MCP Tool Execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'quanttogo_get_status': {
        const status = await qtgClient.getStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'list_strategies': {
        const market = (args?.market as string) || undefined;
        const res = await qtgClient.listStrategies(market);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'get_signals': {
        const strategyId = String(args?.strategy_id || 'cnh_spread_flow');
        const symbol = args?.symbol ? String(args.symbol) : undefined;
        const apiKey = args?.api_key ? String(args.api_key) : undefined;
        const res = await qtgClient.getSignals(strategyId, symbol, apiKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'get_strategy_performance': {
        const strategyId = String(args?.strategy_id || 'cnh_spread_flow');
        const timeframe = (args?.timeframe as string) || '1Y';
        const res = await qtgClient.getStrategyPerformance(strategyId, timeframe);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'compare_strategies': {
        const strategyIds = (args?.strategy_ids as string[]) || undefined;
        const res = await qtgClient.compareStrategies(strategyIds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'get_index_data': {
        const res = await qtgClient.getIndexData();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'register_trial': {
        const agentId = (args?.agent_id as string) || 'ai-studio-screener-agent';
        const email = (args?.email as string) || 'agent@hedgefund.io';
        const res = await qtgClient.registerTrial(agentId, email);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'get_subscription_info': {
        const res = await qtgClient.getSubscriptionInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'check_subscription': {
        const apiKey = (args?.api_key as string) || undefined;
        const res = await qtgClient.checkSubscription(apiKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      case 'quanttogo_evaluate_screener': {
        const symbol = String(args?.symbol || '');
        if (!symbol) {
          throw new McpError(ErrorCode.InvalidParams, 'Parameter "symbol" is required.');
        }

        const customConfig = {
          maNeutralBandPercent:
            typeof args?.maNeutralBandPercent === 'number'
              ? args.maNeutralBandPercent
              : DEFAULT_SIGNAL_CONFIG.maNeutralBandPercent,
          volumeSurgeRatio:
            typeof args?.volumeSurgeRatio === 'number'
              ? args.volumeSurgeRatio
              : DEFAULT_SIGNAL_CONFIG.volumeSurgeRatio,
          peTolerancePercent:
            typeof args?.peTolerancePercent === 'number'
              ? args.peTolerancePercent
              : DEFAULT_SIGNAL_CONFIG.peTolerancePercent,
        };

        const evaluated = await qtgClient.evaluateStockSignals(symbol, customConfig);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  stock: evaluated.ticker,
                  name: evaluated.name,
                  quantToGoSymbol: evaluated.quantToGoSymbol,
                  market: evaluated.market,
                  price: evaluated.price,
                  signals: {
                    priceSignal: evaluated.priceSignal,
                    volumeSignal: evaluated.volumeSignal,
                    peSignal: evaluated.peSignal,
                  },
                  finalAssessment: {
                    signal: evaluated.finalSignal,
                    score: evaluated.finalScore,
                    reason: evaluated.finalReason,
                  },
                  quantToGoStrategyId: evaluated.quantToGoStrategyId,
                  quantToGoUrl: evaluated.quantToGoUrl,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'quanttogo_get_screener_stocks': {
        const market = (args?.market as string) || 'ALL';
        const includeEvaluation = args?.includeEvaluation !== false;

        let stocks = QUANTTOGO_STOCK_UNIVERSE;
        if (market !== 'ALL') {
          stocks = stocks.filter((s) => s.market === market);
        }

        if (includeEvaluation) {
          const evaluated = evaluateAllStocks(stocks);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    marketFilter: market,
                    count: evaluated.length,
                    stocks: evaluated.map((s) => ({
                      ticker: s.ticker,
                      quantToGoSymbol: s.quantToGoSymbol,
                      exchange: s.exchange,
                      name: s.name,
                      market: s.market,
                      sector: s.sector,
                      price: s.price,
                      changePercent: s.changePercent,
                      ma50: s.ma50,
                      currentVolume: s.currentVolume,
                      weeklyAvgVolume: s.weeklyAvgVolume,
                      pe: s.pe,
                      priceSignal: s.priceSignal.signal,
                      volumeSignal: s.volumeSignal.signal,
                      peSignal: s.peSignal.signal,
                      finalSignal: s.finalSignal,
                      finalScore: s.finalScore,
                      quantToGoStrategyId: s.quantToGoStrategyId,
                      quantToGoUrl: s.quantToGoUrl,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  marketFilter: market,
                  count: stocks.length,
                  stocks: stocks.map((s) => ({
                    ticker: s.ticker,
                    quantToGoSymbol: s.quantToGoSymbol,
                    exchange: s.exchange,
                    name: s.name,
                    market: s.market,
                    sector: s.sector,
                    price: s.price,
                    changePercent: s.changePercent,
                    quantToGoUrl: s.quantToGoUrl,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'quanttogo_get_quote': {
        const symbol = String(args?.symbol || '');
        if (!symbol) {
          throw new McpError(ErrorCode.InvalidParams, 'Parameter "symbol" is required.');
        }
        const quote = await qtgClient.getQuote(symbol);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(quote, null, 2),
            },
          ],
        };
      }

      case 'quanttogo_get_50d_history': {
        const symbol = String(args?.symbol || '');
        if (!symbol) {
          throw new McpError(ErrorCode.InvalidParams, 'Parameter "symbol" is required.');
        }
        const history = await qtgClient.get50DayHistory(symbol);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(history, null, 2),
            },
          ],
        };
      }

      case 'quanttogo_search': {
        const query = String(args?.query || '');
        const results = await qtgClient.search(query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  count: results.length,
                  results: results.map((s) => ({
                    ticker: s.ticker,
                    quantToGoSymbol: s.quantToGoSymbol,
                    exchange: s.exchange,
                    name: s.name,
                    market: s.market,
                    price: s.price,
                    changePercent: s.changePercent,
                    quantToGoUrl: s.quantToGoUrl,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool "${name}".`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `[Error executing ${name}]: ${error.message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Register MCP Resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'quanttogo://strategies',
        name: 'QuantToGo Systematic Alpha Strategies',
        description: 'Catalog of 8 systematic macro and factor quantitative trading strategies with live CAGR and Sharpe ratios.',
        mimeType: 'application/json',
      },
      {
        uri: 'quanttogo://screener/stocks',
        name: 'Multi-Market 62-Stock Universe',
        description: 'Complete list of 62 equities across Singapore, China, Hong Kong, and US with QuantToGo symbols.',
        mimeType: 'application/json',
      },
      {
        uri: 'quanttogo://indices',
        name: 'Regional Benchmark Indices',
        description: 'Live snapshots of STI, CSI 300, HSI, S&P 500, and Nasdaq 100.',
        mimeType: 'application/json',
      },
    ],
  };
});

/**
 * Read MCP Resources
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'quanttogo://strategies') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(QUANTTOGO_STRATEGIES, null, 2),
        },
      ],
    };
  }

  if (uri === 'quanttogo://screener/stocks') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(QUANTTOGO_STOCK_UNIVERSE, null, 2),
        },
      ],
    };
  }

  if (uri === 'quanttogo://indices') {
    const indices = await qtgClient.getIndexData();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(indices, null, 2),
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Resource "${uri}" not found.`);
});

/**
 * Register MCP Prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'quanttogo_analyze_strategy',
        description: 'Analyze an equity ticker using QuantToGo systematic strategies and quantitative screener rules.',
        arguments: [
          {
            name: 'symbol',
            description: 'Ticker symbol or QuantToGo symbol (e.g. SGX:D05, NASDAQ:AAPL)',
            required: true,
          },
        ],
      },
      {
        name: 'quanttogo_daily_briefing',
        description: 'Generate an executive daily market briefing highlighting top Buy and Sell signals across the 4 markets.',
        arguments: [],
      },
    ],
  };
});

/**
 * Get MCP Prompt Content
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'quanttogo_analyze_strategy') {
    const symbol = String(args?.symbol || 'SGX:D05');
    const stock = findStockInUniverse(symbol);
    const sectorAverages = computeSectorAveragePEs(QUANTTOGO_STOCK_UNIVERSE);
    const evaluated = stock
      ? evaluateStock(stock, sectorAverages[stock.sector] || stock.pe, DEFAULT_SIGNAL_CONFIG)
      : null;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate a comprehensive systematic investment assessment for ${symbol} using QuantToGo quantitative models (github.com/QuantToGo/quanttogo-mcp):

Rule 1 (Price vs 50-DMA Mean Reversion):
${evaluated ? `Current: ${evaluated.price}, 50-DMA: ${evaluated.ma50}, Distance: ${evaluated.priceSignal.deltaPercent}%, Signal: ${evaluated.priceSignal.signal}` : 'N/A'}
Rule: Price vs moving average positive triggers SELL (mean-reversion), negative triggers BUY (dip).

Rule 2 (Volume Accumulation vs Weekly Average):
${evaluated ? `Daily Vol: ${evaluated.currentVolume}, Weekly Avg: ${evaluated.weeklyAvgVolume}, Ratio: ${(evaluated.currentVolume / evaluated.weeklyAvgVolume).toFixed(2)}x, Signal: ${evaluated.volumeSignal.signal}` : 'N/A'}
Rule: Volume vs moving average positive triggers BUY (accumulation), negative triggers SELL (waning interest).

Rule 3 (P/E Valuation Discount vs Sector Average):
${evaluated ? `Trailing P/E: ${evaluated.pe}x, Sector Avg: ${evaluated.sectorAvgPE}x, Delta: ${evaluated.peSignal.deltaPercent}%, Signal: ${evaluated.peSignal.signal}` : 'N/A'}
Rule: Low P/E triggers BUY (discount), high P/E triggers SELL (premium).

Final Synthesized Conviction: ${evaluated ? evaluated.finalSignal : 'N/A'} (${evaluated ? evaluated.finalScore : 0}/3)
Rationale: ${evaluated ? evaluated.finalReason : 'N/A'}
QuantToGo Strategy Mapping: ${evaluated ? evaluated.quantToGoStrategyId : 'N/A'}
Repository: https://github.com/QuantToGo/quanttogo-mcp`,
          },
        },
      ],
    };
  }

  if (name === 'quanttogo_daily_briefing') {
    const evaluated = evaluateAllStocks(QUANTTOGO_STOCK_UNIVERSE);
    const strongBuys = evaluated.filter((s) => s.finalSignal === 'STRONG_BUY');
    const buys = evaluated.filter((s) => s.finalSignal === 'BUY');
    const strongSells = evaluated.filter((s) => s.finalSignal === 'STRONG_SELL');

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Provide a high-conviction market screener briefing across Singapore (STI 30), China (CSI 10), Hong Kong (HSI 10), and US (S&P 12) markets based on QuantToGo quantitative signals.

Current Highlights:
- Strong Buy Candidates (${strongBuys.length}): ${strongBuys.map((s) => `${s.quantToGoSymbol} (${s.name})`).join(', ') || 'None'}
- Buy Candidates (${buys.length}): ${buys.map((s) => `${s.quantToGoSymbol}`).join(', ')}
- Strong Sell Warnings (${strongSells.length}): ${strongSells.map((s) => `${s.quantToGoSymbol} (${s.name})`).join(', ') || 'None'}

Please provide systematic recommendations for portfolio allocators focusing on risk-reward and sector balance.`,
          },
        },
      ],
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Prompt "${name}" not found.`);
});

/**
 * Start Server on stdio
 */
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[QuantToGo MCP Server] running via Model Context Protocol stdio transport (github.com/QuantToGo/quanttogo-mcp)');
}

run().catch((error) => {
  console.error('[QuantToGo MCP Server] fatal error:', error);
  process.exit(1);
});
