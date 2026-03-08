/**
 * fvgMitigationChecker.ts
 * Checks if price has partially or fully filled a Fair Value Gap.
 */

import type { FVGLevel } from '../../types/analysis.types'

export type MitigationStatus = 'none' | 'partial' | 'full'

/**
 * Returns whether the current price has entered (partial) or fully closed
 * through the FVG zone.
 */
export function checkFVGMitigation(
  fvg:   FVGLevel,
  price: number,
): MitigationStatus {
  if (price < fvg.low || price > fvg.high) return 'none'
  if (price >= fvg.high) return 'full'
  return 'partial'
}
