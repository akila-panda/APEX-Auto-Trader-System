/**
 * engines/liquidity/index.ts
 * Module contract:
 *   detectLiquidity(candles, struct, tfId, currentExpiry) → LiquidityResult
 */

import type { Candle } from '../../types/candle.types'
import type { MarketStructureResult, LiquidityResult } from '../../types/analysis.types'
import type { SweepWindowExpiry } from './sweepDetector'
import { calculateAsianRange } from './asianRangeCalculator'
import { detectSweep } from './sweepDetector'

export function detectLiquidity(
  candles:       Candle[],
  struct:        MarketStructureResult,
  tfId:          string,
  currentExpiry: SweepWindowExpiry | null,
): LiquidityResult & { updatedExpiry: SweepWindowExpiry | null } {
  const asianRange = calculateAsianRange(candles)

  const sweepResult = detectSweep(candles, struct, asianRange, tfId, currentExpiry)

  return {
    swept:          sweepResult.swept,
    direction:      sweepResult.direction,
    bsl:            struct.swingHigh,
    ssl:            struct.swingLow,
    label:          sweepResult.label,
    asianRange,
    updatedExpiry:  sweepResult.updatedExpiry,
  }
}
