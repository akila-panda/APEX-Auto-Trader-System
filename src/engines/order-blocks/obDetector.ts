/**
 * obDetector.ts
 * Detects the most recent bullish and bearish order blocks from candles.
 *
 * ICT concept:
 * - Bullish OB: last bearish (red) candle before a strong bullish impulse
 * - Bearish OB: last bullish (green) candle before a strong bearish impulse
 * Price must not have fully retraced through the OB (unmitigated).
 */

import type { Candle } from '../../types/candle.types'
import type { OrderBlock } from '../../types/analysis.types'
import { snap } from '../../utils/priceFormat'
import { OB_SCAN_WINDOW } from '../../config/trading.config'

export interface RawOBResult {
  bullOB: OrderBlock | null
  bearOB: OrderBlock | null
}

/**
 * Scans the last OB_SCAN_WINDOW candles to find the most recent unmitigated
 * bullish and bearish order blocks.
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
      && next.close > c.high            // next candle breaks above OB
      && currentPrice > c.low) {        // price hasn't mitigated below OB
      bullOB = {
        bot: snap(c.low),
        top: snap(c.high),
        mid: snap((c.low + c.high) / 2),
      }
    }

    // Bearish OB: bullish candle followed by bearish impulse below it
    if (!bearOB
      && c.close > c.open               // bullish candle
      && next.close < c.low             // next candle breaks below OB
      && currentPrice < c.high) {       // price hasn't mitigated above OB
      bearOB = {
        bot: snap(c.low),
        top: snap(c.high),
        mid: snap((c.low + c.high) / 2),
      }
    }

    if (bullOB && bearOB) break
  }

  return { bullOB, bearOB }
}
