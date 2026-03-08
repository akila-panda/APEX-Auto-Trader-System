// src/engines/risk/lotSizeCalculator.ts
/**
 * lotSizeCalculator.ts
 * Computes position size in lots: Risk Amount / (SL Pips × Pip Value)
 */
import { RISK_AMOUNT, SL_PIPS, PIP_VALUE } from '../../config/trading.config'
import { p2 } from '../../utils/priceFormat'

export function calculateLotSize(
  riskAmount?: number,
  slPips?:     number,
  pipValue?:   number,
): number {
  const r = riskAmount ?? RISK_AMOUNT
  const s = slPips     ?? SL_PIPS
  const v = pipValue   ?? PIP_VALUE
  return p2(r / (s * v))
}
