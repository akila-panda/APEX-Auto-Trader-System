<!-- README.md -->
# APEX EUR/USD v3 Ultimate

> Institutional SMC Auto-Trader — React + TypeScript + Vite + MT5 Bridge

A modular, production-grade Smart Money Concept (SMC) trading dashboard for EUR/USD. APEX2 is designed to scan multiple timeframes, identify high-confluence institutional setups, and execute them automatically via a MetaTrader 5 (MT5) bridge.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Twelve Data API key to .env
VITE_TD_API_KEY=your_key_here

# 3. Start the Signal Server (MT5 Bridge)
node signalServer.cjs

# 4. Start the Frontend
npm run dev
```

---

## 🏗️ System Architecture

### 1. Analysis Engines (`src/engines/`)
- **Market Structure**: 3-bar pivot detection for Swing Highs/Lows and Premium/Discount zones.
- **Order Blocks**: Detection of institutional supply and demand zones with mitigation checks.
- **Fair Value Gaps**: Newest-first scanning for price imbalances (FVGs).
- **Liquidity**: Sweep detection on swing points and Asian Range session levels.
- **BOS/CHoCH**: Structural break detection with impulse leg walk-back logic.
- **OTE**: Fibonacci-anchored Optimal Trade Entry zone calculation (62% - 79%).
- **Confluence**: Multi-factor scoring engine (Macro + Structure + POI + Liquidity + News).

### 2. Auto-Trader & Execution (`src/engines/auto-trader/`)
- **Bot Orchestrator**: Manages the multi-TF scanning cycle and execution gating.
- **Eligibility Gate**: Trades only trigger if:
    - Signal confidence > `minScore`.
    - Market structure aligns with signal direction (or BOS confirmation).
    - No conflicting open position exists for the same pair.
- **Trade Executor**: Formats and transmits signals to the execution bridge.
- **Daily Limit Guard**: Enforces UTC-based daily trade limits to protect capital.

### 3. Execution Bridges
- **Node.js Bridge (`signalServer.cjs`)**: Writes signals to the MT5 "Common/Files" directory for EA reading.
- **Python Bridge (`mt5_bridge.py`)**: Direct MT5 API integration using Flask and the `MetaTrader5` library.

---

## 🛡️ Safety & Risk Management

| Feature | Logic |
|---------|-------|
| **Confidence Threshold** | Minimum confluence score (default 4.0/5.0) required. |
| **Structure Guard** | Prevents buying in bearish structure or selling in bullish structure. |
| **Conflict Check** | Blocks new trades if an opposite-direction trade is already open. |
| **Cooldown** | 30-minute wait period between same-direction trades. |
| **Daily Limit** | Hard stop after X trades per day (default 3). |
| **Slippage** | 10-point (1 pip) protection in the MT5 bridge. |
| **Lot Limits** | Minimum 0.01 / Maximum 1.0 lots enforced at the bridge level. |

---

## 📊 Technical Stack

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3.
- **State**: Zustand 4 (Market, Macro, Bot, Trade stores).
- **API**: Twelve Data (8 calls/min, 800/day free tier) with rate limiting and cache.
- **Real-time**: WebSocket tick streaming for real-time price updates.
- **Testing**: Vitest for unit and deep integration tests.

---

## 📂 Configuration

- **`api.config.ts`**: API keys, base URLs, rate limits, and **Symbol Mapping** (e.g., `EURUSD` vs `EURUSD.pro`).
- **`trading.config.ts`**: Risk percentage, pip values, stop loss/take profit ratios, and confluence weights.
- **`timeframes.config.ts`**: Timeframe definitions from Daily down to 5-minute.

---

## 🧪 Testing

APEX2 includes a comprehensive test suite, including a **Deep Integration Test** that simulates the entire bot cycle from signal detection to execution gating.

```bash
# Run all tests
npm test

# Run the Auto Trader deep test specifically
npm run test tests/engines/autoTraderDeep.test.ts
```

---

## ⚠️ Disclaimer

**ALGORITHMIC TRADING CARRIES SIGNIFICANT RISK.** While APEX2 includes numerous safety guards, market conditions can change rapidly. Always test new strategies and configurations on a **Demo Account** before going live. The authors are not responsible for financial losses.
