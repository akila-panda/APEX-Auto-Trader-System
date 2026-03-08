<!-- Folder Structure.md -->
# Folder Structure: APEX 2

This document provides a comprehensive mapping of all files in the `src` directory, along with a description of their core functionality.

## Root Level
- `src/App.tsx`: The main application orchestrator. Manages the global analysis loop, timeframe switching, and main layout rendering.
- `src/main.tsx`: Entry point for the React application. Sets up the DOM root and providers.
- `src/index.css`: Global Tailwind CSS styles and custom animations (e.g., pulsing effects).

## API Layer (`/src/api`)
- `src/api/twelveData.ts`: Primary integration for the Twelve Data REST API. Handles candle and price fetching.
- `src/api/rateLimit.ts`: **Critical** sliding-window rate limiter (8 calls/min) to protect API quota.
- `src/api/webSocket.ts`: Manages the real-time WebSocket connection for live price streaming.
- `src/api/candleCache.ts`: Handles local caching and fallback candle generation when the API is unavailable.

## Configuration (`/src/config`)
- `src/config/api.config.ts`: API keys, base URLs, and rate limit constants.
- `src/config/trading.config.ts`: Strategy parameters like risk amount, SL pips, and TP ratios.
- `src/config/timeframes.config.ts`: Definitions for supported timeframes (M5, H1, D1, etc.).

## Core Engines (`/src/engines`)
The "brain" of the application, consisting of pure TypeScript logic.

### Market Structure
- `src/engines/market-structure/pivotDetection.ts`: Algorithms to identify Swing Highs and Swing Lows.
- `src/engines/market-structure/equilibriumCalculator.ts`: Calculates the 50% retracement level of a trading range.
- `src/engines/market-structure/structureClassifier.ts`: Determines if the market is Bullish, Bearish, or Ranging.

### Liquidity
- `src/engines/liquidity/sweepDetector.ts`: Detects liquidity raids (Stop Runs) on Swing Highs/Lows.
- `src/engines/liquidity/asianRangeCalculator.ts`: Identifies the High/Low of the Asian session for liquidity context.
- `src/engines/liquidity/liquidityLevelMapper.ts`: Maps raw price levels to institutional liquidity zones.

### Order Blocks & FVG
- `src/engines/order-blocks/obDetector.ts`: Identifies Bullish and Bearish Order Blocks (Supply/Demand).
- `src/engines/fair-value-gaps/fvgDetector.ts`: Detects price imbalances (Fair Value Gaps).
- `src/engines/fair-value-gaps/fvgMitigationChecker.ts`: Checks if a gap has been filled/mitigated by price.

### BOS & OTE
- `src/engines/bos-choch/chochDetector.ts`: Detects Change of Character (CHoCH) and Break of Structure (BOS).
- `src/engines/ote/fibonacciCalculator.ts`: Calculates the 62%, 70.5%, and 79% Fibonacci retracement levels.

### Confluence & Signal
- `src/engines/confluence/confluenceScorer.ts`: Central logic for weighting and summing technical factors.
- `src/engines/signal/signalGenerator.ts`: Final decision engine that produces Buy/Sell/Wait signals.
- `src/engines/signal/cooldownGuard.ts`: Prevents over-trading by enforcing a wait period between signals.

### Auto-Trader
- `src/engines/auto-trader/botCycleOrchestrator.ts`: Manages the automated scanning and execution cycle.
- `src/engines/auto-trader/tradeExecutor.ts`: Handles the simulation of trade entry and exit.
- `src/engines/auto-trader/dailyLimitGuard.ts`: Enforces daily trade limits to protect capital.

### Human Thinking (AI Narrative)
- `src/engines/human-thinking/narrativeBuilder.ts`: Converts technical data into a readable "thinking" narrative.
- `src/engines/human-thinking/lessonGenerator.ts`: Derives educational trading lessons from market setups.

## Components (`/src/components`)

### Views
- `src/components/views/ChartView.tsx`: The primary technical analysis terminal with the main chart.
- `src/components/views/AutoTraderView.tsx`: Dashboard for bot monitoring and engine configuration.
- `src/components/views/TradeTableView.tsx`: A sortable record of all executed simulated trades.
- `src/components/views/JournalView.tsx`: A deep-dive log of trade logic and AI-generated reasoning.

### Sidebar Left (Strategy)
- `src/components/sidebar-left/modules/StructureModule.tsx`: Displays HTF structure and P/D zones.
- `src/components/sidebar-left/modules/LiquidityModule.tsx`: Shows BSL/SSL targets and sweep status.
- `src/components/sidebar-left/modules/OrderBlockModule.tsx`: Displays active supply and demand zones.
- `src/components/sidebar-left/tabs/CalendarTab.tsx`: Lists high-impact economic news events.

### Sidebar Right (Analysis)
- `src/components/sidebar-right/PriceLevelsPanel.tsx`: High-density list of key institutional price levels.
- `src/components/sidebar-right/TradePlanPanel.tsx`: Displays entry, SL, and TP targets for active signals.
- `src/components/sidebar-right/SignalAnalysisPanel.tsx`: Shows the detailed AI reasoning for the current setup.

### Charting & Shared
- `src/components/chart/ChartCanvas.tsx`: The core Canvas-based rendering engine for price action.
- `src/components/shared/TFCard.tsx`: Compact summary card for timeframe health.
- `src/components/shared/Badge.tsx`: Standardized UI badges for status and types.

## State Management (`/src/store`)
- `src/store/useMarketStore.ts`: Manages candle data, current price, and technical analysis results.
- `src/store/useBotStore.ts`: Tracks bot status, scan cycles, and engine settings.
- `src/store/useTradeStore.ts`: Persists trade history and calculates performance KPIs.
- `src/store/useMacroStore.ts`: Manages global macro bias and market strength data.

## Hooks (`/src/hooks`)
- `src/hooks/useLivePrice.ts`: Manages WebSocket subscriptions for real-time price updates.
- `src/hooks/useCalendar.ts`: Fetches and filters high-impact news from the economic calendar.
- `src/hooks/useSessionInfo.ts`: Determines active trading sessions (London, NY, Asia) and Kill Zones.

## Utilities (`/src/utils`)
- `src/utils/priceFormat.ts`: Standardizes price rounding and PnL currency formatting.
- `src/utils/dateTime.ts`: Helpers for UTC conversion and trading session timing.
- `src/utils/localStorage.ts`: Handles browser persistence for trades and settings.

## Types (`/src/types`)
- `src/types/analysis.types.ts`: TypeScript interfaces for the complex AnalysisResult object.
- `src/types/trade.types.ts`: Definitions for Trade, RiskParams, and TradeStatus.
- `src/types/candle.types.ts`: Interface for OHLCV candle data.
