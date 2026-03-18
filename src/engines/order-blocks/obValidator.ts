// src/engines/order-blocks/obValidator.ts
/**
 * obValidator.ts
 * Confirms an Order Block is unmitigated — price has not fully closed through
 * the OB zone (which would invalidate it).
 *
 * [FIX 6] Previous logic used current price (a single tick) to decide mitigation:
 *   bullish OB: price > ob.bot   (any wick above the OB low kept it alive)
 *   bearish OB: price < ob.top   (any wick below the OB high kept it alive)
 *
 * The problem: a wick tag into a bullish OB could push price momentarily below
 * ob.bot, mark the OB as mitigated, and remove it — even though price wicked
 * through and closed back above. In live price action, double-tapping an OB
 * before the real entry is extremely common. Expiring the zone on a wick means
 * the entry is missed every time.
 *
 * Fix: mitigation is confirmed only when a candle CLOSES through the OB boundary:
 *   bullish OB: mitigated when any candle closes BELOW ob.bot (close < ob.bot)
 *   bearish OB: mitigated when any candle closes ABOVE ob.top (close > ob.top)
 *
 * The obDetector already checks `currentPrice < ob.high` / `currentPrice > ob.low`
 * as a quick first-pass filter. This function is the secondary structural check
 * that uses full candle history to confirm mitigation status.
 *
 * Usage:
 *   isOBUnmitigated(ob, 'bullish', candles)  → true if zone is still valid
 *   isOBUnmitigated(ob, 'bearish', candles)  → true if zone is still valid
 *
 * When candles are not available (e.g. UI display path), the single-price
 * overload is still exported for backward compatibility — but it should only
 * be used for display purposes, never for trade entry gating.
 */

import type { OrderBlock } from '../../types/analysis.types'
import type { Candle } from '../../types/candle.types'

/**
 * Returns true if the OB has NOT been mitigated by a candle close through its boundary.
 *
 * @param ob        - the order block to check
 * @param direction - 'bullish' (demand zone) or 'bearish' (supply zone)
 * @param candles   - recent candle history to check closes against
 * @param lookback  - how many recent candles to check (default 20)
 */
export function isOBUnmitigated(
  ob:        OrderBlock,
  direction: 'bullish' | 'bearish',
  candles:   Candle[],
  lookback:  number = 20,
): boolean {
  if (!candles || candles.length === 0) return true  // no data — assume unmitigated

  const recent = candles.slice(-lookback)

  if (direction === 'bullish') {
    // Bullish OB (demand zone) is mitigated only when a candle CLOSES below ob.bot.
    // A wick below ob.bot that recovers does NOT count — price must close below the zone.
    return !recent.some(c => c.close < ob.bot)
  } else {
    // Bearish OB (supply zone) is mitigated only when a candle CLOSES above ob.top.
    // A wick above ob.top that recovers does NOT count.
    return !recent.some(c => c.close > ob.top)
  }
}

/**
 * Price-only overload — kept for display/UI paths that do not have candle history.
 * Do NOT use this overload for trade entry gating; use the candle overload above.
 *
 * Returns true if currentPrice has not crossed the OB boundary at all (a looser check).
 * This matches the pre-fix behaviour and is intentionally more permissive — it is only
 * appropriate when showing OBs on the chart, not when deciding whether to enter a trade.
 */
export function isOBUnmitigatedByPrice(
  ob:        OrderBlock,
  direction: 'bullish' | 'bearish',
  price:     number,
): boolean {
  if (direction === 'bullish') return price > ob.bot
  return price < ob.top
}