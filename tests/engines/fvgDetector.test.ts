import { describe, it, expect } from 'vitest'
import { detectFVG } from '../../src/engines/fair-value-gaps/index'
import type { Candle } from '../../src/types/candle.types'

function c(high: number, low: number): Candle {
  return { open: low, high, low, close: (high + low) / 2, datetime: new Date().toISOString() }
}

describe('detectFVG (FIX B-5: newest-first scan)', () => {
  it('detects bullish FVG: c1.high < c3.low', () => {
    const candles: Candle[] = [
      c(1.0820, 1.0810),
      c(1.0830, 1.0821),
      c(1.0840, 1.0825), // c3.low=1.0825 > c1.high=1.0820 → bullish FVG
    ]
    const result = detectFVG(candles)
    expect(result.fvgBull).not.toBeNull()
    expect(result.fvgBull!.low).toBeCloseTo(1.0820)
    expect(result.fvgBull!.high).toBeCloseTo(1.0825)
  })

  it('detects bearish FVG: c1.low > c3.high', () => {
    const candles: Candle[] = [
      c(1.0840, 1.0830),
      c(1.0828, 1.0818),
      c(1.0825, 1.0810), // c3.high=1.0825 < c1.low=1.0830 → bearish FVG
    ]
    const result = detectFVG(candles)
    expect(result.fvgBear).not.toBeNull()
    expect(result.fvgBear!.low).toBeCloseTo(1.0825)
    expect(result.fvgBear!.high).toBeCloseTo(1.0830)
  })

  it('returns most recent FVG (not oldest) when multiple exist', () => {
    // Two bullish FVGs: older at 1.08xx, newer at 1.09xx
    const candles: Candle[] = [
      c(1.0820, 1.0810), // old FVG c1
      c(1.0830, 1.0821),
      c(1.0840, 1.0826), // old FVG c3
      c(1.0835, 1.0825),
      c(1.0950, 1.0940), // new FVG c1
      c(1.0960, 1.0951),
      c(1.0980, 1.0960), // new FVG c3.low=1.0960 > c1.high=1.0950 → newer FVG
    ]
    const result = detectFVG(candles)
    expect(result.fvgBull).not.toBeNull()
    // Should be the newer FVG (higher price range)
    expect(result.fvgBull!.low).toBeGreaterThan(1.0900)
  })

  it('returns null when no FVG exists', () => {
    const candles: Candle[] = [
      c(1.0830, 1.0820),
      c(1.0828, 1.0818),
      c(1.0825, 1.0815), // overlapping ranges — no gap
    ]
    const result = detectFVG(candles)
    expect(result.fvgBull).toBeNull()
    expect(result.fvgBear).toBeNull()
  })

  it('returns null when fewer than 3 candles', () => {
    const result = detectFVG([c(1.08, 1.07), c(1.09, 1.08)])
    expect(result.fvgBull).toBeNull()
    expect(result.fvgBear).toBeNull()
  })
})
