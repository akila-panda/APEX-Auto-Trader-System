// src/engines/market-structure/index.ts
/**
 * engines/market-structure/index.ts
 * Orchestrates pivot detection → structure classification → equilibrium calculation.
 *
 * Module contract:
 *   detectMarketStructure(candles: Candle[]): MarketStructureResult
 */

import type { Candle } from '../../types/candle.types'
import type { MarketStructureResult } from '../../types/analysis.types'
import { detectPivots } from './pivotDetection'
import { classifyStructure } from './structureClassifier'
import { calculateEquilibrium } from './equilibriumCalculator'
import { snap } from '../../utils/priceFormat'

/**
 * Detects the current market structure from raw candles.
 * Uses 3-bar pivot detection (FIX B-1), structure classification, and
 * 50% equilibrium zoning.
 */
export function detectMarketStructure(
  candles:      Candle[],
  currentPrice: number,
): MarketStructureResult {
  if (!candles || candles.length < 10) {
    return {
      structure:  'ranging',
      swingHigh:  0,
      swingLow:   0,
      equilibrium: 0,
      inDiscount:  false,
      inPremium:   false,
      swingHighs:  [],
      swingLows:   [],
    }
  }

  const { swingHighs, swingLows } = detectPivots(candles)
  const structure = classifyStructure(swingHighs, swingLows)

  // Derive range from pivots if available, else from raw candles
  const recent = candles.slice(-40)
  const allHighs = swingHighs.length > 0
    ? swingHighs.map(s => s.price)
    : recent.map(c => c.high)
  const allLows  = swingLows.length  > 0
    ? swingLows.map(s => s.price)
    : recent.map(c => c.low)

  const swingHigh = snap(Math.max(...allHighs))
  const swingLow  = snap(Math.min(...allLows))

  const price = currentPrice || recent[recent.length - 1].close
  const { equilibrium, inDiscount, inPremium } = calculateEquilibrium(swingHigh, swingLow, price)

  return {
    structure,
    swingHigh,
    swingLow,
    equilibrium,
    inDiscount,
    inPremium,
    swingHighs,
    swingLows,
  }
}
