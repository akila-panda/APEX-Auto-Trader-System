/**
 * macroBiasEngine.ts
 * Automatic Macro Bias Engine — derives macro bias from higher timeframe structure.
 *
 * Problem with useMacroStore:
 *   Macro bias is set manually by the user via UI (setFactor calls).
 *   If the user forgets to update it, or sets it wrong, EVERY signal fires wrong direction.
 *   macroConfluence.ts literally just checks `bias !== 'neutral'` — any set bias passes.
 *
 * This engine:
 *   1. Reads candles from Daily + 4H timeframes (already cached in useMarketStore)
 *   2. Runs the existing structureClassifier (pivotDetection + classifyStructure)
 *   3. Combines them into a final macro bias using alignment rules
 *   4. Returns a MacroBiasResult that is IDENTICAL in shape to useMacroStore.computedResult()
 *      → Drop-in replacement, no changes needed in confluenceScorer or signalGenerator
 *
 * Alignment rules:
 *   Daily BULLISH + 4H BULLISH → BULLISH (strong)
 *   Daily BEARISH + 4H BEARISH → BEARISH (strong)
 *   Daily BULLISH + 4H BEARISH → NEUTRAL (conflicting — stay out)
 *   Daily BEARISH + 4H BULLISH → NEUTRAL (conflicting — stay out)
 *   Daily BULLISH + 4H RANGING → BULLISH (weak — daily dominates)
 *   Daily BEARISH + 4H RANGING → BEARISH (weak — daily dominates)
 *   Daily RANGING              → NEUTRAL
 *
 * Manual override:
 *   If the user has explicitly locked a macro bias in useMacroStore (locked === true),
 *   the manual value is used and the engine result is ignored.
 *   The real computedStrength() from the store is passed through, not hardcoded as STRONG.
 */

import type { Candle } from '../../types/candle.types'
import type { MacroBias, MacroStrength, MacroBiasResult } from '../../types/macro.types'
import { detectPivots }      from '../market-structure/pivotDetection'
import { classifyStructure, type StructureLabel } from '../market-structure/structureClassifier'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MacroEngineInput {
  /** Candles for Daily timeframe (or highest available HTF) */
  dailyCandles:  Candle[]
  /** Candles for 4H timeframe */
  h4Candles:     Candle[]
  /**
   * Optional: if user has manually locked bias, pass it here to take priority.
   * [BUG #5 FIX] Also pass the real strength so we don't hardcode 'STRONG'.
   */
  manualOverride?: { bias: MacroBias; strength: MacroStrength; locked: boolean }
}

export interface MacroEngineResult extends MacroBiasResult {
  /** The structure classification on Daily TF */
  dailyStructure:  StructureLabel
  /** The structure classification on 4H TF */
  h4Structure:     StructureLabel
  /** Whether the engine result is driving bias (vs manual override) */
  source:          'engine' | 'manual'
  /** Alignment quality */
  aligned:         boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStrength(daily: StructureLabel, h4: StructureLabel): MacroStrength {
  if (daily === h4 && daily !== 'ranging') return 'STRONG'
  if (daily !== 'ranging' && h4 === 'ranging') return 'MEDIUM'
  return 'WEAK'
}

function deriveScore(bias: MacroBias, strength: MacroStrength): number {
  const base = bias === 'bullish' ? 3 : bias === 'bearish' ? -3 : 0
  const mult = strength === 'STRONG' ? 1.5 : strength === 'MEDIUM' ? 1 : 0.5
  return Math.round(base * mult)
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Calculates macro bias automatically from HTF candle structure.
 * Returns a MacroEngineResult that extends MacroBiasResult (same interface shape as useMacroStore.computedResult()).
 */
export function runMacroBiasEngine(input: MacroEngineInput): MacroEngineResult {

  // ── Manual override takes priority if locked ──────────────────────────
  if (input.manualOverride?.locked && input.manualOverride.bias !== 'neutral') {
    const bias     = input.manualOverride.bias
    // [BUG #5 FIX] Use the real strength passed from the store, not hardcoded 'STRONG'
    const strength = input.manualOverride.strength
    return {
      bias,
      total:          bias === 'bullish' ? 5 : -5,
      strength,
      dailyStructure: bias === 'bullish' ? 'bullish' : 'bearish',
      h4Structure:    bias === 'bullish' ? 'bullish' : 'bearish',
      source:         'manual',
      aligned:        true,
    }
  }

  // ── Insufficient data guard ───────────────────────────────────────────
  if (input.dailyCandles.length < 6 || input.h4Candles.length < 6) {
    return {
      bias:           'neutral',
      total:          0,
      strength:       'WEAK',
      dailyStructure: 'ranging',
      h4Structure:    'ranging',
      source:         'engine',
      aligned:        false,
    }
  }

  // ── Run structure classifiers ─────────────────────────────────────────
  const dailyPivots = detectPivots(input.dailyCandles)
  const h4Pivots    = detectPivots(input.h4Candles)

  const dailyStructure = classifyStructure(dailyPivots.swingHighs, dailyPivots.swingLows)
  const h4Structure    = classifyStructure(h4Pivots.swingHighs,    h4Pivots.swingLows)

  // ── Alignment rules ───────────────────────────────────────────────────
  let bias: MacroBias

  if (dailyStructure === 'bullish' && h4Structure === 'bullish') {
    bias = 'bullish'
  } else if (dailyStructure === 'bearish' && h4Structure === 'bearish') {
    bias = 'bearish'
  } else if (dailyStructure === 'bullish' && h4Structure === 'ranging') {
    bias = 'bullish'    // daily dominates, 4H consolidating
  } else if (dailyStructure === 'bearish' && h4Structure === 'ranging') {
    bias = 'bearish'    // daily dominates, 4H consolidating
  } else if (dailyStructure !== 'ranging' && h4Structure !== 'ranging' && dailyStructure !== h4Structure) {
    bias = 'neutral'    // conflicting — stay out
  } else {
    bias = 'neutral'    // ranging or insufficient
  }

  const aligned  = dailyStructure === h4Structure && dailyStructure !== 'ranging'
  const strength = deriveStrength(dailyStructure, h4Structure)
  const total    = deriveScore(bias, strength)

  return {
    bias,
    total,
    strength,
    dailyStructure,
    h4Structure,
    source:  'engine',
    aligned,
  }
}

// ─── Store Patcher ────────────────────────────────────────────────────────────

/**
 * Applies the engine result back to useMacroStore so the existing UI
 * and confluenceScorer still work without changes.
 *
 * Call this once per bot cycle BEFORE evaluateConfluence(), only when source === 'engine'.
 *
 * [BUG #4 FIX] DXY ternary is fully wrapped in parens before the `as` cast.
 */
export function patchMacroStore(
  result: MacroEngineResult,
  setFactor: (factor: 'rateDiff' | 'dxy' | 'cot' | 'dataDiv' | 'geo', value: -1 | 0 | 1) => void,
): void {
  const v = (result.bias === 'bullish' ? 1 : result.bias === 'bearish' ? -1 : 0) as -1 | 0 | 1
  // [BUG #4 FIX] Wrap full ternary in parens before cast — was: 0 as -1|0|1 (only applied to 0)
  const dxy = (result.bias === 'bullish' ? -1 : result.bias === 'bearish' ? 1 : 0) as -1 | 0 | 1

  setFactor('rateDiff', v)
  setFactor('dxy',      dxy)
  setFactor('cot',      v)
  setFactor('dataDiv',  0)
  setFactor('geo',      0)
}
