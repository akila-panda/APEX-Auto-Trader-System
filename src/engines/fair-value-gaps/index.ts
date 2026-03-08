// src/engines/fair-value-gaps/index.ts
/**
 * engines/fair-value-gaps/index.ts
 * Module contract:
 *   detectFVG(candles) → FVGResult  (newest-first — FIX B-5)
 */

import type { Candle } from '../../types/candle.types'
import type { FVGResult } from '../../types/analysis.types'
import { detectRawFVGs } from './fvgDetector'

export function detectFVG(candles: Candle[]): FVGResult {
  return detectRawFVGs(candles)
}
