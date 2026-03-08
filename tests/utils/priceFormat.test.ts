// tests/utils/priceFormat.test.ts
import { describe, it, expect } from 'vitest'
import { fmt5, fmt2, fmtPips, fmtPnl } from '../../src/utils/priceFormat'

describe('priceFormat utils', () => {
  describe('fmt5', () => {
    it('formats a number to 5 decimal places', () => {
      expect(fmt5(1.08427)).toBe('1.08427')
    })

    it('rounds correctly at 5th decimal', () => {
      expect(fmt5(1.084275)).toBe('1.08428')
    })

    it('returns — for null', () => {
      expect(fmt5(null)).toBe('—')
    })

    it('returns — for undefined', () => {
      expect(fmt5(undefined)).toBe('—')
    })

    it('returns — for NaN', () => {
      expect(fmt5(NaN)).toBe('—')
    })

    it('handles zero correctly', () => {
      expect(fmt5(0)).toBe('0.00000')
    })
  })

  describe('fmt2', () => {
    it('formats to 2 decimal places', () => {
      expect(fmt2(1.123456)).toBe('1.12')
    })

    it('returns — for null', () => {
      expect(fmt2(null)).toBe('—')
    })
  })

  describe('fmtPips', () => {
    it('returns pip count as integer string with p suffix', () => {
      expect(fmtPips(15)).toBe('15p')
    })

    it('handles negative pips', () => {
      expect(fmtPips(-10)).toBe('-10p')
    })
  })

  describe('fmtPnl', () => {
    it('prefixes positive pnl with +$', () => {
      expect(fmtPnl(200)).toBe('+$200.00')
    })

    it('prefixes negative pnl with -$', () => {
      expect(fmtPnl(-150.5)).toBe('-$150.50')
    })

    it('shows +$0.00 for zero', () => {
      expect(fmtPnl(0)).toBe('+$0.00')
    })
  })
})
