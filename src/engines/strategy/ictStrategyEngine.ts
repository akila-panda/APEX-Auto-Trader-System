/**
 * ictStrategyEngine.ts
 * ICT Strategy Engine — the missing layer between Indicator Engines and Confluence.
 *
 * Current pipeline (broken):
 *   Indicators → Confluence → Signal
 *
 * Correct pipeline (this file fixes it):
 *   Indicators → Strategy Engine → Confluence → Signal
 *
 * What this engine does:
 *   Takes the raw output from ALL existing indicator engines and asks:
 *   "Does this market currently match a valid ICT trade setup?"
 *   If YES → create a SetupResult with direction and type.
 *   If NO  → return null (confluence engine never runs, no signal created).
 *
 * Supported setups:
 *   1. SMC_REVERSAL  — Sweep + BOS + OB/FVG + OTE (highest quality)
 *   2. BOS_PULLBACK  — BOS + price retracing into OB/FVG (no sweep required)
 *   3. CHOCH_ENTRY   — Change of Character + OTE (early reversal)
 *   4. SILVER_BULLET — Silver Bullet window + OTE + MSS (ICT time-based)
 */

import type { AnalysisResult } from '../../types/analysis.types'
import type { SessionEngineResult } from '../session/sessionEngine'
import type { SMTDivergenceResult } from '../smt/smtDivergenceEngine'
import type { MacroEngineResult } from '../macro/macroBiasEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SetupType =
  | 'SMC_REVERSAL'    // Full ICT sequence: sweep → BOS → OB/FVG → OTE
  | 'BOS_PULLBACK'    // Structural pullback: BOS → retrace to OB
  | 'CHOCH_ENTRY'     // Early reversal at ChoCH + OTE
  | 'SILVER_BULLET'   // Time-based: Silver Bullet window + OTE + MSS

export interface SetupResult {
  valid:       boolean
  type:        SetupType | null
  direction:   'LONG' | 'SHORT' | null
  confidence:  number              // 1–10 internal confidence score
  reasons:     string[]            // list of conditions that passed
  rejections:  string[]            // list of conditions that failed (for debug)
}

// ─── Setup Detectors ──────────────────────────────────────────────────────────

/**
 * Setup 1: SMC_REVERSAL
 * Highest quality setup. Requires:
 *   ✓ Liquidity sweep in macro direction
 *   ✓ BOS confirming direction change
 *   ✓ Price near OB or FVG (POI)
 *   ✓ OTE zone (optional — adds confidence)
 */
function detectSMCReversal(
  r:    AnalysisResult,
  bias: 'bullish' | 'bearish',
): SetupResult {
  const reasons:    string[] = []
  const rejections: string[] = []

  const sweepOk = r.sweepR.swept && r.sweepR.direction === bias
  const bosOk   = r.bosR.bos && r.bosR.direction === bias
  const poiOk   = r.cf_poi

  sweepOk ? reasons.push('✓ Liquidity sweep in direction')   : rejections.push('✗ No sweep in macro direction')
  bosOk   ? reasons.push('✓ BOS confirmed')                  : rejections.push('✗ No BOS in macro direction')
  poiOk   ? reasons.push('✓ Price near POI (OB/FVG)')        : rejections.push('✗ Price not near POI')

  // Optional OTE — adds confidence but not required
  const oteOk = r.ote.inOTE
  oteOk ? reasons.push('✓ In OTE zone') : rejections.push('ℹ OTE not active (optional)')

  const valid = sweepOk && bosOk && poiOk

  return {
    valid,
    type:       valid ? 'SMC_REVERSAL' : null,
    direction:  valid ? (bias === 'bullish' ? 'LONG' : 'SHORT') : null,
    confidence: valid ? (oteOk ? 9 : 7) : 0,
    reasons,
    rejections,
  }
}

/**
 * Setup 2: BOS_PULLBACK
 * Structural pullback setup. Requires:
 *   ✓ BOS in macro direction
 *   ✓ Price retracing (not still impulsing) — uses r.entry (current price proxy)
 *   ✓ Price near OB or FVG
 * Note: Does NOT require a sweep — this is a continuation entry.
 *
 * [BUG #1 FIX] Was r.currentPrice — AnalysisResult has no currentPrice field.
 * Correct field is r.entry (the entry price proxy = oteSweet or currentPrice).
 */
function detectBOSPullback(
  r:    AnalysisResult,
  bias: 'bullish' | 'bearish',
): SetupResult {
  const reasons:    string[] = []
  const rejections: string[] = []

  const bosOk  = r.bosR.bos && r.bosR.direction === bias
  const poiOk  = r.cf_poi
  // [BUG #1 FIX] r.currentPrice → r.entry (the price proxy on AnalysisResult)
  const retrace = bias === 'bullish'
    ? r.entry < r.struct.swingHigh
    : r.entry > r.struct.swingLow

  bosOk   ? reasons.push('✓ BOS confirmed')               : rejections.push('✗ No BOS in macro direction')
  poiOk   ? reasons.push('✓ Price near POI')               : rejections.push('✗ Not at POI')
  retrace ? reasons.push('✓ Price retracing to POI')       : rejections.push('✗ Price not in retrace')

  const oteOk = r.ote.inOTE
  oteOk ? reasons.push('✓ In OTE zone') : rejections.push('ℹ OTE not active (optional)')

  const valid = bosOk && poiOk && retrace

  return {
    valid,
    type:       valid ? 'BOS_PULLBACK' : null,
    direction:  valid ? (bias === 'bullish' ? 'LONG' : 'SHORT') : null,
    confidence: valid ? (oteOk ? 7 : 5) : 0,
    reasons,
    rejections,
  }
}

/**
 * Setup 3: CHOCH_ENTRY
 * Early reversal setup at Change of Character. Requires:
 *   ✓ ChoCH detected in macro direction
 *   ✓ OTE zone active (reversal entries need precision)
 *   ✓ Price near POI
 */
function detectChoCHEntry(
  r:    AnalysisResult,
  bias: 'bullish' | 'bearish',
): SetupResult {
  const reasons:    string[] = []
  const rejections: string[] = []

  const chochOk = r.bosR.choch && r.bosR.direction === bias
  const oteOk   = r.ote.inOTE
  const poiOk   = r.cf_poi

  chochOk ? reasons.push('✓ ChoCH in macro direction')   : rejections.push('✗ No ChoCH in macro direction')
  oteOk   ? reasons.push('✓ In OTE zone')                : rejections.push('✗ Not in OTE zone (required for ChoCH)')
  poiOk   ? reasons.push('✓ Near POI')                   : rejections.push('✗ Not near POI')

  const valid = chochOk && oteOk && poiOk

  return {
    valid,
    type:       valid ? 'CHOCH_ENTRY' : null,
    direction:  valid ? (bias === 'bullish' ? 'LONG' : 'SHORT') : null,
    confidence: valid ? 6 : 0,
    reasons,
    rejections,
  }
}

/**
 * Setup 4: SILVER_BULLET
 * Time-based ICT setup. Requires:
 *   ✓ Inside a Silver Bullet window (03-04, 10-11, 15-16 UTC)
 *   ✓ OTE zone active
 *   ✓ BOS or ChoCH (any MSS)
 */
function detectSilverBullet(
  r:       AnalysisResult,
  bias:    'bullish' | 'bearish',
  session: SessionEngineResult,
): SetupResult {
  const reasons:    string[] = []
  const rejections: string[] = []

  const sbOk   = session.inSilverBullet
  const oteOk  = r.ote.inOTE
  const mssOk  = (r.bosR.bos || r.bosR.choch) && r.bosR.direction === bias

  sbOk  ? reasons.push(`✓ Silver Bullet window #${session.silverBulletIdx} active`) : rejections.push('✗ Not in Silver Bullet window')
  oteOk ? reasons.push('✓ In OTE zone')                                              : rejections.push('✗ Not in OTE zone (required)')
  mssOk ? reasons.push('✓ MSS (BOS/ChoCH) confirmed')                               : rejections.push('✗ No MSS in macro direction')

  const valid = sbOk && oteOk && mssOk

  return {
    valid,
    type:       valid ? 'SILVER_BULLET' : null,
    direction:  valid ? (bias === 'bullish' ? 'LONG' : 'SHORT') : null,
    confidence: valid ? 8 : 0,
    reasons,
    rejections,
  }
}

// ─── Main Strategy Engine Entry Point ────────────────────────────────────────

export interface StrategyEngineInput {
  /** Full analysis result for this timeframe (from existing engine pipeline) */
  analysis:     AnalysisResult
  /** Session engine result (new) */
  session:      SessionEngineResult
  /** Macro engine result (new auto engine or existing manual store result) */
  macro:        MacroEngineResult
  /** SMT divergence result (new, optional) */
  smt?:         SMTDivergenceResult
}

export interface StrategyEngineResult {
  /** The winning setup (highest confidence valid setup) */
  setup:          SetupResult | null
  /** All setups evaluated (for debug/UI) */
  allSetups:      Record<SetupType, SetupResult>
  /** Convenience: true if any setup is valid */
  hasValidSetup:  boolean
  /** The final direction to trade */
  direction:      'LONG' | 'SHORT' | null
  /** Macro bias used */
  bias:           'bullish' | 'bearish' | 'neutral'
}

/**
 * Runs all setup detectors and returns the highest-confidence valid setup.
 * Returns null setup if no ICT pattern is currently valid.
 *
 * This is the gatekeeper. If this returns hasValidSetup=false, the confluence
 * engine never runs and no signal is generated.
 */
export function runStrategyEngine(input: StrategyEngineInput): StrategyEngineResult {
  const { analysis: r, session, macro } = input
  const bias = macro.bias

  // If macro is neutral, no directional setups are valid
  if (bias === 'neutral') {
    return {
      setup:         null,
      allSetups:     {} as Record<SetupType, SetupResult>,
      hasValidSetup: false,
      direction:     null,
      bias:          'neutral',
    }
  }

  // Run all four setup detectors
  const smcReversal  = detectSMCReversal(r, bias)
  const bosPullback  = detectBOSPullback(r, bias)
  const chochEntry   = detectChoCHEntry(r, bias)
  const silverBullet = detectSilverBullet(r, bias, session)

  const allSetups: Record<SetupType, SetupResult> = {
    SMC_REVERSAL:  smcReversal,
    BOS_PULLBACK:  bosPullback,
    CHOCH_ENTRY:   chochEntry,
    SILVER_BULLET: silverBullet,
  }

  // Find the highest-confidence valid setup
  const validSetups = Object.values(allSetups)
    .filter(s => s.valid)
    .sort((a, b) => b.confidence - a.confidence)

  const best = validSetups[0] ?? null

  return {
    setup:         best,
    allSetups,
    hasValidSetup: best !== null,
    direction:     best?.direction ?? null,
    bias,
  }
}
