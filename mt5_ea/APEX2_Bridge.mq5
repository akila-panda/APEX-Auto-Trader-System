//+------------------------------------------------------------------+
//| APEX2_Bridge.mq5                                                 |
//| Pushes OHLCV candle data from MT5 to the APEX2 local listener.   |
//|                                                                  |
//| WHAT IT DOES:                                                    |
//|   Every 60 seconds, reads 80 candles for each of the six APEX2  |
//|   timeframes (D1, H4, H1, M30, M15, M5) on EUR/USD, plus        |
//|   GBP/USD H1 for SMT divergence. Sends each batch via HTTP POST |
//|   to http://localhost:4001/mt5/candles. APEX2 stores the data    |
//|   and uses it for analysis instead of the Twelve Data API.       |
//|                                                                  |
//| HOW TO INSTALL:                                                  |
//|   1. In MT5: File → Open Data Folder → MQL5 → Experts           |
//|   2. Copy this file into that Experts folder                     |
//|   3. In MT5 Navigator panel, find APEX2_Bridge under Expert      |
//|      Advisors and drag it onto any EURUSD M5 chart               |
//|   4. In the EA properties dialog, click OK                       |
//|   5. Make sure Auto Trading is enabled (toolbar button)          |
//|                                                                  |
//| ENABLE WEBREQUEST ON MT5 MAC:                                    |
//|   Tools → Options → Expert Advisors tab                          |
//|   Check "Allow WebRequest for listed URL"                        |
//|   Click the + button and add: http://localhost:4001              |
//|   Click OK — MT5 does NOT need a restart                         |
//|                                                                  |
//| STARTUP ORDER:                                                   |
//|   1. Run ./start-apex2.sh from the APEX2 project root            |
//|      (starts the Node listener on :4001 and the Vite dev server) |
//|   2. Open MT5 and attach this EA to a EURUSD M5 chart            |
//|   3. The EA will push on first timer tick (~60 seconds)          |
//|   You can force an immediate push by removing and re-attaching   |
//|   the EA, which calls OnInit() → PushAllTimeframes()             |
//+------------------------------------------------------------------+

#property copyright "APEX2 Bridge"
#property version   "1.00"
#property strict

// Listener endpoint
string ENDPOINT = "http://127.0.0.1:4001/mt5/candles";

// Maps MQL5 ENUM_TIMEFRAMES to APEX2 TF id strings
struct TFMap {
   ENUM_TIMEFRAMES period;
   string          apexId;
};

// Six EUR/USD timeframes matching APEX2's TIMEFRAMES config exactly
TFMap EURUSD_TFS[6];
// GBP/USD H1 for SMT divergence
TFMap GBPUSD_TFS[1];

//+------------------------------------------------------------------+
//| Expert initialisation                                            |
//+------------------------------------------------------------------+
int OnInit() {
   // Populate EUR/USD timeframe map
   EURUSD_TFS[0].period = PERIOD_D1;  EURUSD_TFS[0].apexId = "1day";
   EURUSD_TFS[1].period = PERIOD_H4;  EURUSD_TFS[1].apexId = "4h";
   EURUSD_TFS[2].period = PERIOD_H1;  EURUSD_TFS[2].apexId = "1h";
   EURUSD_TFS[3].period = PERIOD_M30; EURUSD_TFS[3].apexId = "30min";
   EURUSD_TFS[4].period = PERIOD_M15; EURUSD_TFS[4].apexId = "15min";
   EURUSD_TFS[5].period = PERIOD_M5;  EURUSD_TFS[5].apexId = "5min";

   // GBP/USD H1 for SMT divergence
   GBPUSD_TFS[0].period = PERIOD_H1;  GBPUSD_TFS[0].apexId = "1h";

   // Set timer — push every 60 seconds
   EventSetTimer(60);

   Print("APEX2 Bridge started. Pushing to ", ENDPOINT);

   // Push immediately on init so APEX2 has data before the first timer tick
   PushAllTimeframes();

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   EventKillTimer();
   Print("APEX2 Bridge stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| OnTick — not used, EA is timer-driven only                       |
//+------------------------------------------------------------------+
void OnTick() {}

//+------------------------------------------------------------------+
//| OnTimer — fires every 60 seconds, pushes all timeframes          |
//+------------------------------------------------------------------+
void OnTimer() {
   PushAllTimeframes();
}

//+------------------------------------------------------------------+
//| Push all configured timeframes to APEX2                          |
//+------------------------------------------------------------------+
void PushAllTimeframes() {
   // EUR/USD — six TFs
   for (int i = 0; i < 6; i++) {
      PushCandles("EURUSD", EURUSD_TFS[i].period, EURUSD_TFS[i].apexId);
   }
   // GBP/USD H1 — SMT divergence
   PushCandles("GBPUSD", GBPUSD_TFS[0].period, GBPUSD_TFS[0].apexId);
}

//+------------------------------------------------------------------+
//| Fetch candles for one symbol+period and POST to APEX2            |
//+------------------------------------------------------------------+
void PushCandles(string symbol, ENUM_TIMEFRAMES period, string apexTfId) {
   MqlRates rates[];
   ArraySetAsSeries(rates, false); // oldest-first to match APEX2 expectations

   int copied = CopyRates(symbol, period, 0, 80, rates);
   if (copied <= 0) {
      Print("APEX2 Bridge: CopyRates failed for ", symbol, " ", apexTfId,
            " — error ", GetLastError());
      return;
   }

   // Build JSON body manually — MQL5 has no JSON library
   string body = "{";
   body += "\"symbol\":\"" + symbol + "\",";
   body += "\"timeframe\":\"" + apexTfId + "\",";
   body += "\"candles\":[";

   for (int i = 0; i < copied; i++) {
      // Convert MQL5 datetime to ISO-8601: "YYYY.MM.DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS"
      string dt = TimeToString(rates[i].time, TIME_DATE | TIME_SECONDS);
      // TimeToString returns "YYYY.MM.DD HH:MM:SS" — replace dots and space
      StringReplace(dt, ".", "-");          // YYYY-MM-DD HH:MM:SS
      StringReplace(dt, " ", "T");          // YYYY-MM-DDTHH:MM:SS

      body += "{";
      body += "\"datetime\":\"" + dt + "\",";
      body += "\"open\":"  + DoubleToString(rates[i].open,  5) + ",";
      body += "\"high\":"  + DoubleToString(rates[i].high,  5) + ",";
      body += "\"low\":"   + DoubleToString(rates[i].low,   5) + ",";
      body += "\"close\":" + DoubleToString(rates[i].close, 5);
      body += "}";
      if (i < copied - 1) body += ",";
   }

   body += "]}";

   // Send via WebRequest
   char   bodyBytes[];
   char   responseBytes[];
   string responseHeaders;

   StringToCharArray(body, bodyBytes, 0, StringLen(body));

   int httpCode = WebRequest(
      "POST",
      ENDPOINT,
      "Content-Type: application/json\r\n",
      0,          // timeout ms (0 = default)
      bodyBytes,
      responseBytes,
      responseHeaders
   );

   Print("APEX2 Bridge: ", symbol, " ", apexTfId,
         " — ", copied, " candles — HTTP ", httpCode);
}