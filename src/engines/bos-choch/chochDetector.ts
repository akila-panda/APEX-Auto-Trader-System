// src/engines/bos-choch/chochDetector.ts
/**
 * chochDetector.ts
 * Detects a Change of Character (ChoCH) — price closes beyond a prior confirmed pivot.
 *
 * ICT concept: A ChoCH is a micro-reversal signal where price closes beyond the last
 * confirmed swing pivot, breaking the existing structural pattern. Unlike a BOS,
 * it does not require a full displacement candle — just a close beyond the pivot.
 */

import type { Candle } from '../../types/candle.types'

export interface ChoCHResult {
  bullChoCH: boolean
  bearChoCH: boolean
  swingHighIdx: number
  swingLowIdx:  number
}

/**
 * Detects ChoCH by finding the most recent confirmed pivot and checking if
 * the last candle closes beyond it.
 */
export function detectChoCH(recent: Candle[]): ChoCHResult {
  const n = recent.length
  let swingLowIdx  = -1
  let swingHighIdx = -1

  for (let i = n - 3; i >= 1; i--) {
    if (swingLowIdx < 0 && recent[i].low  < recent[i - 1].low  && recent[i].low  < recent[i + 1].low)
      swingLowIdx = i
    if (swingHighIdx < 0 && recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high)
      swingHighIdx = i
    if (swingLowIdx >= 0 && swingHighIdx >= 0) break
  }

  const last = recent[n - 1]
  const prev = recent[n - 2]

  const bullChoCH = swingHighIdx > 0
    && last.close > recent[swingHighIdx].high
    && last.close > prev.close

  const bearChoCH = swingLowIdx > 0
    && last.close < recent[swingLowIdx].low
    && last.close < prev.close

  return { bullChoCH, bearChoCH, swingHighIdx, swingLowIdx }
}
