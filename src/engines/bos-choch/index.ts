// src/engines/bos-choch/index.ts
/**
 * engines/bos-choch/index.ts
 * Module contract:
 *   detectBOS(candles) → BOSResult  (includes impulseHigh/Low — FIX B-2)
 */

import type { Candle } from '../../types/candle.types'
import type { BOSResult } from '../../types/analysis.types'
import { checkDisplacementCandle } from './displacementDetector'
import { traceImpulseLeg } from './impulseLegTracer'
import { detectChoCH } from './chochDetector'
import { snap } from '../../utils/priceFormat'
import { BOS_SCAN_WINDOW } from '../../config/trading.config'

export function detectBOS(candles: Candle[]): BOSResult {
  if (!candles || candles.length < 10) {
    return {
      bos: false, choch: false, displacement: false, direction: null,
      label: 'Insufficient data',
      displacementHigh: null, displacementLow: null,
      impulseHigh: null, impulseLow: null,
    }
  }

  const recent = candles.slice(-BOS_SCAN_WINDOW)
  const n      = recent.length
  const last   = recent[n - 1]

  // Check displacement on last candle
  const disp = checkDisplacementCandle(last)

  // BOS requires displacement + close beyond penultimate swing
  const bullBOS = disp.isDisplacement && disp.isBullish && last.close > (recent[n - 3]?.high ?? 0)
  const bearBOS = disp.isDisplacement && disp.isBearish && last.close < (recent[n - 3]?.low  ?? 99)
  const bos     = bullBOS || bearBOS

  // ChoCH does NOT require displacement — just close beyond prior pivot
  const chochResult = detectChoCH(recent)
  const choch = !bos && (chochResult.bullChoCH || chochResult.bearChoCH)

  const direction = (bullBOS || chochResult.bullChoCH)
    ? 'bullish'
    : (bearBOS || chochResult.bearChoCH)
      ? 'bearish'
      : null

  const displacementHigh = (bos || choch) ? snap(last.high) : null
  const displacementLow  = (bos || choch) ? snap(last.low)  : null

  // [FIX B-2] Walk back from displacement to find full impulse leg origin
  let impulseHigh: number | null = displacementHigh
  let impulseLow:  number | null = displacementLow

  if (direction) {
    const leg = traceImpulseLeg(recent, n - 1, direction)
    impulseHigh = leg.impulseHigh
    impulseLow  = leg.impulseLow
  }

  let label = 'No structure break'
  if (bullBOS)              label = '▲ Bullish BOS (displacement)'
  else if (bearBOS)         label = '▼ Bearish BOS (displacement)'
  else if (chochResult.bullChoCH) label = '▲ Bullish ChoCH (micro-reversal)'
  else if (chochResult.bearChoCH) label = '▼ Bearish ChoCH (micro-reversal)'

  return {
    bos, choch, displacement: bos || choch,
    direction, label,
    displacementHigh, displacementLow,
    impulseHigh, impulseLow,
  }
}
