// src/engines/market-structure/pivotDetection.ts
/**
 * pivotDetection.ts
 * [FIX B-1] Detects 3-bar pivot swing highs and lows from a candle array.
 *
 * ICT concept: Swing points are defined by a strict 3-bar rule:
 * - A swing HIGH at index i: high[i] > high[i-1] AND high[i] > high[i+1]
 * - A swing LOW  at index i: low[i]  < low[i-1]  AND low[i]  < low[i+1]
 *
 * Previous bug: compared high[last] vs high[last-5] over 8 candles — not a real pivot test.
 * Fix: proper 3-bar strict comparison on a 40-candle window.
 */

import type { Candle } from '../../types/candle.types'
import { PIVOT_WINDOW } from '../../config/trading.config'

export interface PivotPoint {
  idx:   number
  price: number
}

export interface PivotResult {
  swingHighs: PivotPoint[]
  swingLows:  PivotPoint[]
}

/**
 * Detects all 3-bar pivot swing highs and lows from the last PIVOT_WINDOW candles.
 * Pure function — no side effects.
 */
export function detectPivots(candles: Candle[]): PivotResult {
  if (candles.length < 3) return { swingHighs: [], swingLows: [] }

  const recent     = candles.slice(-PIVOT_WINDOW)
  const swingHighs: PivotPoint[] = []
  const swingLows:  PivotPoint[] = []

  for (let i = 1; i < recent.length - 1; i++) {
    // [FIX B-1] Strict 3-bar pivot: must be strictly greater/lower than both neighbors
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      swingHighs.push({ idx: i, price: recent[i].high })
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      swingLows.push({ idx: i, price: recent[i].low })
    }
  }

  return { swingHighs, swingLows }
}
