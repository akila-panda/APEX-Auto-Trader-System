import { describe, it, expect } from 'vitest'
import { rankSignals } from '../../src/engines/signal/signalRanker'
import type { AnalysisResult } from '../../src/types/analysis.types'

function makeResult(tfId: string, effectiveScore: number, inKZ: boolean, signal: 'LONG' | 'SHORT' = 'LONG'): Partial<AnalysisResult> {
  return { tfId, effectiveScore, coreScore: Math.floor(effectiveScore), signal, cf_kz: inKZ } as Partial<AnalysisResult>
}

describe('rankSignals (FIX A-4: TF weighting)', () => {
  it('prefers higher effectiveScore regardless of TF', () => {
    const signals = [
      makeResult('5min', 4.5, false),
      makeResult('1day', 3.0, false),
    ] as AnalysisResult[]

    const ranked = rankSignals(signals)
    expect(ranked[0].tfId).toBe('5min')
  })

  it('at equal score, prefers Daily (weight=6) over 5m (weight=1)', () => {
    const signals = [
      makeResult('5min', 4.0, false),
      makeResult('1day', 4.0, false),
    ] as AnalysisResult[]

    const ranked = rankSignals(signals)
    expect(ranked[0].tfId).toBe('1day')
  })

  it('at equal score, prefers signal in Kill Zone (+0.5 KZ bonus)', () => {
    const signals = [
      makeResult('4h', 4.0, false),
      makeResult('1h', 4.0, true), // KZ bonus
    ] as AnalysisResult[]

    const ranked = rankSignals(signals)
    expect(ranked[0].tfId).toBe('1h')
  })

  it('returns signals in descending order of rank', () => {
    const signals = [
      makeResult('5min', 3.0, false),
      makeResult('4h',   4.0, false),
      makeResult('1day', 4.0, false),
    ] as AnalysisResult[]

    const ranked = rankSignals(signals)
    expect(ranked[0].tfId).toBe('1day') // same score as 4h but higher TF weight
    expect(ranked[2].tfId).toBe('5min')
  })

  it('does not mutate the input array', () => {
    const signals = [
      makeResult('5min', 4.0, false),
      makeResult('1day', 4.0, false),
    ] as AnalysisResult[]
    const original = [...signals]
    rankSignals(signals)
    expect(signals[0].tfId).toBe(original[0].tfId)
  })
})
