// src/config/timeframes.config.ts
import { CANDLE_CACHE_TTL_MS } from './api.config'

export interface TimeframeDef {
  id:         string
  label:      string
  intervalMs: number
  cacheTTL:   number
}

export const TIMEFRAMES: TimeframeDef[] = [
  { id: '1day',  label: 'Daily', intervalMs: 86_400_000, cacheTTL: CANDLE_CACHE_TTL_MS },
  { id: '4h',    label: '4H',    intervalMs: 14_400_000, cacheTTL: CANDLE_CACHE_TTL_MS },
  { id: '1h',    label: '1H',    intervalMs:  3_600_000, cacheTTL: CANDLE_CACHE_TTL_MS },
  { id: '30min', label: '30m',   intervalMs:  1_800_000, cacheTTL: CANDLE_CACHE_TTL_MS },
  { id: '15min', label: '15m',   intervalMs:    900_000, cacheTTL: CANDLE_CACHE_TTL_MS },
  { id: '5min',  label: '5m',    intervalMs:    300_000, cacheTTL: CANDLE_CACHE_TTL_MS },
]

export const TF_IDS = TIMEFRAMES.map(t => t.id)

/** Map tfId → interval milliseconds for sweep window expiry math */
export const TF_INTERVAL_MS: Record<string, number> = Object.fromEntries(
  TIMEFRAMES.map(t => [t.id, t.intervalMs])
)

/** Human-readable label map */
export const TF_LABEL: Record<string, string> = Object.fromEntries(
  TIMEFRAMES.map(t => [t.id, t.label])
)
