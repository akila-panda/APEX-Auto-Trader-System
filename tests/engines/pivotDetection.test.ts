// tests/engines/pivotDetection.test.ts
import { describe, it, expect } from 'vitest'
import { detectPivots } from '../../src/engines/market-structure/pivotDetection'
import type { Candle } from '../../src/types/candle.types'

function makeCandle(high: number, low: number, close?: number): Candle {
  return { open: low, high, low, close: close ?? (high + low) / 2, datetime: new Date().toISOString() }
}

describe('detectPivots (FIX B-1: 3-bar pivot rule)', () => {
  it('detects a swing high with 3-bar rule: high[i] > high[i-1] && high[i] > high[i+1]', () => {
    const candles: Candle[] = [
      makeCandle(1.0820, 1.0810),
      makeCandle(1.0830, 1.0818), // pivot high
      makeCandle(1.0822, 1.0812),
    ]
    const result = detectPivots(candles)
    expect(result.swingHighs).toHaveLength(1)
    expect(result.swingHighs[0].price).toBeCloseTo(1.0830)
  })

  it('detects a swing low with 3-bar rule: low[i] < low[i-1] && low[i] < low[i+1]', () => {
    const candles: Candle[] = [
      makeCandle(1.0830, 1.0820),
      makeCandle(1.0825, 1.0810), // pivot low
      makeCandle(1.0835, 1.0822),
    ]
    const result = detectPivots(candles)
    expect(result.swingLows).toHaveLength(1)
    expect(result.swingLows[0].price).toBeCloseTo(1.0810)
  })

  it('does NOT flag a high that is equal to neighbour as a swing high', () => {
    const candles: Candle[] = [
      makeCandle(1.0830, 1.0820),
      makeCandle(1.0830, 1.0820), // same high — not a pivot
      makeCandle(1.0828, 1.0818),
    ]
    const result = detectPivots(candles)
    expect(result.swingHighs).toHaveLength(0)
  })

  it('returns empty arrays for fewer than 3 candles', () => {
    const result = detectPivots([makeCandle(1.09, 1.08)])
    expect(result.swingHighs).toHaveLength(0)
    expect(result.swingLows).toHaveLength(0)
  })

  it('detects multiple pivots in a zigzag sequence', () => {
    const candles: Candle[] = [
      makeCandle(1.080, 1.079),
      makeCandle(1.085, 1.081), // SH1
      makeCandle(1.082, 1.078),
      makeCandle(1.076, 1.074), // SL
      makeCandle(1.079, 1.075),
      makeCandle(1.088, 1.080), // SH2
      makeCandle(1.083, 1.079),
    ]
    const result = detectPivots(candles)
    expect(result.swingHighs.length).toBeGreaterThanOrEqual(1)
    expect(result.swingLows.length).toBeGreaterThanOrEqual(1)
  })
})
