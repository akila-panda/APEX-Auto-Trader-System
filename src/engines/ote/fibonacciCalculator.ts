/**
 * fibonacciCalculator.ts
 * Computes OTE Fibonacci levels (62%, 70.5%, 79%) from an impulse leg.
 * [FIX B-2] Anchored from full impulse leg origin, not single displacement candle.
 */

import { FIB_62, FIB_705, FIB_79 } from '../../config/trading.config'
import { snap } from '../../utils/priceFormat'

export interface FibLevels {
  ote62:    number
  ote79:    number
  oteSweet: number  // 70.5% — the "sweet spot"
  range:    number
}

/**
 * Computes OTE Fibonacci retracement levels from the impulse leg.
 * For bullish: fib levels are below the impulse high (retracement into discount).
 * For bearish: fib levels are above the impulse low (retracement into premium).
 */
export function computeFibLevels(
  impulseHigh: number,
  impulseLow:  number,
  direction:   'bullish' | 'bearish',
): FibLevels {
  const range = impulseHigh - impulseLow

  if (direction === 'bullish') {
    return {
      ote62:    snap(impulseHigh - range * FIB_62),
      ote79:    snap(impulseHigh - range * FIB_79),
      oteSweet: snap(impulseHigh - range * FIB_705),
      range:    snap(range),
    }
  } else {
    return {
      ote62:    snap(impulseLow + range * FIB_62),
      ote79:    snap(impulseLow + range * FIB_79),
      oteSweet: snap(impulseLow + range * FIB_705),
      range:    snap(range),
    }
  }
}
