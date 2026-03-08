// src/engines/bos-choch/impulseLegTracer.ts
/**
 * impulseLegTracer.ts
 * [FIX B-2] Walks back from a displacement candle to find the full impulse leg origin.
 *
 * ICT concept: The OTE Fibonacci is anchored from the ENTIRE impulse leg, not just
 * the displacement candle. The impulse leg origin is the lowest low (for bullish)
 * or highest high (for bearish) before the displacement started.
 *
 * Previous bug: OTE was computed from the single displacement candle's range (~30-50 pips).
 * Fix: walk back from displacement to find the leg origin (150-300 pip anchor).
 */

import type { Candle } from '../../types/candle.types'
import { snap } from '../../utils/priceFormat'

export interface ImpulseLeg {
  impulseHigh: number
  impulseLow:  number
}

/**
 * Walk back from displacement candle index to find the origin of the impulse leg.
 * [FIX B-2] Gives the full OTE Fibonacci range.
 */
export function traceImpulseLeg(
  recent:    Candle[],
  dispIndex: number,
  direction: 'bullish' | 'bearish',
): ImpulseLeg {
  const n   = recent.length
  const dispCandle = recent[dispIndex]

  if (direction === 'bullish') {
    let minLow = dispCandle.low
    for (let i = dispIndex - 1; i >= 0; i--) {
      if (recent[i].low < minLow) minLow = recent[i].low
      // Stop if we hit a candle that had already broken higher (marks leg start)
      if (i < dispIndex - 1 && recent[i].close > recent[i + 1].high) break
    }
    return {
      impulseLow:  snap(minLow),
      impulseHigh: snap(Math.max(...recent.slice(Math.max(0, n - 4)).map(c => c.high))),
    }
  } else {
    let maxHigh = dispCandle.high
    for (let i = dispIndex - 1; i >= 0; i--) {
      if (recent[i].high > maxHigh) maxHigh = recent[i].high
      if (i < dispIndex - 1 && recent[i].close < recent[i + 1].low) break
    }
    return {
      impulseHigh: snap(maxHigh),
      impulseLow:  snap(Math.min(...recent.slice(Math.max(0, n - 4)).map(c => c.low))),
    }
  }
}
