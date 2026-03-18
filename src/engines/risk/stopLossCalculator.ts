// src/engines/risk/stopLossCalculator.ts
/**
 * stopLossCalculator.ts
 *
 * [FIX 7] Stop loss is now ATR-scaled instead of a flat 15-pip constant.
 *
 * Formula:
 *   sl_pips = max(SL_PIPS, atrPips * 0.3)
 *
 * Rationale:
 *   A flat 15-pip SL on a day where EUR/USD ATR is 80 pips will be hit by noise
 *   on nearly every entry. The 0.3 × ATR multiplier sets a SL that breathes with
 *   market conditions while SL_PIPS (15) acts as a hard floor to prevent
 *   micro-sized stops on dead markets.
 *
 * Integration:
 *   atrPips is supplied by the caller (calculateRisk in risk/index.ts), which
 *   receives it from the volatility filter that already computed ATR. We do NOT
 *   recalculate ATR here — the candle data should not be accessed at the SL
 *   calculation layer.
 *
 *   When atrPips is absent (e.g. analysis path before filters run), the function
 *   falls back to the flat SL_PIPS floor — identical to the old behaviour.
 */
import { SL_PIPS, PIP } from '../../config/trading.config'
import { snap } from '../../utils/priceFormat'

/** ATR multiplier for stop loss sizing. 0.3 × ATR keeps the SL outside 1 standard noise band. */
const ATR_SL_MULTIPLIER = 0.3

/**
 * Calculates the stop loss price from the entry.
 *
 * @param entry     - trade entry price
 * @param direction - 'LONG' or 'SHORT'
 * @param atrPips   - current ATR in pips from the volatility filter (optional).
 *                    When provided, sl_pips = max(SL_PIPS, atrPips * ATR_SL_MULTIPLIER).
 *                    When absent, falls back to the flat SL_PIPS constant.
 * @param slPips    - explicit pip override (takes priority over both ATR and default).
 */
export function calculateStopLoss(
  entry:     number,
  direction: 'LONG' | 'SHORT',
  atrPips?:  number,
  slPips?:   number,
): number {
  let effectiveSlPips: number

  if (slPips !== undefined) {
    // Explicit override — caller knows best
    effectiveSlPips = slPips
  } else if (atrPips !== undefined && atrPips > 0) {
    // [FIX 7] ATR-scaled SL floored at SL_PIPS
    effectiveSlPips = Math.max(SL_PIPS, atrPips * ATR_SL_MULTIPLIER)
  } else {
    // Fallback: flat SL_PIPS (unchanged from original behaviour)
    effectiveSlPips = SL_PIPS
  }

  const dist = effectiveSlPips * PIP
  return direction === 'LONG' ? snap(entry - dist) : snap(entry + dist)
}

/**
 * Returns the effective SL distance in pips for a given ATR.
 * Useful for downstream calculations (TP ratios, lot sizing) that need the pip count.
 */
export function effectiveSlPips(atrPips?: number, slPipsOverride?: number): number {
  if (slPipsOverride !== undefined) return slPipsOverride
  if (atrPips !== undefined && atrPips > 0) {
    return Math.max(SL_PIPS, atrPips * ATR_SL_MULTIPLIER)
  }
  return SL_PIPS
}