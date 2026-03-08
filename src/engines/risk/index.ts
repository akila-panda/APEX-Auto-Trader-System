// src/engines/risk/index.ts
/**
 * engines/risk/index.ts
 * Module contract:
 *   calculateRisk(direction, entry) → RiskParams
 */

import type { RiskParams } from '../../types/trade.types'
import { calculateLotSize }   from './lotSizeCalculator'
import { calculateStopLoss }  from './stopLossCalculator'
import { calculateTakeProfits } from './takeProfitCalculator'
import { SL_PIPS, TP1_RATIO, TP2_RATIO } from '../../config/trading.config'

export function calculateRisk(direction: 'LONG' | 'SHORT', entry: number): RiskParams {
  const lots = calculateLotSize()
  const sl   = calculateStopLoss(entry, direction)
  const { tp1, tp2, runner } = calculateTakeProfits(entry, direction)
  return {
    lots,
    sl,
    tp1,
    tp2,
    runner,
    slPips:   SL_PIPS,
    tp1Pips:  SL_PIPS * TP1_RATIO,
    tp2Pips:  SL_PIPS * TP2_RATIO,
  }
}
