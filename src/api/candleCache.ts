// src/api/candleCache.ts
/**
 * candleCache.ts
 * Manages candle cache freshness and fallback generation.
 * All TF analysis reads candles through this layer.
 */

import type { Candle } from '../types/candle.types'
import { CANDLE_CACHE_TTL_MS } from '../config/api.config'
import { snap } from '../utils/priceFormat'

/** Returns true if the candle data for a TF is still fresh (within cache TTL). */
export function isCacheFresh(tfId: string, fetchedAt: Record<string, number>): boolean {
  const t = fetchedAt[tfId]
  return !!t && (Date.now() - t < CANDLE_CACHE_TTL_MS)
}

const FALLBACK_RANGES: Record<string, number> = {
  '1day':  0.012,
  '4h':    0.0045,
  '1h':    0.0020,
  '30min': 0.0012,
  '15min': 0.0008,
  '5min':  0.0004,
}

const FALLBACK_INTERVAL_MINS: Record<string, number> = {
  '1day': 1440, '4h': 240, '1h': 60, '30min': 30, '15min': 15, '5min': 5,
}

/**
 * Generates realistic-looking fallback candles when the API is unavailable.
 * Candles are marked with simulated: true to allow UI to show warning.
 */
export function generateFallbackCandles(tfId: string, count: number = 80): Candle[] {
  const base     = 1.0842
  const range    = FALLBACK_RANGES[tfId] ?? 0.001
  const interval = FALLBACK_INTERVAL_MINS[tfId] ?? 5
  const candles: Candle[] = []
  let price = base

  for (let i = 0; i < count; i++) {
    const body  = (Math.random() * 0.6 + 0.2) * range
    const bull  = Math.sin(i / 15) > 0
    const o     = price
    const c     = snap(o + (bull ? body : -body))
    const h     = snap(Math.max(o, c) + range * 0.15)
    const l     = snap(Math.min(o, c) - range * 0.15)
    const dt    = new Date(Date.now() - (count - i) * 60000 * interval).toISOString()
    candles.push({ open: o, high: h, low: l, close: c, datetime: dt, simulated: true })
    price = c + (Math.random() - 0.5) * range * 0.1
    price = Math.max(1.04, Math.min(1.12, price))
  }

  return candles
}
