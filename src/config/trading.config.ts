// src/config/trading.config.ts
/** Account & risk management constants */
export const ACCOUNT_BALANCE = 10_000
export const RISK_PCT        = 0.02
export const RISK_AMOUNT     = ACCOUNT_BALANCE * RISK_PCT  // $200
export const PIP_VALUE       = 10      // USD value of 1 pip on 1 standard lot EUR/USD
export const PIP             = 0.0001  // 1 pip in price terms

/** Stop Loss & Take Profit */
export const SL_PIPS       = 15
export const TP1_RATIO     = 1.5   // 1.5R take profit
export const TP2_RATIO     = 3.0   // 3R take profit
export const RUNNER_RATIO  = 4.0   // Runner target

/** Confluence thresholds */
export const POI_PROXIMITY_PIPS  = 20   // [FIX C-1] pips from POI for cf_poi
export const BODY_RATIO_THRESHOLD = 0.6  // [FIX B-1 / B-2] 60% body for displacement candle
export const PIVOT_WINDOW         = 40   // [FIX B-1] candle window for swing pivot detection
export const FVG_SCAN_WINDOW      = 18   // [FIX B-5] candle window for FVG scan
export const OB_SCAN_WINDOW       = 25   // candle window for OB detection
export const SWEEP_CANDLE_WINDOW  = 6    // [FIX C-2] candles scanned for sweep detection
export const SWEEP_EXPIRY_CANDLES = 4    // [FIX C-2] how many candles sweep validity persists
export const BOS_SCAN_WINDOW      = 15   // candles scanned for BOS/ChoCH detection

/** Fibonacci levels for OTE zone */
export const FIB_62  = 0.62
export const FIB_705 = 0.705
export const FIB_79  = 0.79

/** Macro scoring thresholds */
export const MACRO_BULLISH_THRESHOLD  =  2   // score > 2 → bullish
export const MACRO_BEARISH_THRESHOLD  = -2   // score < -2 → bearish
export const MACRO_STRONG_THRESHOLD   =  4   // |score| >= 4 → STRONG [FIX C-4]
export const MACRO_MEDIUM_THRESHOLD   =  3   // |score| == 3 → MEDIUM
export const MACRO_STRONG_BONUS       = 0.5  // [FIX C-4] score bonus for STRONG macro

/** Default bot settings */
export const DEFAULT_MIN_SCORE   = 4
export const DEFAULT_MAX_TRADES  = 3
export const DEFAULT_COOLDOWN_MINS = 30
export const DEFAULT_SCAN_INTERVAL_MS = 300_000  // 5 minutes

/** Kill Zone UTC hours */
export const LONDON_KZ_START = 7
export const LONDON_KZ_END   = 10
export const NY_KZ_START     = 12
export const NY_KZ_END       = 15

/** News proximity window */
export const NEWS_PROXIMITY_MINS = 30

/** Schema version for localStorage */
export const SCHEMA_VERSION = 3

/** TF weighting for signal ranking [FIX A-4] */
export const TF_WEIGHT: Record<string, number> = {
  '1day':  6,
  '4h':    5,
  '1h':    4,
  '30min': 3,
  '15min': 2,
  '5min':  1,
}

/** ICT Silver Bullet windows (UTC hours) */
export const SILVER_BULLET_WINDOWS = [
  { start: 3,  end: 4  },
  { start: 10, end: 11 },
  { start: 15, end: 16 },
]
