/**
 * biasReasoningEngine.ts
 * Generates a human-readable sentence for each confluence point explaining
 * WHY it passed or failed.
 *
 * LLM-augmentable: The interface here is designed so that narrativeBuilder.ts
 * can be swapped to call Claude API instead of using template strings by:
 * 1. Replacing the template strings in buildReasonings() with an LLM prompt
 * 2. No other module needs to change — this module's output interface stays the same
 */

import type { AnalysisResult } from '../../types/analysis.types'

export interface ConfluenceReasoning {
  factor:  string
  passed:  boolean
  reason:  string
}

/**
 * Builds one sentence per confluence factor explaining its pass/fail state.
 * Replace the template strings below with an LLM API call to make this AI-powered.
 */
export function buildReasonings(A: AnalysisResult): ConfluenceReasoning[] {
  const p = A.entry
  const fmtP = (n: number | null | undefined) => n != null ? n.toFixed(5) : '—'

  return [
    {
      factor:  'cf_macro',
      passed:  A.cf_macro,
      reason:  A.cf_macro
        ? `Macro bias is ${A.macro.bias.toUpperCase()} (score: ${A.macro.total}) — directional filter active.`
        : `Macro score is ${A.macro.total} (neutral ±2 range) — no directional bias set. Update MACRO tab.`,
    },
    {
      factor:  'cf_structure',
      passed:  A.cf_structure,
      reason:  A.cf_structure
        ? `${A.struct.structure === 'bullish' ? 'HH/HL' : 'LH/LL'} structure confirmed on ${A.tfId} with price in ${A.struct.inDiscount ? 'discount' : 'premium'} zone — HTF bias aligned.`
        : `Structure is ${A.struct.structure} but price is in ${A.struct.inDiscount ? 'discount' : 'premium'} — wrong zone for ${A.bias} trade.`,
    },
    {
      factor:  'cf_poi',
      passed:  A.cf_poi,
      reason:  A.cf_poi
        ? `${A.bias === 'bullish' ? 'Bullish OB/FVG' : 'Bearish OB/FVG'} POI within 20 pips at ${fmtP(A.bias === 'bullish' ? A.bullOB?.mid : A.bearOB?.mid)} — demand zone aligned.`
        : `No ${A.bias === 'bullish' ? 'bullish' : 'bearish'} OB or FVG within 20 pips of ${fmtP(p)} — POI proximity not met.`,
    },
    {
      factor:  'cf_sweep',
      passed:  A.cf_sweep,
      reason:  A.cf_sweep
        ? `${A.sweepR.direction === 'bullish' ? 'SSL' : 'BSL'} liquidity sweep confirmed — smart money cleared ${A.sweepR.direction === 'bullish' ? 'sell-stops' : 'buy-stops'} before reversing.`
        : `No ${A.bias} sweep detected in the last 6 candles — smart money hasn't hunted liquidity yet.`,
    },
    {
      factor:  'cf_mss',
      passed:  A.cf_mss,
      reason:  A.cf_mss
        ? `${A.bosR.label} on ${A.tfId} — market structure shifted ${A.bosR.direction}, confirming directional intent.`
        : `No BOS or ChoCH in ${A.bias} direction detected — awaiting market structure confirmation.`,
    },
    {
      factor:  'cf_ote',
      passed:  A.cf_ote,
      reason:  A.cf_ote
        ? `Price at ${fmtP(p)} is within OTE zone [${fmtP(A.ote.ote79)}–${fmtP(A.ote.ote62)}] — 70.5% Fibonacci sweet spot of the ${A.tfId} impulse leg.`
        : `Price ${fmtP(p)} is outside the OTE retracement zone [${fmtP(A.ote.ote79)}–${fmtP(A.ote.ote62)}] — suboptimal entry location.`,
    },
    {
      factor:  'cf_kz',
      passed:  A.cf_kz,
      reason:  A.cf_kz
        ? `${A.sess.sessionName} Kill Zone active — institutional order flow expected.`
        : `Outside Kill Zone (London 07–10 / NY 12–15 UTC). Current session: ${A.sess.sessionName}. Patience for optimal timing.`,
    },
    {
      factor:  'cf_news',
      passed:  A.cf_news,
      reason:  A.cf_news
        ? `No high-impact news within 30 minutes — news filter clear.`
        : `High-impact event within 30 minutes — news filter blocking entry to protect capital.`,
    },
  ]
}
