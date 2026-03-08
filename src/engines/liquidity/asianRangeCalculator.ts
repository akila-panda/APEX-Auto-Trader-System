// src/engines/liquidity/asianRangeCalculator.ts
/**
 * asianRangeCalculator.ts
 * Computes the true UTC Asian session range from candle timestamps.
 *
 * ICT concept: The Asian session (00:00–07:00 UTC) establishes a consolidation range.
 * Smart money often sweeps this range's high or low in the London/NY Kill Zone before
 * the real directional move begins. This is the "Judas Swing" setup.
 */

import type { Candle } from '../../types/candle.types'
import { snap } from '../../utils/priceFormat'

export interface AsianRange {
  high: number | null
  low:  number | null
}

/**
 * Returns the high and low of the Asian session (00:00–07:00 UTC) for today.
 * Falls back to the first 30% of recent candles if no timestamped Asian candles found.
 */
export function calculateAsianRange(candles: Candle[]): AsianRange {
  if (!candles || candles.length === 0) return { high: null, low: null }

  const now          = new Date()
  const ymd          = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  const asianStart   = new Date(`${ymd}T00:00:00Z`).getTime() - 2 * 3_600_000
  const asianEnd     = new Date(`${ymd}T07:00:00Z`).getTime()

  const asianCandles = candles.filter(c => {
    const ts = new Date(c.datetime).getTime()
    return !isNaN(ts) && ts >= asianStart && ts <= asianEnd
  })

  if (asianCandles.length === 0) {
    const recent = candles.slice(-12)
    const window = recent.slice(0, Math.max(1, Math.floor(recent.length * 0.3)))
    return {
      high: snap(Math.max(...window.map(c => c.high))),
      low:  snap(Math.min(...window.map(c => c.low))),
    }
  }

  return {
    high: snap(Math.max(...asianCandles.map(c => c.high))),
    low:  snap(Math.min(...asianCandles.map(c => c.low))),
  }
}
