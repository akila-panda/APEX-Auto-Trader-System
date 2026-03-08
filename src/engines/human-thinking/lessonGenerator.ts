// src/engines/human-thinking/lessonGenerator.ts
/**
 * lessonGenerator.ts
 * Generates a post-trade learning point based on the analysis context.
 */

import type { AnalysisResult } from '../../types/analysis.types'

/**
 * Returns a short lesson string for the trade journal.
 * Prioritises the most important learning point given the current analysis state.
 */
export function generateLesson(A: AnalysisResult): string {
  if (A.signal !== 'WAIT') {
    const kzNote = A.sess.inKZ ? 'Kill Zone confirms optimal institutional timing. ' : ''
    return `Score ${A.coreScore}/5${A.effectiveScore > A.coreScore ? ` (+${(A.effectiveScore - A.coreScore).toFixed(1)} STRONG macro bonus)` : ''} — all Apex criteria met. ${kzNote}Entry at OTE (impulse-anchored Fibonacci) maximises R:R. Partials: 50% at 1.5R, 30% at 3R, runner trailing.`
  }

  if (!A.cf_news) {
    return `Score ${A.coreScore}/5 — High-impact news within 30 minutes. News filter blocked entry to protect capital. Wait for event resolution before re-evaluating.`
  }

  if (!A.sess.inKZ) {
    return `Score ${A.coreScore}/5 — Outside Kill Zone. London (07–10 UTC) or NY (12–15 UTC) only. Patience during low-volume sessions is the edge. ICT: "The best trade is the one you don't take."`
  }

  if (!A.cf_macro) {
    return `Macro score ${A.macro.total} = NEUTRAL. Set macro factors in MACRO tab (+1 / 0 / -1 per factor). Both long AND short signals require macro score beyond ±2.`
  }

  const missing = [
    !A.cf_sweep  && 'liquidity sweep',
    !A.cf_mss    && 'MSS/BOS confirmation',
    !A.cf_ote    && 'OTE retracement',
    !A.cf_poi    && 'POI proximity',
  ].filter(Boolean).join(', ')

  return `Score ${A.coreScore}/5 — Missing: ${missing || 'no specific factor'}. Need ${A.coreScore >= 4 ? 'Kill Zone or news clearance' : '4/5 minimum'}. Each missing confluence layer reduces win probability significantly. Wait for full setup.`
}
