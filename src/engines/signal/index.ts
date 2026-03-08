// src/engines/signal/index.ts
/**
 * engines/signal/index.ts
 * Module contract:
 *   evaluateSignals(allResults, settings) → best signal or null
 *
 * [FIX A-3] totalSignals incremented only HERE after ALL filters pass
 * [FIX A-4] TF-weighted ranking
 * [FIX A-5] Cooldown guard
 */

import type { AnalysisResult } from '../../types/analysis.types'
import { rankSignals }   from './signalRanker'
import { checkCooldown } from './cooldownGuard'
import type { BotSettings } from '../../store/useBotStore'
import type { CooldownState } from './cooldownGuard'

export interface SignalEvalResult {
  best:        AnalysisResult | null
  blocked:     boolean
  blockReason: string
}

/**
 * Evaluates all timeframe analysis results and returns the highest-ranked valid signal.
 * Call this function exactly once per bot cycle — it manages signal counting via callback.
 */
export function evaluateSignals(
  allResults:    AnalysisResult[],
  settings:      BotSettings,
  cooldown:      CooldownState,
  isNewsNearby:  boolean,
  /** [FIX A-3] Caller provides the increment callback to avoid direct store import */
  onSignalFound: () => void,
  onBlocked:     () => void,
): SignalEvalResult {
  const signals = allResults.filter(a => a.signal !== 'WAIT')
  if (!signals.length) return { best: null, blocked: false, blockReason: '' }

  // [FIX A-3] Increment ONLY HERE, post-filter
  onSignalFound()

  // News filter
  if (settings.newsFilter && isNewsNearby) {
    onBlocked()
    return { best: null, blocked: true, blockReason: `⚠ High-impact news within 30 minutes — ${signals.length} signal(s) blocked.` }
  }

  // [FIX A-4] TF-weighted ranking
  const ranked = rankSignals(signals)
  const best   = ranked[0]

  if (!best || best.signal === 'WAIT') return { best: null, blocked: false, blockReason: '' }

  // [FIX A-5] Cooldown guard
  const cdResult = checkCooldown(cooldown, best.signal as 'LONG' | 'SHORT', settings.cooldownMins)
  if (cdResult.blocked) {
    onBlocked()
    return {
      best: null,
      blocked: true,
      blockReason: `${best.signal} blocked — cooldown active (${cdResult.remainMins}min remaining).`,
    }
  }

  return { best, blocked: false, blockReason: '' }
}
