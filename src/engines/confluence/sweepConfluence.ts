/**
 * sweepConfluence.ts  — cf_sweep: liquidity sweep in macro direction
 */
import type { MacroBias } from '../../types/macro.types'
export function evaluateSweepConfluence(
  swept:          boolean,
  sweepDirection: 'bullish' | 'bearish' | null,
  bias:           MacroBias,
): boolean {
  return swept && sweepDirection === bias
}
