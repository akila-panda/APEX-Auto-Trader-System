/**
 * engines/order-blocks/index.ts
 * Module contract:
 *   detectOrderBlocks(candles, currentPrice) → { bullOB, bearOB }
 */

import type { Candle } from '../../types/candle.types'
import type { OrderBlockResult } from '../../types/analysis.types'
import { detectRawOrderBlocks } from './obDetector'

export function detectOrderBlocks(candles: Candle[], currentPrice: number): OrderBlockResult {
  return detectRawOrderBlocks(candles, currentPrice)
}
