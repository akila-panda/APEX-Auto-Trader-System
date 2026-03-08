// src/engines/bos-choch/displacementDetector.ts
/**
 * displacementDetector.ts
 * Detects a displacement candle — a strong momentum candle with body ratio > 60%.
 *
 * ICT concept: A displacement candle signals institutional order flow entering the market.
 * The body must exceed 60% of the total range (wick-to-wick), indicating urgency.
 */

import type { Candle } from '../../types/candle.types'
import { BODY_RATIO_THRESHOLD } from '../../config/trading.config'

export interface DisplacementCheck {
  isDisplacement: boolean
  bodyRatio:      number
  isBullish:      boolean
  isBearish:      boolean
}

export function checkDisplacementCandle(candle: Candle): DisplacementCheck {
  const range     = candle.high - candle.low
  const body      = Math.abs(candle.close - candle.open)
  const bodyRatio = range > 0 ? body / range : 0
  const isBullish = candle.close > candle.open
  const isBearish = candle.close < candle.open
  return {
    isDisplacement: bodyRatio > BODY_RATIO_THRESHOLD,
    bodyRatio,
    isBullish,
    isBearish,
  }
}
