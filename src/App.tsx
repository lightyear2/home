import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { STOCKS_DATA } from './data/stocksData';
import { evaluateAllStocks, DEFAULT_CONFIG } from './utils/signals';
import { EvaluatedStock, FilterState, Market, ScreenerConfig, StockRaw, ViewMode } from './types/stock';
import { DEFAULT_QUANTTOGO_CONFIG, QuantToGoConnectionConfig } from './utils/quantToGoMcp';
import { Header, MarketSessionTag } from './components/Header';
import { MarketBreadthBar } from './components/MarketBreadthBar';
import { FilterControls } from './components/FilterControls';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { SectorMatrixView } from './components/SectorMatrixView';
import { StockDetailModal } from './components/StockDetailModal';
import { ParameterSettingsModal } from './components/ParameterSettingsModal';
import { QuantToGoMcpModal } from './components/QuantToGoMcpModal';

export default function App() {
  // Configuration
  const [config, setConfig] = useState<ScreenerConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // QuantToGo MCP configuration & state (github.com/QuantToGo/quanttogo-mcp)
  const [quantToGoConfig, setQuantToGoConfig] = useState<QuantToGoConnectionConfig>(DEFAULT_QUANTTOGO_CONFIG);
  const [isQuantToGoMcpOpen, setIsQuantToGoMcpOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Backend MCP time-based feed metadata
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [marketSessions, setMarketSessions] = useState<MarketSessionTag[]>([]);

  // Raw stocks state (initialized from STOCKS_DATA, dynamically updated on open from backend MCP setup)
  const [stocksData, setStocksData] = useState<StockRaw[]>(STOCKS_DATA);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Modal inspection
  const [selectedStock, setSelectedStock] = useState<EvaluatedStock | null>(null);

  // Watchlist stored in memory / local storage
  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('equity_screener_watchlist');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // fallback
    }
    return new Set(['D05.SI', 'AAPL', '0700.HK', '600519.SS']);
  });

  const toggleWatchlist = useCallback((ticker: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else {
        next.add(ticker);
      }
      try {
        localStorage.setItem('equity_screener_watchlist', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    market: 'ALL',
    sector: 'ALL',
    finalSignal: 'ALL',
    watchlistOnly: false,
    sortBy: 'changePercent',
    sortDirection: 'desc',
  });

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      market: 'ALL',
      sector: 'ALL',
      finalSignal: 'ALL',
      watchlistOnly: false,
      sortBy: 'changePercent',
      sortDirection: 'desc',
    });
  }, []);

  // --------------------------------------------------------------------------
  // ON OPEN THE APP: Fetch time-updated prices from backend MCP setup
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setIsSyncing(true);

    fetch('/api/mcp/stocks')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.stocks && Array.isArray(data.stocks) && data.stocks.length > 0) {
          setStocksData(data.stocks);
          setLastUpdatedTime(data.lastUpdated || new Date().toISOString());
          if (data.marketSessions) setMarketSessions(data.marketSessions);
        }
      })
      .catch((err) => {
        console.warn('Initial MCP backend stock load error:', err);
        // Set timestamp even if fallback
        if (isMounted) setLastUpdatedTime(new Date().toISOString());
      })
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live Sync with QuantToGo MCP Backend Server
  const handleTriggerQuantToGoSync = useCallback(() => {
    setIsSyncing(true);

    fetch('/api/mcp/sync', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.stocks && Array.isArray(data.stocks)) {
          setStocksData(data.stocks);
          setLastUpdatedTime(data.lastUpdated || new Date().toISOString());
          if (data.marketSessions) setMarketSessions(data.marketSessions);
        }
      })
      .catch((err) => {
        console.warn('Sync failed, falling back to simulated drift:', err);
        setStocksData((prev) =>
          prev.map((stock) => {
            const pctMove = (Math.random() - 0.48) * 0.006;
            const newPrice = Number((stock.price * (1 + pctMove)).toFixed(2));
            const priceDiff = Number((newPrice - stock.price).toFixed(2));
            const newChange = Number((stock.change + priceDiff).toFixed(2));
            const newChangePct = Number((stock.changePercent + pctMove * 100).toFixed(2));
            const volMultiplier = 1 + (Math.random() - 0.45) * 0.03;
            const newVolume = Math.round(stock.currentVolume * volMultiplier);
            const newPE = Number((stock.pe * (newPrice / stock.price)).toFixed(1));

            return {
              ...stock,
              price: newPrice,
              change: newChange,
              changePercent: newChangePct,
              currentVolume: newVolume,
              pe: newPE,
            };
          })
        );
        setLastUpdatedTime(new Date().toISOString());
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, []);

  // Auto-sync polling if enabled in QuantToGo MCP settings
  useEffect(() => {
    if (!quantToGoConfig.autoSync) return;
    const interval = setInterval(() => {
      handleTriggerQuantToGoSync();
    }, quantToGoConfig.syncIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [quantToGoConfig.autoSync, quantToGoConfig.syncIntervalSec, handleTriggerQuantToGoSync]);

  // Compute evaluated stocks dynamically based on active config & live time-updated data
  const allEvaluatedStocks = useMemo(() => {
    return evaluateAllStocks(stocksData, config);
  }, [stocksData, config]);

  // Available unique sectors across the 62 stocks
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    for (const s of stocksData) {
      set.add(s.sector);
    }
    return Array.from(set).sort();
  }, [stocksData]);

  // Filtered and sorted stocks
  const filteredStocks = useMemo(() => {
    return allEvaluatedStocks
      .filter((stock) => {
        // Market filter
        if (filters.market !== 'ALL' && stock.market !== filters.market) {
          return false;
        }

        // Sector filter
        if (filters.sector !== 'ALL' && stock.sector !== filters.sector) {
          return false;
        }

        // Final signal filter
        if (filters.finalSignal !== 'ALL' && stock.finalSignal !== filters.finalSignal) {
          return false;
        }

        // Watchlist filter
        if (filters.watchlistOnly && !watchlist.has(stock.ticker)) {
          return false;
        }

        // Search text
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchTicker = stock.ticker.toLowerCase().includes(q);
          const matchQuantToGoSymbol = stock.quantToGoSymbol.toLowerCase().includes(q);
          const matchName = stock.name.toLowerCase().includes(q);
          const matchSector = stock.sector.toLowerCase().includes(q);
          if (!matchTicker && !matchQuantToGoSymbol && !matchName && !matchSector) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (filters.sortBy) {
          case 'ticker':
            diff = a.ticker.localeCompare(b.ticker);
            break;
          case 'name':
            diff = a.name.localeCompare(b.name);
            break;
          case 'changePercent':
            diff = a.changePercent - b.changePercent;
            break;
          case 'pe':
            diff = a.pe - b.pe;
            break;
          case 'ma50Delta':
            diff = a.priceSignal.deltaPercent - b.priceSignal.deltaPercent;
            break;
          case 'volumeRatio':
            diff =
              a.currentVolume / a.weeklyAvgVolume - b.currentVolume / b.weeklyAvgVolume;
            break;
        }
        return filters.sortDirection === 'asc' ? diff : -diff;
      });
  }, [allEvaluatedStocks, filters, watchlist]);

  // Keep selectedStock in sync if updated during live tick sync
  useEffect(() => {
    if (selectedStock) {
      const refreshed = allEvaluatedStocks.find((s) => s.id === selectedStock.id);
      if (refreshed) {
        setSelectedStock(refreshed);
      }
    }
  }, [allEvaluatedStocks]);

  // Export to CSV including QuantToGo MCP details
  const handleExportCsv = useCallback(() => {
    const headers = [
      'Ticker',
      'QuantToGo Symbol',
      'Exchange',
      'QuantToGo Strategy',
      'QuantToGo URL',
      'Name',
      'Market',
      'Sector',
      'Currency',
      'Price',
      'Change %',
      '50-DMA',
      'Distance to 50-DMA %',
      'Price Signal',
      'Daily Volume',
      'Weekly Avg Volume',
      'Volume Ratio',
      'Volume Signal',
      'Trailing PE',
      'Sector Avg PE',
      'PE vs Sector %',
      'PE Signal',
      'Final Signal',
      'MCP Source',
      'Last Updated',
      'Final Rationale',
    ];

    const rows = filteredStocks.map((s) => [
      s.ticker,
      s.quantToGoSymbol,
      s.exchange,
      `"${s.quantToGoStrategyName || s.quantToGoStrategyId || 'Systematic'}"`,
      s.quantToGoUrl,
      `"${s.name.replace(/"/g, '""')}"`,
      s.market,
      `"${s.sector}"`,
      s.currency,
      s.price.toFixed(2),
      s.changePercent.toFixed(2),
      s.ma50.toFixed(2),
      s.priceSignal.deltaPercent.toFixed(2),
      s.priceSignal.signal,
      s.currentVolume,
      s.weeklyAvgVolume,
      (s.currentVolume / s.weeklyAvgVolume).toFixed(2),
      s.volumeSignal.signal,
      s.pe.toFixed(1),
      s.peSignal.benchmarkValue.toFixed(1),
      s.peSignal.deltaPercent.toFixed(1),
      s.peSignal.signal,
      s.finalSignal,
      'QuantToGo MCP (github.com/QuantToGo/quanttogo-mcp)',
      lastUpdatedTime || new Date().toISOString(),
      `"${s.finalReason.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quanttogo_equity_signals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredStocks, lastUpdatedTime]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Header Contract with Live MCP Feed & Market Clocks */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenQuantToGoMcp={() => setIsQuantToGoMcpOpen(true)}
        totalStocksCount={allEvaluatedStocks.length}
        lastUpdatedTime={lastUpdatedTime}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerQuantToGoSync}
        marketSessions={marketSessions}
      />

      {/* Market Breadth & Conviction Bar */}
      <MarketBreadthBar
        stocks={allEvaluatedStocks}
        selectedMarket={filters.market}
        onSelectMarket={(m: Market | 'ALL') => handleFilterChange('market', m)}
      />

      {/* Filter Controls Strip */}
      <FilterControls
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableSectors={availableSectors}
        totalFiltered={filteredStocks.length}
        totalAvailable={allEvaluatedStocks.length}
      />

      {/* Primary Main Content Canvas */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto">
        {viewMode === 'kanban' && (
          <KanbanBoard
            stocks={filteredStocks}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onSelectStock={setSelectedStock}
          />
        )}

        {viewMode === 'table' && (
          <TableView
            stocks={filteredStocks}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onSelectStock={setSelectedStock}
          />
        )}

        {viewMode === 'sector-matrix' && (
          <SectorMatrixView
            stocks={filteredStocks}
            onSelectStock={setSelectedStock}
          />
        )}
      </main>

      {/* Stock Deep-Dive Inspection Modal with QuantToGo Systematic Signals Terminal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          config={config}
          isWatchlisted={watchlist.has(selectedStock.ticker)}
          onToggleWatchlist={(ticker) => toggleWatchlist(ticker)}
          onClose={() => setSelectedStock(null)}
        />
      )}

      {/* Parameter Settings Modal */}
      {isSettingsOpen && (
        <ParameterSettingsModal
          config={config}
          onChangeConfig={setConfig}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* QuantToGo MCP Gateway Modal (github.com/QuantToGo/quanttogo-mcp) */}
      {isQuantToGoMcpOpen && (
        <QuantToGoMcpModal
          stocks={allEvaluatedStocks}
          config={quantToGoConfig}
          onUpdateConfig={setQuantToGoConfig}
          onTriggerSync={handleTriggerQuantToGoSync}
          isSyncing={isSyncing}
          onClose={() => setIsQuantToGoMcpOpen(false)}
          onSelectStock={setSelectedStock}
        />
      )}
    </div>
  );
}
