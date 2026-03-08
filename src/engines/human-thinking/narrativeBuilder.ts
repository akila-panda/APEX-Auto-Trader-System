// src/engines/human-thinking/narrativeBuilder.ts
/**
 * narrativeBuilder.ts
 * Builds a 3–4 sentence trade narrative from all analysis components.
 *
 * LLM-augmentation point: Replace the template string logic in buildNarrative()
 * with an async function that calls:
 *   await anthropic.messages.create({ model: 'claude-opus-4-6', ... })
 * The input/output interface (AnalysisResult → string) remains identical.
 * No other module needs to change.
 */

import type { AnalysisResult } from '../../types/analysis.types'
import type { DetectedPattern } from './patternRecognizer'

/**
 * Builds a concise 3–4 sentence trade narrative in the style of an ICT mentor.
 *
 * Future LLM swap: Replace this function body with an API call to Claude,
 * passing A as a structured context object. The function signature stays the same.
 */
export function buildNarrative(A: AnalysisResult, patterns: DetectedPattern[]): string {
  const dir  = A.bias.toUpperCase()
  const fmtP = (n: number | null | undefined) => n != null ? n.toFixed(5) : '—'

  const structSentence = A.struct.structure !== 'ranging'
    ? `${A.struct.structure === 'bullish' ? 'D1/4H structure is bullish (HH/HL confirmed via 3-bar pivot)' : 'D1/4H structure is bearish (LH/LL confirmed via 3-bar pivot)'}. `
    : 'HTF structure is ranging — trade in direction of macro bias only. '

  const sweepSentence = A.sweepR.swept
    ? `${A.sweepR.direction === 'bullish' ? 'Asian session low swept' : 'Asian session high swept'} at ${fmtP(A.sweepR.ssl)}, closing back inside range — ${A.sweepR.direction === 'bullish' ? 'sell-side' : 'buy-side'} liquidity cleared. `
    : 'No liquidity sweep yet — awaiting smart money to hunt stops before entry. '

  const bosSentence = (A.bosR.bos || A.bosR.choch)
    ? `On the ${A.tfId}, ${A.bosR.label.toLowerCase()} after displacement, price is retracing to the ${fmtP(A.ote.oteSweet)} OTE zone within the ${A.tfId} ${A.bias} OB. `
    : `${A.tfId} market structure has not yet confirmed a ${dir} break — monitor for BOS/ChoCH. `

  const patternSentence = patterns.length > 0
    ? `${patterns.map(p => p.name).join(' + ')} pattern${patterns.length > 1 ? 's' : ''} detected. `
    : ''

  const kzSentence = A.sess.inKZ
    ? `${A.sess.sessionName} window active — optimal entry timing. `
    : `Kill Zone opens at ${A.bias === 'bullish' ? '07:00 or 12:00' : '07:00 or 12:00'} UTC. `

  return `${structSentence}${sweepSentence}${bosSentence}${patternSentence}${kzSentence}Signal: ${A.signal} | Score: ${A.coreScore}/5 (effective: ${A.effectiveScore.toFixed(1)}).`
}
