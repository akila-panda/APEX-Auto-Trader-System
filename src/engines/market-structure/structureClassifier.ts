/**
 * structureClassifier.ts
 * Classifies market structure as bullish (HH/HL), bearish (LH/LL), or ranging
 * based on confirmed pivot swing points.
 *
 * ICT concept: Structure is determined by the relationship between the last two
 * confirmed swing highs and swing lows. HH+HL = bullish bias. LH+LL = bearish bias.
 */

import type { PivotPoint } from './pivotDetection'

export type StructureLabel = 'bullish' | 'bearish' | 'ranging'

/**
 * Classifies market structure from pivot arrays.
 * Requires at least 2 swing highs AND 2 swing lows to make a determination.
 */
export function classifyStructure(
  swingHighs: PivotPoint[],
  swingLows:  PivotPoint[],
): StructureLabel {
  if (swingHighs.length < 2 || swingLows.length < 2) return 'ranging'

  const lastSH = swingHighs[swingHighs.length - 1].price
  const prevSH = swingHighs[swingHighs.length - 2].price
  const lastSL = swingLows[swingLows.length  - 1].price
  const prevSL = swingLows[swingLows.length  - 2].price

  const isHH = lastSH > prevSH  // Higher High
  const isHL = lastSL > prevSL  // Higher Low
  const isLH = lastSH < prevSH  // Lower High
  const isLL = lastSL < prevSL  // Lower Low

  if (isHH && isHL) return 'bullish'
  if (isLH && isLL) return 'bearish'
  return 'ranging'
}
