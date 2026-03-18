// src/engines/order-blocks/obDetector.ts
/**
 * obDetector.ts
 * Detects the most recent bullish and bearish order blocks from candles.
 *
 * ICT concept:
 * - Bullish OB: last bearish (red) candle before a strong bullish impulse
 * - Bearish OB: last bullish (green) candle before a strong bearish impulse
 * Price must not have fully retraced through the OB (unmitigated).
 *
 * [FIX 6] Mitigation check now uses isOBUnmitigated() (candle-close based) instead of
 * a live-price comparison. A wick tag into an OB no longer expires the zone — only a
 * candle close through the OB boundary counts as mitigation.
 */

import type { Candle } from '../../types/candle.types'
import type { OrderBlock } from '../../types/analysis.types'
import { snap } from '../../utils/priceFormat'
import { OB_SCAN_WINDOW } from '../../config/trading.config'
import { isOBUnmitigated } from './obValidator'

export interface RawOBResult {
  bullOB: OrderBlock | null
  bearOB: OrderBlock | null
}

/**
 * Scans the last OB_SCAN_WINDOW candles to find the most recent unmitigated
 * bullish and bearish order blocks.
 *
 * [FIX 6] The mitigation guard inside the detection loop now calls isOBUnmitigated()
 * with the full candle array, checking for a close through the OB boundary rather than
 * a simple currentPrice comparison.
 */
export function detectRawOrderBlocks(candles: Candle[], currentPrice: number): RawOBResult {
  if (!candles || candles.length < 10) return { bullOB: null, bearOB: null }

  const recent = candles.slice(-OB_SCAN_WINDOW)
  let bullOB: OrderBlock | null = null
  let bearOB: OrderBlock | null = null

  for (let i = recent.length - 3; i >= 1; i--) {
    const c    = recent[i]
    const next = recent[i + 1]
    if (!next) continue

    // Bullish OB: bearish candle followed by bullish impulse above it
    if (!bullOB
      && c.close < c.open               // bearish candle
      && next.close > c.high) {         // next candle breaks above OB

      const candidate: OrderBlock = {
        bot: snap(c.low),
        top: snap(c.high),
        mid: snap((c.low + c.high) / 2),
      }

      // [FIX 6] Only accept if no subsequent candle has CLOSED below the OB low.
      // Pass the candles that come after the OB candle (i+2 onward) for the check.
      const candlesAfterOB = recent.slice(i + 2)
      if (isOBUnmitigated(candidate, 'bullish', candlesAfterOB)) {
        bullOB = candidate
      }
    }

    // Bearish OB: bullish candle followed by bearish impulse below it
    if (!bearOB
      && c.close > c.open               // bullish candle
      && next.close < c.low) {          // next candle breaks below OB

      const candidate: OrderBlock = {
        bot: snap(c.low),
        top: snap(c.high),
        mid: snap((c.low + c.high) / 2),
      }

      // [FIX 6] Only accept if no subsequent candle has CLOSED above the OB high.
      const candlesAfterOB = recent.slice(i + 2)
      if (isOBUnmitigated(candidate, 'bearish', candlesAfterOB)) {
        bearOB = candidate
      }
    }

    if (bullOB && bearOB) break
  }

  // currentPrice is kept as a final sanity guard: if price is already well beyond
  // the zone (not just a wick), don't surface it. This is intentionally loose —
  // the candle-close check above is the primary mitigation gate.
  if (bullOB && currentPrice < bullOB.bot) bullOB = null
  if (bearOB && currentPrice > bearOB.top) bearOB = null

  return { bullOB, bearOB }
}