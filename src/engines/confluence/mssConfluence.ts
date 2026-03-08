/**
 * mssConfluence.ts — cf_mss: BOS or ChoCH matches macro direction
 * Direction guard lives HERE, not in oteConfluence (FIX C-3).
 */
import type { MacroBias } from '../../types/macro.types'
export function evaluateMSSConfluence(
  bos:       boolean,
  choch:     boolean,
  bosDir:    'bullish' | 'bearish' | null,
  bias:      MacroBias,
): boolean {
  return (bos || choch) && bosDir === bias
}
