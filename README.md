# Multi-Market Equity Quantitative Screener & Kanban Signal Board

A professional multi-market equity quantitative screener and signal filtering system covering 62 stocks across Singapore, China, Hong Kong, and the United States.

## Stock Universe (62 Stocks Across 4 Markets)
- **Singapore (30 Stocks)**: Full Straits Times Index (STI 30) constituents (DBS, OCBC, UOB, Singtel, CICT, CapitaLand Ascendas REIT, CLI, Wilmar, SIA, Keppel, ST Engineering, Seatrium, Sembcorp, etc.)
- **China (10 Stocks)**: Key CSI 300 constituents (Kweichow Moutai, Ping An, CATL, BYD, Midea, CM Bank, etc.)
- **Hong Kong (10 Stocks)**: Core Hang Seng Index constituents (Tencent, Alibaba, Meituan, AIA, HSBC, HKEX, etc.)
- **United States (12 Stocks)**: Major S&P 500 & Dow Jones market leaders (Apple, Microsoft, NVIDIA, Amazon, Alphabet, Meta, Berkshire Hathaway, JPMorgan, etc.)

## Signal Architecture & Quantitative Engine

Three independent quantitative signals synthesize into a high-conviction decision:

1. **Price vs 50-Day Moving Average**:
   - **Positive ($\text{Price} > \text{50-DMA}$)**: **SELL** (mean-reversion / overextended above moving average).
   - **Negative ($\text{Price} < \text{50-DMA}$)**: **BUY** (dip-buying opportunity below moving average).
   - **Neutral**: Hovering within sensitivity tolerance ($\pm 0.8\%$).

2. **Volume vs Moving Average (Weekly Average)**:
   - **Positive ($\text{Volume} > \text{Weekly Average}$)**: **BUY** (strong institutional conviction and liquidity).
   - **Negative ($\text{Volume} < \text{Weekly Average}$)**: **SELL** (declining volume / liquidity outflow).
   - **Neutral**: Flat volume.

3. **P/E vs Industry / Sector Average**:
   - **Low ($\text{P/E} < \text{Sector Average}$)**: **BUY** (undervaluation relative to industry peers).
   - **High ($\text{P/E} > \text{Sector Average}$)**: **SELL** (valuation premium relative to peers).
   - **Neutral**: Roughly in line ($\pm 5\%$).

4. **Final Synthesized Signal**:
   - **Strong Buy**: 3x Buy alignment (Price < MA, Volume > Avg, Low P/E).
   - **Buy**: 2x Buy dominant.
   - **Hold**: Neutral or mixed/conflicting signals.
   - **Sell**: 2x Sell dominant.
   - **Strong Sell**: 3x Sell alignment (Price > MA, Volume < Avg, High P/E).

## Key Features
- **Kanban Signal Board**: Columns categorized by synthesized conviction level with average performance metrics.
- **Screener Table**: High-density spreadsheet view with sorting, market badges, and triple signal indicators.
- **Sector Valuation Matrix**: Visualizes peer trailing P/E multiples and conviction distribution across sectors.
- **Stock Detail Modal & Interactive "What-If" Simulator**: Dynamic 50-day price history chart with 50-DMA benchmark and real-time scenario simulation.
- **Tiger Brokers Open API Integration (`developer.tigerbrokers.com.sg`)**: Official standard symbol formats, exchange codes, lot sizes, and MCP tool schemas.
- **Parameter Sensitivity Calibration**: Live adjustments for 50-DMA neutral band, volume surge ratio, and P/E sector tolerance.
- **CSV Export**: One-click download of all 62 evaluated stocks with quantitative metrics and Tiger OpenAPI metadata.

## Model Context Protocol (MCP) Server (`mcp/`)

A production-ready Model Context Protocol (MCP) server for Tiger Brokers Open API (`developer.tigerbrokers.com.sg`) is provided in the `/mcp` directory.

### Quick Start
```bash
# Start Tiger Brokers MCP server on stdio
npm run mcp
# or: npx tsx mcp/server.ts

# Run complete MCP test suite across all 62 stocks
npm run mcp:test
# or: npx tsx mcp/test-client.ts
```

### Supported MCP Tools
- `tiger_get_gateway_status`: Verify connection and latency to `https://openapi.tigerbrokers.com.sg/gateway`.
- `tiger_get_stock_quote`: Real-time quote, 50-DMA, volume, open/high/low/close for any stock (`D05.SG`, `AAPL.US`, `00700.HK`, `600519.SH`).
- `tiger_get_all_screener_stocks`: Fetch the full 62-stock multi-market catalog with evaluated signals.
- `tiger_filter_stocks`: Filter stocks by market, sector, or signal (`STRONG_BUY`, `BUY`, `HOLD`, `SELL`, `STRONG_SELL`).
- `tiger_get_kline_bars`: Candlestick bars with calculated 50-day moving average and delta %.
- `tiger_get_fundamental_pe`: Trailing P/E and sector peer valuation benchmarking.
- `tiger_evaluate_signals`: Multi-factor signal evaluation (Price vs MA, Volume vs MA, P/E vs Industry).
- `tiger_place_order`: Transmit trade orders with board lot size enforcement (SGX/HKEX 100-500 shares; US 1 share).
- `tiger_get_account_assets`: Buying power, equity, and cash balance.

See [`mcp/README.md`](./mcp/README.md) and [`mcp/claude_desktop_config.json`](./mcp/claude_desktop_config.json) for setup details.

## Tech Stack
- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- Lucide React
- @modelcontextprotocol/sdk

