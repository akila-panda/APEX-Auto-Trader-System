// src/engines/risk/stopLossCalculator.ts
/**
 * stopLossCalculator.ts
 * Entry ± SL_PIPS × PIP
 */
import { SL_PIPS, PIP } from '../../config/trading.config'
import { snap } from '../../utils/priceFormat'

export function calculateStopLoss(entry: number, direction: 'LONG' | 'SHORT', slPips?: number): number {
  const dist = (slPips ?? SL_PIPS) * PIP
  return direction === 'LONG' ? snap(entry - dist) : snap(entry + dist)
}
