<!-- DOcument APEX.md -->
# DOCUMENT APEX: System Architecture & Technical Manual

Welcome to the **APEX 2** technical documentation. This document serves as a comprehensive guide for developers onboarding to the project, explaining the system's design, logic, and operational flow.

---

## 1. PROJECT OVERVIEW
**APEX 2** is a professional-grade automated trading and market analysis platform designed specifically for the **ICT (Inner Circle Trader)** methodology.

- **Main Goal**: To automate the identification of high-probability trading setups based on Market Structure, Liquidity Sweeps, and Fair Value Gaps, while providing a "Human-Like" narrative reasoning for every decision.
- **Core Workflow**:
    1. **Data Ingestion**: Fetch live OHLCV data across multiple timeframes (M5 to D1).
    2. **Algorithmic Analysis**: Detect pivots, BOS/CHoCH, Order Blocks, and FVGs.
    3. **Confluence Scoring**: Rank setups based on institutional trading rules.
    4. **Signal Generation**: Produce actionable Buy/Sell signals with precise entry and risk parameters.
    5. **Auto-Trading**: Execute simulated trades and maintain a detailed journal for performance review.

---

## 2. SYSTEM ARCHITECTURE
- **Frontend**: Built with **React 18** and **TypeScript**. Styled using **Tailwind CSS** for a high-density, low-latency "Terminal" UI.
- **State Management**: **Zustand** is used for global stores (Market, Bot, Macro, Trade), ensuring reactive UI updates without complex boilerplate.
- **APIs & Data**:
    - **Twelve Data API**: Primary source for live and historical market data (Forex).
    - **WebSocket**: Real-time price streaming for M1/Current Price updates.
    - **Economic Calendar**: Custom integration for tracking high-impact news events.
- **Backend**: This is a **client-side heavy application**. Most "backend" logic (engines) runs directly in the browser/client environment for immediate responsiveness.

---

## 3. FOLDER STRUCTURE

### `/src`
The root of the application logic. Contains the entry points and all sub-systems.

### `/components`
- **Purpose**: React UI components.
- **Subfolders**:
    - `/layout`: App shell, TopBar, StatusBar.
    - `/views`: Main page views (Chart, Auto-Trader, Trade Table, Journal).
    - `/sidebar-left/right`: Contextual analysis panels and strategy modules.
    - `/shared`: Reusable UI elements like Badges, Modules, and Cards.

### `/engines`
- **Purpose**: The "Brain" of APEX. Pure TypeScript logic.
- **Content**: Specialized sub-engines for Pivot Detection, FVG, Order Blocks, Risk Management, and "Human Thinking" (AI narrative).
- **Interaction**: Components call these engines to transform raw candle data into technical insights.

### `/store`
- **Purpose**: Global state containers using Zustand.
- **Interaction**: Acts as the central hub connecting API data to UI components.

### `/hooks`
- **Purpose**: Custom React hooks for side effects.
- **Content**: `useLivePrice`, `useCalendar`, `useSessionInfo`.

### `/api`
- **Purpose**: External communication layer.
- **Content**: Twelve Data integration, Rate Limiting logic, and WebSocket management.

### `/utils`
- **Purpose**: Helper functions.
- **Content**: Price formatting, Date/Time math, and LocalStorage persistence.

### `/config`
- **Purpose**: System constants.
- **Content**: Trading rules, Timeframe definitions, and API keys.

---

## 4. CORE MODULES

### **Trading Engine** (`/engines/auto-trader`)
Orchestrates the lifecycle of a bot cycle. It checks daily limits, evaluates signals across all timeframes, and hands off valid setups to the executor.

### **Strategy Logic** (`/engines/market-structure` & `/liquidity`)
The core technical analysis layer. It identifies "Swing Highs/Lows" using pivot algorithms and detects when liquidity has been "swept" (price wicks above a high but closes below).

### **Signal Generation** (`/engines/signal`)
The decision-maker. It takes the output of all confluences and decides if a setup meets the minimum "Confidence Score" (e.g., 4.0/5.0) required to trigger a trade.

### **Risk Management** (`/engines/risk`)
Calculates dynamic lot sizes based on a fixed dollar risk (e.g., $100) and the distance between Entry and Stop Loss. It also sets three-stage Take Profit targets.

---

## 5. DATA FLOW

1. **Market Data API**: `fetchCandles` retrieves OHLCV data.
2. **Data Processing**: `pivotDetection` identifies structural points in the raw data.
3. **Strategy Logic**: `detectBOS` and `fvgDetector` map technical patterns.
4. **Signal Generation**: `evaluateConfluence` sums up factors (Macro + Structure + POI).
5. **Risk Filter**: `calculateRisk` ensures the setup has a valid R:R ratio.
6. **Trade Execution**: `executeTrade` creates a trade record in the `TradeStore`.
7. **UI Updates**: Zustand triggers re-renders in the `StatusBar`, `AutoTraderView`, and `Chart`.

---

## 6. IMPORTANT FILES

- **`App.tsx`**: The main orchestrator. Contains the primary `analyzeFromCache` loop.
- **`useMarketStore.ts`**: The single source of truth for all timeframe data and analysis results.
- **`twelveData.ts`**: Handles all outgoing API requests with built-in rate-limit protection.
- **`confluenceScorer.ts`**: The weighting algorithm that determines setup quality.
- **`rateLimit.ts`**: A critical sliding-window limiter protecting the API quota.

---

## 7. KEY FUNCTIONS & ALGORITHMS

### **`detectSweep`** (Liquidity Engine)
Scans the last 6 candles to see if price has breached a Swing High/Low but failed to sustain it. This is the "Engine of Alpha" for the ICT strategy.

### **`evaluateConfluence`** (Confluence Engine)
Assigns weights to technical factors:
- Macro Bias Alignment: +1.0
- POI (Order Block) Touch: +1.0
- MSS/BOS Confirmation: +1.5
- Kill Zone Activity: +0.5

### **`buildHumanThinking`** (Human Thinking Engine)
A template-based reasoning engine that converts raw numbers into a readable narrative, explaining *why* the bot is taking a trade.

---

## 8. SIMPLIFIED SYSTEM DIAGRAM

```text
[Twelve Data API] <───> [Rate Limiter] <───> [Market Store]
                                                 │
                                                 ▼
[UI Components] <───> [Analysis Engine] <───> [Strategy Modules]
      │                      │                       │
      │                      ▼                       │
      └───────────────> [Signal Engine] <────────────┘
                             │
                             ▼
                      [Risk Manager]
                             │
                             ▼
                      [Trade Executor] ───> [Trade Journal]
```

---

## 9. HOW TO MODIFY THE SYSTEM

### **Add a New Trading Strategy**
1. Create a new folder in `/src/engines/your-strategy`.
2. Implement a detector function that returns a boolean or score.
3. Integrate it into `evaluateConfluence.ts` by adding a new `cf_yourstrategy` property.

### **Add a New Indicator**
1. Add the calculation logic in `/src/utils/indicators.ts`.
2. Update the `AnalysisResult` interface in `analysis.types.ts` to include the new data.
3. Add a new Module in `sidebar-left/modules` to display it.

### **Connect a Different API**
1. Create a new file in `/src/api/newProvider.ts`.
2. Implement the same interface as `fetchCandles` and `fetchPrice`.
3. Swap the import in `App.tsx` or `useMarketStore.ts`.

---

**APEX 2** is designed for modularity. Every engine is a "pure" function, making it easy to test and replace without breaking the rest of the system.
