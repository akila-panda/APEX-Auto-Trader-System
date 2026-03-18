/**
 * weightedConfluenceScorer.ts
 * Weighted Confluence Scoring System — replaces the flat additive scorer in confluenceScorer.ts
 *
 * Problem with the old system (confluenceScorer.ts):
 *   score = [cf_macro, cf_htf, cf_sweep, cf_mss, cf_ote].filter(Boolean).length
 *   → Every factor counts as exactly 1 point. A liquidity sweep equals a macro setting.
 *   → This produces noisy signals because low-quality confluences pass the threshold.
 *
 * New system:
 *   Each confluence factor has a weight reflecting its ICT significance.
 *   Factors are grouped into TIER 1 (high conviction) and TIER 2 (supporting evidence).
 *
 *   ┌─────────────────────────────┬────────┬──────────────────────────────────┐
 *   │ Factor                      │ Weight │ Reason                           │
 *   ├─────────────────────────────┼────────┼──────────────────────────────────┤
 *   │ MSS (BOS or ChoCH)          │   3    │ Structural confirmation required  │
 *   │ Liquidity Sweep             │   3    │ Sweep before entry = ICT core     │
 *   │ POI (OB or FVG proximity)   │   2    │ Price at institutional level      │
 *   │ HTF Structure + POI         │   2    │ Higher timeframe alignment        │
 *   │ OTE (Fib retracement zone)  │   2    │ Premium/discount entry            │
 *   │ Macro Bias set              │   1    │ Directional filter only           │
 *   │ Kill Zone                   │   1    │ Time-based filter only            │
 *   │ SMT Divergence (bonus)      │   2    │ Intermarket confirmation          │
 *   │ Silver Bullet Window (bonus)│   1    │ Highest-prob ICT time window      │
 *   │ Macro STRONG bonus          │  0.5   │ Existing bonus — kept             │
 *   └─────────────────────────────┴────────┴──────────────────────────────────┘
 *
 *   Max possible score = 17.5
 *   Recommended thresholds:
 *     minScore ≥ 8  → standard quality trade
 *     minScore ≥ 10 → high-conviction trade only
 *     minScore ≥ 12 → institutional-grade setup
 *
 * Backward compatibility:
 *   The result still includes `effectiveScore` and `coreScore` fields
 *   so existing code (botCycleOrchestrator, signalGenerator) works unchanged.
 *   Set `useWeighted: true` in tradingPipeline.ts to activate.
 */

import type { MacroStrength } from '../../types/macro.types'
import type { SMTDivergenceType } from '../smt/smtDivergenceEngine'

// ─── Weights ──────────────────────────────────────────────────────────────────

export const CONFLUENCE_WEIGHTS = {
  cf_mss:     3,    // BOS or ChoCH in macro direction
  cf_sweep:   3,    // Liquidity sweep in macro direction
  cf_poi:     2,    // Price near OB or FVG
  cf_htf:     2,    // HTF structure + POI combined
  cf_ote:     2,    // Price in OTE zone
  cf_macro:   1,    // Macro bias set (non-neutral)
  cf_kz:      1,    // Kill zone timing
  smt_bonus:  2,    // SMT divergence confirmation (bonus)
  sb_bonus:   1,    // Silver Bullet window (bonus)
  macro_strong: 0.5, // STRONG macro strength bonus (existing)
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeightedScorerInput {
  // Core confluence flags (same as existing ScorerInput)
  cf_macro:   boolean
  cf_htf:     boolean
  cf_sweep:   boolean
  cf_mss:     boolean
  cf_ote:     boolean
  cf_poi:     boolean         // NEW — was inside cf_htf, now separate
  cf_kz:      boolean         // kill zone
  strength:   MacroStrength

  // Bonus inputs from new engines
  smtDivergence?:    SMTDivergenceType   // 'BULLISH' | 'BEARISH' | 'NONE'
  tradeDirection?:   'LONG' | 'SHORT' | 'WAIT'
  inSilverBullet?:   boolean
}

export interface WeightedScorerResult {
  /** Weighted score total */
  weightedScore:    number
  /** Equivalent legacy coreScore (for backward compat) */
  coreScore:        number
  /** macroBonus value (kept for backward compat) */
  macroBonus:       number
  /** Final effective score = weightedScore (replaces old effectiveScore) */
  effectiveScore:   number
  /** Breakdown of each factor's contribution */
  breakdown:        Record<string, number>
  /** Which factors are active */
  activeFactors:    string[]
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

/**
 * Calculates a weighted confluence score.
 *
 * Drop-in upgrade: `effectiveScore` in the result replaces the old confluenceScorer output.
 * The `coreScore` and `macroBonus` fields are preserved for backward compatibility.
 */
export function scoreWeightedConfluence(input: WeightedScorerInput): WeightedScorerResult {
  const breakdown: Record<string, number> = {}
  const activeFactors: string[] = []
  let score = 0

  function add(key: string, weight: number, condition: boolean) {
    if (condition) {
      breakdown[key] = weight
      activeFactors.push(key)
      score += weight
    } else {
      breakdown[key] = 0
    }
  }

  // ── Tier 1: High-conviction factors ─────────────────────────────────────
  add('MSS (BOS/ChoCH)',      CONFLUENCE_WEIGHTS.cf_mss,   input.cf_mss)
  add('Liquidity Sweep',      CONFLUENCE_WEIGHTS.cf_sweep, input.cf_sweep)
  add('POI (OB/FVG)',         CONFLUENCE_WEIGHTS.cf_poi,   input.cf_poi)
  add('HTF Structure',        CONFLUENCE_WEIGHTS.cf_htf,   input.cf_htf)
  add('OTE Zone',             CONFLUENCE_WEIGHTS.cf_ote,   input.cf_ote)

  // ── Tier 2: Supporting filters ───────────────────────────────────────────
  add('Macro Bias',           CONFLUENCE_WEIGHTS.cf_macro, input.cf_macro)
  add('Kill Zone',            CONFLUENCE_WEIGHTS.cf_kz,    input.cf_kz)

  // ── Bonuses ──────────────────────────────────────────────────────────────
  const macroStrongBonus = input.strength === 'STRONG' ? CONFLUENCE_WEIGHTS.macro_strong : 0
  if (macroStrongBonus > 0) {
    breakdown['Macro STRONG'] = macroStrongBonus
    activeFactors.push('Macro STRONG')
    score += macroStrongBonus
  }

  // SMT Divergence bonus — only counts if it AGREES with trade direction
  const smtAligned =
    (input.smtDivergence === 'BULLISH' && input.tradeDirection === 'LONG') ||
    (input.smtDivergence === 'BEARISH' && input.tradeDirection === 'SHORT')

  if (smtAligned) {
    breakdown['SMT Divergence'] = CONFLUENCE_WEIGHTS.smt_bonus
    activeFactors.push('SMT Divergence')
    score += CONFLUENCE_WEIGHTS.smt_bonus
  } else {
    breakdown['SMT Divergence'] = 0
  }

  // Silver Bullet window bonus
  if (input.inSilverBullet) {
    breakdown['Silver Bullet'] = CONFLUENCE_WEIGHTS.sb_bonus
    activeFactors.push('Silver Bullet')
    score += CONFLUENCE_WEIGHTS.sb_bonus
  } else {
    breakdown['Silver Bullet'] = 0
  }

  // ── Legacy compatibility fields ─────────────────────────────────────────
  const legacyCoreScore = [
    input.cf_macro,
    input.cf_htf,
    input.cf_sweep,
    input.cf_mss,
    input.cf_ote,
  ].filter(Boolean).length

  return {
    weightedScore:  score,
    coreScore:      legacyCoreScore,
    macroBonus:     macroStrongBonus,
    effectiveScore: score,          // pipeline uses this field
    breakdown,
    activeFactors,
  }
}

// ─── Score Quality Label ──────────────────────────────────────────────────────

/**
 * Returns a human-readable quality label for a weighted score.
 * Useful for the UI signal panel.
 */
export function getScoreQualityLabel(score: number): string {
  if (score >= 12) return '🏆 Institutional Grade'
  if (score >= 10) return '⭐⭐ High Conviction'
  if (score >= 8)  return '⭐ Standard Quality'
  if (score >= 5)  return '⚠️ Marginal — Review'
  return '❌ Below Threshold'
}
