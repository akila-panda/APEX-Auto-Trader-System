# About APEX2: Institutional SMC Auto-Trader

# About APEX2: Institutional SMC Auto-Trader

## 🧩 System Architecture: The Trading Pipeline

APEX2 is built on a high-conviction **Trading Pipeline** ([tradingPipeline.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/tradingPipeline.ts)) that orchestrates multiple specialized engines. Every trade signal must pass through a multi-stage validation gate before reaching the execution bridge.

### 1. The Execution Lifecycle (Order of Operations)
When a timeframe is analyzed, the pipeline runs in this exact sequence:
1.  **Session Filter**: Rejects trades in the "Dead Zone" or on weekends.
2.  **Macro Bias Alignment**: Ensures the setup matches the HTF directional bias.
3.  **SMT Divergence**: Checks correlated pairs for intermarket confirmation.
4.  **Strategy Engine (Gatekeeper)**: Confirms the market structure matches a valid ICT setup.
5.  **Signal Filters**: Validates Spread, Volatility (ATR), and Risk/Reward (min 1.5R).
6.  **Weighted Confluence**: Calculates a weighted conviction score (min 8.0).
7.  **Execution**: Signals are ranked across timeframes and sent to MT5.

---

## 🏗️ Core Analysis Engines

### 1. Market Structure Engine ([market-structure](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/market-structure/index.ts))
- **Pivot Detection**: Strict 3-bar fractal logic identifies Swing Highs/Lows.
- **Classification**: Determines if the trend is Bullish, Bearish, or Ranging.
- **Equilibrium Mapping**: Calculates 50% retracement to define **Premium** and **Discount** zones.

### 2. Liquidity & Sweep Engine ([liquidity](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/liquidity/index.ts))
- **Sweep Detector**: Scans newest candles for "Stop Runs" (breach and failure) at swing points.
- **Asian Range**: Maps the 20:00–00:00 UTC range as a primary liquidity magnet for the London/NY sessions.

### 3. Order Block (OB) & FVG Engines
- **OB Detector**: Identifies institutional supply/demand zones ([order-blocks](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/order-blocks/index.ts)).
- **FVG Detector**: Scans newest candles first for price imbalances ([fair-value-gaps](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/fair-value-gaps/index.ts)).

### 4. Structural Break Engine ([bos-choch](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/bos-choch/index.ts))
- **BOS/CHoCH**: Detects Breaks of Structure (continuation) and Changes of Character (reversal).
- **Impulse Tracer**: Identifies the exact origin of a move for precise Fibonacci anchoring.

---

## 🚀 Advanced Institutional Engines

### 1. Strategy Engine ([ictStrategyEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/strategy/ictStrategyEngine.ts))
The "Gatekeeper" that ensures price action matches a recognized institutional setup:
- **SMC_REVERSAL**: Sweep → BOS → POI (OB/FVG) → OTE.
- **BOS_PULLBACK**: Continuation entry after a structural break.
- **CHOCH_ENTRY**: Early reversal entry at the first sign of structural shift.
- **SILVER_BULLET**: Time-based entries during ICT's high-probability windows.

### 2. Macro Bias Engine ([macroBiasEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/macro/macroBiasEngine.ts))
- **Auto-Bias**: Automatically derives bias from **Daily + 4H** structure alignment.
- **Alignment Rules**: Daily bullish + 4H bullish = Strong Bullish. Daily bullish + 4H bearish = Neutral (Stay Out).

### 3. SMT Divergence Engine ([smtDivergenceEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/smt/smtDivergenceEngine.ts))
- **Intermarket Analysis**: Compares EUR/USD with GBP/USD (or correlated pairs).
- **Alpha Cue**: Divergence at swing highs/lows signals institutional distribution/accumulation.

### 4. Session Engine ([sessionEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/session/sessionEngine.ts))
- **Phase Detection**: Identifies London Open/Main, NY Open/Main, and the Silver Bullet windows.
- **Dead Zone**: Automatically blocks trading between 17:00–20:00 UTC.

---

## ⚡ Confluence & Signal Filters

### Weighted Confluence Scorer ([weightedConfluenceScorer.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/confluence/weightedConfluenceScorer.ts))
Replaces flat scoring with institutional weighting:
- **Tier 1 (3 pts)**: MSS (BOS/ChoCH), Liquidity Sweep.
- **Tier 2 (2 pts)**: POI (OB/FVG), HTF Structure, OTE Zone.
- **Bonuses**: SMT Divergence (+2), Silver Bullet (+1), Macro Strength (+0.5).

**Quality Labels**:
- **12.0+**: 🏆 Institutional Grade
- **10.0+**: ⭐⭐ High Conviction
- **8.0+**: ⭐ Standard Quality

### Pre-Signal Filters ([signalFilters.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/filters/signalFilters.ts))
- **Spread Filter**: Rejects trades if spread > limit (e.g., 1.5 pips for EURUSD).
- **Volatility (ATR)**: Ensures market is neither "dead" nor "chaotic".
- **RR Validation**: Strictly enforces a minimum 1.5R Risk/Reward ratio.

---

## 🤖 The Robot Tab & Execution
- **Multi-TF Ranking**: Signals from 1day down to 5min are weighted. Daily signals carry higher weight on tie-breaks.
- **Bot Cycle Orchestrator**: The final gate that checks Daily Trade Limits and Cooldowns before calling [tradeExecutor.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/auto-trader/tradeExecutor.ts).
- **Execution**: Signals are sent to the [signalServer](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/signalServer.cjs) bridge for MT5 order placement.


## 🧩 System Architecture: The Trading Pipeline

APEX2 is built on a high-conviction **Trading Pipeline** ([tradingPipeline.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/tradingPipeline.ts)) that orchestrates multiple specialized engines. Every trade signal must pass through a multi-stage validation gate before reaching the execution bridge.

### 1. The Execution Lifecycle (Order of Operations)
When a timeframe is analyzed, the pipeline runs in this exact sequence:
1.  **Session Filter**: Rejects trades in the "Dead Zone" or on weekends.
2.  **Macro Bias Alignment**: Ensures the setup matches the HTF directional bias.
3.  **SMT Divergence**: Checks correlated pairs for intermarket confirmation.
4.  **Strategy Engine (Gatekeeper)**: Confirms the market structure matches a valid ICT setup.
5.  **Signal Filters**: Validates Spread, Volatility (ATR), and Risk/Reward (min 1.5R).
6.  **Weighted Confluence**: Calculates a weighted conviction score (min 8.0).
7.  **Execution**: Signals are ranked across timeframes and sent to MT5.

---

## 🏗️ Core Analysis Engines

### 1. Market Structure Engine ([market-structure](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/market-structure/index.ts))
- **Pivot Detection**: Strict 3-bar fractal logic identifies Swing Highs/Lows.
- **Classification**: Determines if the trend is Bullish, Bearish, or Ranging.
- **Equilibrium Mapping**: Calculates 50% retracement to define **Premium** and **Discount** zones.

### 2. Liquidity & Sweep Engine ([liquidity](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/liquidity/index.ts))
- **Sweep Detector**: Scans newest candles for "Stop Runs" (breach and failure) at swing points.
- **Asian Range**: Maps the 20:00–00:00 UTC range as a primary liquidity magnet for the London/NY sessions.

### 3. Order Block (OB) & FVG Engines
- **OB Detector**: Identifies institutional supply/demand zones ([order-blocks](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/order-blocks/index.ts)).
- **FVG Detector**: Scans newest candles first for price imbalances ([fair-value-gaps](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/fair-value-gaps/index.ts)).

### 4. Structural Break Engine ([bos-choch](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/bos-choch/index.ts))
- **BOS/CHoCH**: Detects Breaks of Structure (continuation) and Changes of Character (reversal).
- **Impulse Tracer**: Identifies the exact origin of a move for precise Fibonacci anchoring.

---

## 🚀 Advanced Institutional Engines

### 1. Strategy Engine ([ictStrategyEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/strategy/ictStrategyEngine.ts))
The "Gatekeeper" that ensures price action matches a recognized institutional setup:
- **SMC_REVERSAL**: Sweep → BOS → POI (OB/FVG) → OTE.
- **BOS_PULLBACK**: Continuation entry after a structural break.
- **CHOCH_ENTRY**: Early reversal entry at the first sign of structural shift.
- **SILVER_BULLET**: Time-based entries during ICT's high-probability windows.

### 2. Macro Bias Engine ([macroBiasEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/macro/macroBiasEngine.ts))
- **Auto-Bias**: Automatically derives bias from **Daily + 4H** structure alignment.
- **Alignment Rules**: Daily bullish + 4H bullish = Strong Bullish. Daily bullish + 4H bearish = Neutral (Stay Out).

### 3. SMT Divergence Engine ([smtDivergenceEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/smt/smtDivergenceEngine.ts))
- **Intermarket Analysis**: Compares EUR/USD with GBP/USD (or correlated pairs).
- **Alpha Cue**: Divergence at swing highs/lows signals institutional distribution/accumulation.

### 4. Session Engine ([sessionEngine.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/session/sessionEngine.ts))
- **Phase Detection**: Identifies London Open/Main, NY Open/Main, and the Silver Bullet windows.
- **Dead Zone**: Automatically blocks trading between 17:00–20:00 UTC.

---

## ⚡ Confluence & Signal Filters

### Weighted Confluence Scorer ([weightedConfluenceScorer.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/confluence/weightedConfluenceScorer.ts))
Replaces flat scoring with institutional weighting:
- **Tier 1 (3 pts)**: MSS (BOS/ChoCH), Liquidity Sweep.
- **Tier 2 (2 pts)**: POI (OB/FVG), HTF Structure, OTE Zone.
- **Bonuses**: SMT Divergence (+2), Silver Bullet (+1), Macro Strength (+0.5).

**Quality Labels**:
- **12.0+**: 🏆 Institutional Grade
- **10.0+**: ⭐⭐ High Conviction
- **8.0+**: ⭐ Standard Quality

### Pre-Signal Filters ([signalFilters.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/filters/signalFilters.ts))
- **Spread Filter**: Rejects trades if spread > limit (e.g., 1.5 pips for EURUSD).
- **Volatility (ATR)**: Ensures market is neither "dead" nor "chaotic".
- **RR Validation**: Strictly enforces a minimum 1.5R Risk/Reward ratio.

---

## 🤖 The Robot Tab & Execution
- **Multi-TF Ranking**: Signals from 1day down to 5min are weighted. Daily signals carry higher weight on tie-breaks.
- **Bot Cycle Orchestrator**: The final gate that checks Daily Trade Limits and Cooldowns before calling [tradeExecutor.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/auto-trader/tradeExecutor.ts).
- **Execution**: Signals are sent to the [signalServer](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/signalServer.cjs) bridge for MT5 order placement.



