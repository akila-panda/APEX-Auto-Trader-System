// src/engines/ote/index.ts
/**
 * engines/ote/index.ts
 * Module contract:
 *   calculateOTE(bosResult, struct, currentPrice) → OTEResult
 */

import type { BOSResult, MarketStructureResult, OTEResult } from '../../types/analysis.types'
import { computeFibLevels } from './fibonacciCalculator'
import { isPriceInOTE } from './oteZoneChecker'

export function calculateOTE(
  bosResult:    BOSResult,
  struct:       MarketStructureResult,
  currentPrice: number,
): OTEResult {
  const dir = bosResult.direction
  if (!dir) {
    return { ote62: null, ote79: null, oteSweet: null, inOTE: false, range: 0, direction: null }
  }

  // [FIX B-2] Prefer full impulse leg; fall back to displacement candle or struct range
  let high: number
  let low:  number

  if (bosResult.impulseHigh != null && bosResult.impulseLow != null) {
    high = bosResult.impulseHigh
    low  = bosResult.impulseLow
  } else if (bosResult.displacementHigh != null && bosResult.displacementLow != null) {
    high = bosResult.displacementHigh
    low  = bosResult.displacementLow
  } else {
    high = struct.swingHigh
    low  = struct.swingLow
  }

  if (!high || !low || high === low) {
    return { ote62: null, ote79: null, oteSweet: null, inOTE: false, range: 0, direction: dir }
  }

  const fibs  = computeFibLevels(high, low, dir)
  const inOTE = isPriceInOTE(currentPrice, fibs.ote62, fibs.ote79, dir)

  return {
    ote62:    fibs.ote62,
    ote79:    fibs.ote79,
    oteSweet: fibs.oteSweet,
    inOTE,
    range:    fibs.range,
    direction: dir,
  }
}
