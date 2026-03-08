// src/engines/confluence/confluenceScorer.ts
/**
 * confluenceScorer.ts
 * [FIX C-4] Aggregates 5 core confluence points + optional macro strength bonus.
 *
 * Scoring:
 * - coreScore = sum of [cf_macro, cf_htf, cf_sweep, cf_mss, cf_ote] (max 5)
 * - macroBonus = MACRO_STRONG_BONUS (0.5) if macro strength is STRONG (|score| >= 4)
 * - effectiveScore = coreScore + macroBonus
 */
import type { MacroStrength } from '../../types/macro.types'
import { MACRO_STRONG_BONUS } from '../../config/trading.config'

export interface ScorerInput {
  cf_macro:  boolean
  cf_htf:    boolean
  cf_sweep:  boolean
  cf_mss:    boolean
  cf_ote:    boolean
  strength:  MacroStrength
}

export interface ScorerResult {
  coreScore:      number
  macroBonus:     number
  effectiveScore: number
}

/**
 * Computes effective signal score including strength bonus.
 * [FIX C-4] macroBonus = STRONG ? 0.5 : 0
 */
export function scoreConfluence(input: ScorerInput): ScorerResult {
  const coreScore = [
    input.cf_macro,
    input.cf_htf,
    input.cf_sweep,
    input.cf_mss,
    input.cf_ote,
  ].filter(Boolean).length

  const macroBonus     = input.strength === 'STRONG' ? MACRO_STRONG_BONUS : 0
  const effectiveScore = coreScore + macroBonus

  return { coreScore, macroBonus, effectiveScore }
}
