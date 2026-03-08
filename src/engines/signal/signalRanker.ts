/**
 * signalRanker.ts
 * [FIX A-4] Ranks signals by effective score + Kill Zone bonus + TF weight.
 *
 * Sort formula:
 *   rank = effectiveScore + (inKZ ? 0.5 : 0) + (TF_WEIGHT[tfId] * 0.1)
 *
 * Daily (weight 6) preferred over 5m (weight 1) on score ties.
 */

import type { AnalysisResult } from '../../types/analysis.types'
import { TF_WEIGHT } from '../../config/trading.config'

/**
 * Ranks an array of signal results highest-first using the FIX A-4 formula.
 * Returns a new sorted array — does not mutate the input.
 */
export function rankSignals(signals: AnalysisResult[]): AnalysisResult[] {
  return [...signals].sort((a, b) => {
    const wA = TF_WEIGHT[a.tfId] ?? 1
    const wB = TF_WEIGHT[b.tfId] ?? 1
    const rankA = a.effectiveScore + (a.cf_kz ? 0.5 : 0) + wA * 0.1
    const rankB = b.effectiveScore + (b.cf_kz ? 0.5 : 0) + wB * 0.1
    return rankB - rankA
  })
}
