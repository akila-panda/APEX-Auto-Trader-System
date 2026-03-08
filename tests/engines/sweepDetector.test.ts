// tests/engines/sweepDetector.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { detectSweep } from '../../src/engines/liquidity/sweepDetector'
import type { Candle } from '../../src/types/candle.types'
import type { MarketStructureResult } from '../../src/types/analysis.types'

function c(high: number, low: number, close: number): Candle {
  return { open: (high + low) / 2, high, low, close, datetime: new Date().toISOString() }
}

const baseStruct: MarketStructureResult = {
  structure: 'bullish',
  swingHigh: 1.0900,
  swingLow:  1.0800,
  equilibrium: 1.0850,
  inDiscount: true,
  inPremium: false,
  swingHighs: [],
  swingLows: [],
}

describe('detectSweep (FIX C-2: 6-candle scan)', () => {
  let sweepExpiry: any

  beforeEach(() => {
    sweepExpiry = null
  })

  it('detects BSL sweep: candle wicks above swingHigh and closes below it', () => {
    const candles: Candle[] = [
      c(1.0880, 1.0860, 1.0870),
      c(1.0910, 1.0870, 1.0875), // sweeps swingHigh 1.0900, closes below → BSL sweep
      c(1.0882, 1.0860, 1.0865),
    ]
    const result = detectSweep(candles, baseStruct, { high: null, low: null }, '1h', sweepExpiry)
    expect(result.swept).toBe(true)
    expect(result.direction).toBe('bearish')
  })

  it('detects SSL sweep: candle wicks below swingLow and closes above it', () => {
    const candles: Candle[] = [
      c(1.0830, 1.0810, 1.0820),
      c(1.0820, 1.0790, 1.0815), // sweeps swingLow 1.0800, closes above → SSL sweep
      c(1.0825, 1.0812, 1.0818),
    ]
    const result = detectSweep(candles, baseStruct, { high: null, low: null }, '1h', sweepExpiry)
    expect(result.swept).toBe(true)
    expect(result.direction).toBe('bullish')
  })

  it('detects sweep from candle 3 bars ago (not just last candle) [FIX C-2]', () => {
    const candles: Candle[] = [
      c(1.0910, 1.0880, 1.0885), // sweep 3 bars ago
      c(1.0882, 1.0860, 1.0865),
      c(1.0875, 1.0858, 1.0862),
      c(1.0870, 1.0855, 1.0860),
    ]
    const result = detectSweep(candles, baseStruct, { high: null, low: null }, '1h', sweepExpiry)
    expect(result.swept).toBe(true)
  })

  it('returns swept=false when no sweep in last 6 candles', () => {
    const candles: Candle[] = [
      c(1.0880, 1.0860, 1.0870),
      c(1.0878, 1.0858, 1.0868),
      c(1.0876, 1.0856, 1.0866),
    ]
    const result = detectSweep(candles, baseStruct, { high: null, low: null }, '1h', sweepExpiry)
    expect(result.swept).toBe(false)
  })

  it('uses persisted sweep window when within expiry', () => {
    const expiry = { expiry: Date.now() + 99999, direction: 'bullish' as const }
    const candles: Candle[] = [
      c(1.0870, 1.0850, 1.0860),
      c(1.0868, 1.0848, 1.0858),
    ]
    const result = detectSweep(candles, baseStruct, { high: null, low: null }, '1h', expiry)
    expect(result.swept).toBe(true)
    expect(result.direction).toBe('bullish')
  })
})
