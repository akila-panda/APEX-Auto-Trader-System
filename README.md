# APEX EUR/USD v3 Ultimate

> Institutional SMC Auto-Trader — React + TypeScript + Vite

A modular, production-grade Smart Money Concept (SMC) trading dashboard for EUR/USD, converted from a monolithic HTML file into a fully typed React codebase. All **25 audit fixes** from the v2 review are implemented.

---

## Quick Start

```bash
# 1. Install dependencies
cd apex-eurusd
npm install

# 2. Add your Twelve Data API key
echo "VITE_TWELVE_DATA_API_KEY=your_key_here" > .env

# 3. Start development server
npm run dev

# 4. Run tests
npm test

# 5. Build for production
npm run build
```

---

## Architecture

```
src/
├── config/          # API, trading constants, timeframes
├── types/           # TypeScript interfaces (candle, analysis, trade, macro)
├── store/           # Zustand stores (market, macro, bot, trade)
├── api/             # Twelve Data REST + WebSocket, rate limiter, cache
├── engines/
│   ├── market-structure/   # FIX B-1: 3-bar pivot detection
│   ├── order-blocks/       # OB detection + validation
│   ├── fair-value-gaps/    # FIX B-5: newest-first FVG scan
│   ├── liquidity/          # FIX C-2: 6-candle sweep detection
│   ├── bos-choch/          # FIX B-2: impulse leg walk-back
│   ├── ote/                # FIX B-2: impulse-anchored Fibonacci
│   ├── confluence/         # FIX C-1/C-3/C-4: split HTF, OTE guard, strength tiers
│   ├── signal/             # FIX A-3/A-4/A-5: post-filter counter, TF weighting, cooldown
│   ├── risk/               # Lot size, SL, TP calculators
│   ├── auto-trader/        # FIX A-1: cycleRunning guard, bot orchestrator
│   └── human-thinking/     # Pattern recognition, narrative, lesson generator
├── hooks/           # useLivePrice, useCandleData, useMultiTFAnalysis, etc.
├── utils/           # priceFormat, dateTime, pipCalculator, localStorage
└── components/
    ├── layout/      # TopBar, StatusBar
    ├── chart/       # ChartCanvas (canvas-based candlestick renderer)
    ├── shared/      # Badge, Module, FeedItem, TFCard, SignalCard
    ├── sidebar-left/
    │   ├── tabs/    # Strategy, Feed, Checklist, Macro, Calendar
    │   └── modules/ # Structure, Liquidity, OrderBlock, FVG, Signal
    ├── sidebar-right/  # PriceLevels, TradePlan, Confluence, SignalAnalysis
    └── views/       # ChartView, AutoTraderView, TradeTableView, JournalView
```

---

## All 25 Audit Fixes

| Fix | Description |
|-----|-------------|
| **A-1** | `cycleRunning` ref guard prevents concurrent bot cycles |
| **A-2** | `macroInputs` all default to `0`, 100% user-driven via +1/0/-1 buttons |
| **A-3** | `totalSignals` increments ONLY in `evaluateSignals()` after ALL filters pass |
| **A-4** | Sort formula: `effectiveScore + (inKZ ? 0.5 : 0) + TF_WEIGHT * 0.1` |
| **A-5** | Cooldown guard reads `lastTradeTime + lastTradeDirection`, blocks same-direction |
| **B-1** | `high[i] > high[i-1] && high[i] > high[i+1]` 3-bar pivot detection |
| **B-2** | Walk back from displacement candle to find full impulse leg origin for OTE anchor |
| **B-3** | Y-axis labels use `.toFixed(5)` — 5 decimal place forex precision |
| **B-4** | Right-edge filled badge with exact price for every level line |
| **B-5** | FVG loop scans newest-first — returns most recent gap, not oldest |
| **C-1** | `cf_htf` split into `cf_structure + cf_poi` (20-pip proximity check) |
| **C-2** | Sweep scans ALL 6 candles newest-first + persists validity via `sweepWindowExpiry` |
| **C-3** | `oteConfluence` only checks `ote.inOTE` — no direction guard |
| **C-4** | `macroBonus = strength === 'STRONG' ? 0.5 : 0`, `effectiveScore = coreScore + macroBonus` |

---

## API & Rate Limits

- **Provider**: [Twelve Data](https://twelvedata.com) (free tier)
- **Limits**: 8 calls/min, 800 calls/day
- **WebSocket**: Real-time EUR/USD tick streaming with REST poll fallback
- **Cache TTL**: 4 minutes per timeframe

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool |
| Zustand | 4 | State management |
| Tailwind CSS | 3 | Styling |
| Recharts | 2 | Charts (supplemental) |
| date-fns | 3 | Date utilities |
| Vitest | 1 | Unit tests |

---

## Disclaimer

**SIMULATED OUTCOMES ONLY.** All trade results (Win/Loss) are probability-weighted simulations — not real executions. This tool is for educational and signal quality analysis purposes only. Not financial advice.
