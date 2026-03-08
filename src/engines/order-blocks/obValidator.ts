/**
 * obValidator.ts
 * Confirms an Order Block is unmitigated — price has not fully entered
 * and closed through the OB zone (which would invalidate it).
 */

import type { OrderBlock } from '../../types/analysis.types'

/**
 * Returns true if price has NOT fully mitigated the OB.
 * For bullish OB: price must still be above bot (low).
 * For bearish OB: price must still be below top (high).
 */
export function isOBUnmitigated(
  ob:        OrderBlock,
  direction: 'bullish' | 'bearish',
  price:     number,
): boolean {
  if (direction === 'bullish') return price > ob.bot
  return price < ob.top
}
