/**
 * patternRecognizer.ts
 * Detects named ICT/SMC setups from combined analysis results.
 *
 * This module is LLM-augmentable: the detection logic is isolated here.
 * A future developer can swap the pattern descriptions to call an LLM API
 * without touching any other module.
 */

import type { AnalysisResult } from '../../types/analysis.types'
import { SILVER_BULLET_WINDOWS } from '../../config/trading.config'

export interface DetectedPattern {
  name:        string
  confidence:  number   // 0–1
  description: string
}

/**
 * Detects named ICT patterns from a full analysis result.
 * Returns all patterns whose conditions are met, with confidence scores.
 */
export function detectPatterns(A: AnalysisResult): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const h = A.sess.h
  const m = A.sess.m

  // Silver Bullet: Kill Zone + OB/FVG entry + MSS in direction, in specific UTC window
  const inSilverBulletWindow = SILVER_BULLET_WINDOWS.some(
    w => h >= w.start && h < w.end
  )
  if (inSilverBulletWindow && A.cf_mss && (A.bullOB || A.fvgBull || A.bearOB || A.fvgBear)) {
    const confidence = A.cf_ote ? 0.92 : 0.75
    patterns.push({
      name: 'Silver Bullet',
      confidence,
      description: `ICT Silver Bullet window active (${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} UTC). MSS confirmed with POI alignment. High-probability reversal setup.`,
    })
  }

  // Judas Swing: Asian range swept opposite to HTF bias just before Kill Zone
  if (
    A.sweepR.swept
    && A.sess.inKZ
    && A.sweepR.direction !== A.bias
    && A.asianRange.high != null
  ) {
    patterns.push({
      name: 'Judas Swing',
      confidence: 0.80,
      description: `Asian range ${A.sweepR.direction === 'bearish' ? 'high' : 'low'} swept (${A.sweepR.direction}) opposite to HTF ${A.bias} bias. Classic Judas Swing before ${A.bias} Kill Zone move.`,
    })
  }

  // IPDA Draw: Price moving toward closest liquidity pool (BSL or SSL)
  const price = A.entry
  const distToBSL = Math.abs(price - A.sweepR.bsl)
  const distToSSL = Math.abs(price - A.sweepR.ssl)
  const targetPool = distToBSL < distToSSL ? 'BSL' : 'SSL'
  const targetPrice = targetPool === 'BSL' ? A.sweepR.bsl : A.sweepR.ssl
  if (
    (A.bias === 'bullish' && targetPool === 'BSL') ||
    (A.bias === 'bearish' && targetPool === 'SSL')
  ) {
    patterns.push({
      name: 'IPDA Draw',
      confidence: 0.70,
      description: `Interbank Price Delivery Algorithm drawing toward ${targetPool} at ${targetPrice.toFixed(5)}. ${A.bias === 'bullish' ? 'Long' : 'Short'} bias aligns with IPDA liquidity draw.`,
    })
  }

  // Optimal Trade Entry: OTE zone + BOS matches macro + in Kill Zone
  if (A.cf_ote && A.cf_mss && A.sess.inKZ) {
    patterns.push({
      name: 'Optimal Trade Entry',
      confidence: 0.88,
      description: `Price in OTE zone [${A.ote.ote79?.toFixed(5) ?? '—'}–${A.ote.ote62?.toFixed(5) ?? '—'}] with BOS direction matching ${A.bias} macro, inside Kill Zone. Full ICT OTE setup confirmed.`,
    })
  }

  // Breaker Block: Failed OB (price traded fully through it) acting as opposing POI
  const bosOpposesOB = (A.bosR.direction === 'bullish' && A.bearOB != null)
    || (A.bosR.direction === 'bearish' && A.bullOB != null)
  if (bosOpposesOB && A.cf_mss) {
    patterns.push({
      name: 'Breaker Block',
      confidence: 0.65,
      description: `Prior OB fully mitigated — now acting as Breaker Block in ${A.bosR.direction === 'bullish' ? 'support' : 'resistance'} role. Structural shift realigns the POI.`,
    })
  }

  return patterns
}
