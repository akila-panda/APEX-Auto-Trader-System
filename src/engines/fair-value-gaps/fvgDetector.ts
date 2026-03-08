// src/engines/fair-value-gaps/fvgDetector.ts
/**
 * fvgDetector.ts
 * [FIX B-5] Detects Fair Value Gaps (FVGs) using a newest-first scan.
 *
 * ICT concept: A Fair Value Gap is a 3-candle pattern where candle[i+2].low > candle[i].high
 * (bullish FVG) or candle[i+2].high < candle[i].low (bearish FVG), indicating a price
 * imbalance the market will often return to fill.
 *
 * Previous bug: iterated oldest→newest, returning the OLDEST gap.
 * Fix: loop from i = recent.length - 3 down to i = 0, first match = most recent FVG.
 */

import type { Candle } from '../../types/candle.types'
import type { FVGLevel } from '../../types/analysis.types'
import { snap } from '../../utils/priceFormat'
import { FVG_SCAN_WINDOW } from '../../config/trading.config'

export interface RawFVGResult {
  fvgBull: FVGLevel | null
  fvgBear: FVGLevel | null
}

/**
 * Scans for the most recent bullish and bearish FVGs.
 * [FIX B-5] Scans newest-first so the first match is the latest gap.
 */
export function detectRawFVGs(candles: Candle[]): RawFVGResult {
  if (!candles || candles.length < 3) return { fvgBull: null, fvgBear: null }

  const recent = candles.slice(-FVG_SCAN_WINDOW)
  let fvgBull: FVGLevel | null = null
  let fvgBear: FVGLevel | null = null

  // [FIX B-5] Scan newest-to-oldest: i starts at recent.length - 3
  for (let i = recent.length - 3; i >= 0; i--) {
    const c1 = recent[i]      // oldest of the 3
    const c3 = recent[i + 2]  // newest of the 3

    if (!fvgBull && c1.high < c3.low) {
      fvgBull = {
        low:  snap(c1.high),
        high: snap(c3.low),
        mid:  snap((c1.high + c3.low) / 2),
      }
    }

    if (!fvgBear && c1.low > c3.high) {
      fvgBear = {
        low:  snap(c3.high),
        high: snap(c1.low),
        mid:  snap((c3.high + c1.low) / 2),
      }
    }

    if (fvgBull && fvgBear) break
  }

  return { fvgBull, fvgBear }
}
