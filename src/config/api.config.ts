// src/config/api.config.ts
/** Twelve Data API configuration  */
export const TD_API_KEY  = import.meta.env.VITE_TD_API_KEY ?? '0dc58b7071b64c4c9c0e981c0c753dff'
export const TD_BASE_URL = 'https://api.twelvedata.com'
export const TD_WS_URL   = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${TD_API_KEY}`
export const SYMBOL      = 'EUR/USD'

export const BROKER_SYMBOL_MAP: Record<string, string> = {
  EURUSD: 'EURUSD',
} as const

export const toBrokerSymbol = (s: string): string => {
  const key = s.replace('/', '')
  return BROKER_SYMBOL_MAP[key] ?? key
}

export const BROKER_SYMBOL = toBrokerSymbol(SYMBOL)

/** Rate-limit config for Twelve Data free tier */
export const RATE_LIMITS = {
  DAILY_LIMIT:      800,
  PER_MIN_LIMIT:    8,
  STAGGER_DELAY_MS: 8000,   // delay between sequential TF fetches
} as const

/** Cache TTL — candles are considered fresh for 4 minutes */
export const CANDLE_CACHE_TTL_MS = 4 * 60 * 1000

/** WebSocket reconnect delay */
export const WS_RECONNECT_DELAY_MS = 5_000

/** Chart throttle — max redraws per second */
export const CHART_THROTTLE_MS = 500
