// src/engines/risk/index.ts
/**
 * engines/risk/index.ts
 * Module contract:
 *   calculateRisk(direction, entry, atrPips?) → RiskParams
 *
 * [FIX 7] atrPips parameter added. When supplied (from the volatility filter's
 * calculateATR result), the SL and TP distances are scaled to market conditions
 * rather than fixed at the flat SL_PIPS constant.
 *
 * Backward compatible: all existing call sites that pass only (direction, entry)
 * continue to work — atrPips is optional and falls back to SL_PIPS when absent.
 */

import type { RiskParams } from '../../types/trade.types'
import { calculateLotSize }     from './lotSizeCalculator'
import { calculateStopLoss, effectiveSlPips } from './stopLossCalculator'
import { calculateTakeProfits } from './takeProfitCalculator'
import { TP1_RATIO, TP2_RATIO } from '../../config/trading.config'

/**
 * Computes a full set of risk parameters for a trade.
 *
 * @param direction - 'LONG' or 'SHORT'
 * @param entry     - entry price
 * @param atrPips   - current ATR in pips (optional). When present, SL is
 *                    max(15, atrPips * 0.3) instead of the flat 15-pip default.
 *                    Supply this from signalFilters.calculateATR() to get
 *                    market-adaptive sizing.
 */
export function calculateRisk(
  direction: 'LONG' | 'SHORT',
  entry:     number,
  atrPips?:  number,
): RiskParams {
  // [FIX 7] Resolve the effective SL pip distance once so SL and TP are consistent.
  const slPips = effectiveSlPips(atrPips)

  const sl                     = calculateStopLoss(entry, direction, atrPips)
  const { tp1, tp2, runner }   = calculateTakeProfits(entry, direction, slPips)
  const lots                   = calculateLotSize(undefined, slPips)

  return {
    lots,
    sl,
    tp1,
    tp2,
    runner,
    slPips,
    tp1Pips: slPips * TP1_RATIO,
    tp2Pips: slPips * TP2_RATIO,
  }
}