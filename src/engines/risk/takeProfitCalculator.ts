/**
 * takeProfitCalculator.ts
 * TP1 at 1.5R, TP2 at 3R, Runner at 4R+
 */
import { SL_PIPS, PIP, TP1_RATIO, TP2_RATIO, RUNNER_RATIO } from '../../config/trading.config'
import { snap } from '../../utils/priceFormat'

export interface TakeProfits {
  tp1:    number
  tp2:    number
  runner: number
}

export function calculateTakeProfits(
  entry:     number,
  direction: 'LONG' | 'SHORT',
  slPips?:   number,
): TakeProfits {
  const dist = (slPips ?? SL_PIPS) * PIP
  const sign = direction === 'LONG' ? 1 : -1
  return {
    tp1:    snap(entry + sign * dist * TP1_RATIO),
    tp2:    snap(entry + sign * dist * TP2_RATIO),
    runner: snap(entry + sign * dist * RUNNER_RATIO),
  }
}
