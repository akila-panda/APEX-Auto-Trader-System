import { describe, it, expect } from 'vitest'
import { scoreConfluence } from '../../src/engines/confluence/confluenceScorer'

describe('scoreConfluence (FIX C-4: macro strength bonus)', () => {
  const base = {
    cf_macro: true,
    cf_htf:   true,
    cf_sweep: true,
    cf_mss:   true,
    cf_ote:   true,
  }

  it('returns coreScore=5 when all 5 confluence factors are true', () => {
    const result = scoreConfluence({ ...base, strength: 'WEAK' })
    expect(result.coreScore).toBe(5)
  })

  it('returns effectiveScore = coreScore when macro strength is WEAK', () => {
    const result = scoreConfluence({ ...base, strength: 'WEAK' })
    expect(result.effectiveScore).toBe(result.coreScore)
    expect(result.macroBonus).toBe(0)
  })

  it('adds +0.5 bonus when macro strength is STRONG [FIX C-4]', () => {
    const result = scoreConfluence({ ...base, strength: 'STRONG' })
    expect(result.macroBonus).toBe(0.5)
    expect(result.effectiveScore).toBe(5.5)
  })

  it('does NOT add bonus for MEDIUM strength', () => {
    const result = scoreConfluence({ ...base, strength: 'MEDIUM' })
    expect(result.macroBonus).toBe(0)
    expect(result.effectiveScore).toBe(5)
  })

  it('counts correctly when 3 of 5 are true', () => {
    const result = scoreConfluence({ ...base, cf_sweep: false, cf_ote: false, strength: 'WEAK' })
    expect(result.coreScore).toBe(3)
  })

  it('effectiveScore with STRONG bonus at score 4 becomes 4.5', () => {
    const result = scoreConfluence({ ...base, cf_ote: false, strength: 'STRONG' })
    expect(result.coreScore).toBe(4)
    expect(result.effectiveScore).toBe(4.5)
  })
})
