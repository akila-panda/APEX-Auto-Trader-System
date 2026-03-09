<!-- MT5_CONFIGURATION.md -->
# MetaTrader 5 (MT5) Connection & Configuration Guide

This guide explains how to connect your **APEX2** trading engine to a **MetaTrader 5 (MT5) Demo Account** for automated trade execution.

> **Note:** The current APEX2 implementation uses a simulated execution engine. To enable real/demo MT5 execution, you will need to bridge this React application with an MT5-compatible API or a middleware server (e.g., Python `MetaTrader5` library or a REST API bridge).

---

## 1. Setup Your MT5 Demo Account
1. **Download MT5**: Install the MetaTrader 5 terminal from your preferred broker (e.g., IC Markets, Pepperstone, or MetaQuotes).
2. **Create Demo Account**:
   - Open MT5.
   - Go to `File` > `Open an Account`.
   - Search for your broker and select "Demo".
   - Follow the prompts to receive your **Login ID**, **Password**, and **Server Name**.
3. **Verify Connection**: Ensure the bottom-right corner of MT5 shows a green connection status.

## 2. Enable Automated Trading in MT5
Before any bot can place trades, MT5 must be configured to allow it:
1. Go to `Tools` > `Options` (or `Ctrl+O`).
2. Navigate to the **Expert Advisors** tab.
3. Check the following boxes:
   - [x] **Allow algorithmic trading**
   - [x] **Allow WebRequest for listed URL** (Add your bridge API URL here if using a web bridge).
4. Click **OK**.
5. Ensure the **Algo Trading** button in the top toolbar is **Green** (Enabled).

## 3. Recommended Bridge Architecture
Since React (Browser) cannot talk directly to the MT5 Windows Terminal due to security restrictions, you typically use a **Python Bridge**:

### Step A: Install Python & MetaTrader5 Library
```bash
pip install MetaTrader5
```

### Step B: Create a Simple Python Listener
Create a script (e.g., `mt5_bridge.py`) that listens for signals from APEX2:
```python
import MetaTrader5 as mt5
# ... Initialize connection and listen for JSON signals from React ...
```

## 4. Configuring APEX2 for MT5
To route signals from APEX2 to your bridge:
1. **Locate Executor**: Open [tradeExecutor.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/engines/auto-trader/tradeExecutor.ts).
2. **Add API Call**: Replace the simulated logic with a `fetch` call to your bridge:
   ```typescript
   // Example logic to add
   const response = await fetch('http://localhost:5000/trade', {
     method: 'POST',
     body: JSON.stringify(tradeData)
   });
   ```
3. **Set Symbol**: Ensure the `SYMBOL` in [api.config.ts](file:///Users/akilaranasinghe/Documents/GitHub/APEX2/src/config/api.config.ts) matches your MT5 symbol (e.g., `EURUSD` vs `EUR/USD`).

## 5. Security Checklist
- [ ] **Demo First**: Always test on a Demo account before going live.
- [ ] **Slippage**: Set a maximum slippage (e.g., 3 pips) in your bridge script.
- [ ] **Lot Sizes**: Hardcode a minimum lot size (e.g., 0.01) for safety during testing.
- [ ] **Magic Number**: Use a unique `magic_number` in MT5 to distinguish bot trades from manual trades.
