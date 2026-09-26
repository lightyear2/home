# QuantToGo Model Context Protocol (MCP) Server

[![GitHub Repo](https://img.shields.io/badge/GitHub-QuantToGo%2Fquanttogo--mcp-0284c7?style=flat-square&logo=github)](https://github.com/QuantToGo/quanttogo-mcp)
[![MCP Standard](https://img.shields.io/badge/Protocol-Model%20Context%20Protocol%20v1.0-emerald?style=flat-square)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

Production-grade Model Context Protocol (MCP) server providing live macro-factor quantitative trading signals, systematic alpha strategies, and multi-factor equity screening for AI agents and quantitative allocators.

- **GitHub Repository**: [`https://github.com/QuantToGo/quanttogo-mcp`](https://github.com/QuantToGo/quanttogo-mcp)
- **NPM Package**: `quanttogo-mcp`
- **CLI Runner**: `npx -y quanttogo-mcp`
- **Markets Covered**: United States (S&P 12 / Big Tech), China (CSI 10), Hong Kong (Hang Seng 10), and Singapore (STI 30).

---

## Systematic Strategies Catalog

QuantToGo provides forward-tracked, auditable quantitative strategies for AI agents:

1. **China Capital Flow (`cnh_spread_flow`)**:
   - Offshore USD/CNH spread divergence predicting cross-border capital inflows into China A-Shares.
   - Benchmark: CSI 300 Index | CAGR: +24.8% | Sharpe: 1.62.
2. **A-Share Size Rotation (`ashare_size_rotation`)**:
   - Macro size-factor timing between mega-cap CSI 300 and small-cap CSI 1000.
   - Benchmark: CSI 300 Index | CAGR: +28.4% | Sharpe: 1.54.
3. **A-Share Limit-Down Exhaustion (`ashare_limitdown_exhaustion`)**:
   - Capitulation panic exhaustion signals for asymmetric V-bottom dip entries.
   - Benchmark: CSI 300 Index | CAGR: +31.2% | Sharpe: 1.78.
4. **US Tech 3x TQQQ VIX Dip Accumulator (`tqqq_vix_dip`)**:
   - VIX term-structure backwardation and volatility spikes for leveraged tech dip buying.
   - Benchmark: Nasdaq 100 | CAGR: +42.6% | Sharpe: 1.48.
5. **Trend-Filtered 3x Nasdaq 100 (`nasdaq_trend_filter`)**:
   - 200-DMA regime filter for systematic leverage allocation.
   - Benchmark: Nasdaq 100 | CAGR: +36.5% | Sharpe: 1.58.
6. **Contrarian Retail Sentiment Reversal (`retail_sentiment_reversal`)**:
   - Contrarian positioning signals fading social, option, and margin sentiment extremes.
   - Benchmark: S&P 500 | CAGR: +22.1% | Sharpe: 1.35.
7. **Singapore STI High-Yield Flow Momentum (`singapore_dividend_value`)**:
   - Dividend yield flow timing into Singapore banking majors and defensive REITs.
   - Benchmark: Straits Times Index (STI) | CAGR: +16.8% | Sharpe: 1.82.
8. **Hang Seng Tech / Dual-Listing Arbitrage (`hangseng_tech_arbitrage`)**:
   - Hong Kong tech vs US ADR multiple valuation mean reversion.
   - Benchmark: Hang Seng Tech Index | CAGR: +27.5% | Sharpe: 1.42.

---

## 3-Factor Quantitative Screener Rules

1. **Price vs 50-Day Moving Average (50-DMA)**:
   - **Price > 50-DMA** (Positive delta > band): `SELL` (Overextended, indicates mean-reversion).
   - **Price < 50-DMA** (Negative delta < -band): `BUY` (Identifies dip-buying entry opportunity).
   - Within $\pm 0.8\%$ band: `NEUTRAL`.

2. **Volume vs Moving Average (5-Day Weekly Average)**:
   - **Volume > Moving Average** (Surge ratio $\ge 1.05\text{x}$): `BUY` (Strong institutional accumulation).
   - **Volume < Moving Average** (Ratio $\le 0.95\text{x}$): `SELL` (Drying liquidity, distribution).
   - Within band: `NEUTRAL`.

3. **Trailing P/E vs Industry / Sector Average**:
   - **Low P/E** ($>10\%$ below sector benchmark): `BUY` (Undervalued margin of safety).
   - **High P/E** ($>10\%$ above sector benchmark): `SELL` (Stretched multiple / valuation risk).
   - Within band: `NEUTRAL`.

---

## MCP Tools Catalog

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `list_strategies` | `market` (optional) | List all available systematic strategies with live performance metrics and signals. |
| `get_signals` | `strategy_id` (required), `symbol`, `api_key` | Retrieve latest timestamped buy/sell signals, target allocation, and stop-loss levels. |
| `get_strategy_performance` | `strategy_id` (required), `timeframe` | Detailed risk-adjusted metrics, Sharpe ratio, Sortino, max drawdown, and NAV curve. |
| `compare_strategies` | `strategy_ids` (optional) | Multi-strategy cross-correlation matrix and risk-return ranking comparison. |
| `get_index_data` | none | Benchmark indices overview: STI (Singapore), CSI 300 (China), HSI (Hong Kong), S&P 500, and Nasdaq 100. |
| `register_trial` | `agent_id`, `email` | Self-serve instant 30-day trial API key generation for autonomous agents. |
| `get_subscription_info` | none | Subscription tiers, quotas, and API access levels. |
| `check_subscription` | `api_key` | Real-time API key status and remaining daily requests quota. |
| `quanttogo_evaluate_screener` | `symbol` (required), `maNeutralBandPercent`, `volumeSurgeRatio`, `peTolerancePercent` | Full multi-factor signal synthesis using custom or default parameters. |
| `quanttogo_get_screener_stocks` | `market`, `includeEvaluation` | Complete 62-stock multi-market universe with QuantToGo symbols. |
| `quanttogo_get_quote` | `symbol` (required) | Real-time quote, 50-DMA benchmark, volume surge ratio, and 3-signal breakdown. |
| `quanttogo_get_50d_history` | `symbol` (required) | 50 daily closing prices and moving average bar series. |
| `quanttogo_search` | `query` (required) | Search equities across the universe by ticker, QuantToGo symbol, or company name. |
| `quanttogo_get_status` | none | Check MCP server connection status and universe coverage. |

---

## Quick Install

### Run via NPX

```bash
npx -y quanttogo-mcp
```

### Run Locally

```bash
npm run mcp
# or: npx tsx mcp/server.ts

npm run mcp:test
# or: npx tsx mcp/test-client.ts
```

### Claude Desktop Configuration (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "quanttogo": {
      "command": "npx",
      "args": [
        "-y",
        "quanttogo-mcp"
      ],
      "env": {
        "QUANTTOGO_API_KEY": "qtg_trial_agent_30d"
      }
    }
  }
}
```

---

## Directory Architecture

```
mcp/
├── server.ts                  # MCP Server executable over stdio JSON-RPC
├── quantToGoClient.ts         # QuantToGo data client & strategy access layer
├── stockUniverse.ts           # 62-stock universe with QuantToGo strategy mappings
├── signalEngine.ts            # Quantitative 3-factor screener & synthesis engine
├── test-client.ts             # End-to-end integration test suite
├── types.ts                   # TypeScript data contracts & MCP schemas
├── claude_desktop_config.json # Claude Desktop configuration snippet
└── README.md                  # Comprehensive server documentation
```
