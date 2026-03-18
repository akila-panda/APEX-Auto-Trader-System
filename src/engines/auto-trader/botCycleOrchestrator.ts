// src/engines/auto-trader/botCycleOrchestrator.ts
/**
 * botCycleOrchestrator.ts
 * [FIX A-1] Main bot cycle with cycleRunning ref guard preventing concurrent execution.
 *
 * The cycle guard uses a ref (not React state) to avoid triggering re-renders.
 * The finally block ALWAYS releases the lock, even if the cycle throws.
 *
 * [FIX 2] BotCycleState now carries pipelineFinalScore (the weighted 0–17.5 score from
 * tradingPipeline). confidencePass uses this instead of best.effectiveScore, which was
 * on the old 0–5.5 scale and could never clear minScore=8 — permanently blocking every trade.
 */

import type { AnalysisResult } from '../../types/analysis.types'
import type { BotSettings } from '../../store/useBotStore'
import type { CooldownState } from '../signal/cooldownGuard'
import type { Trade } from '../../types/trade.types'
import { evaluateSignals } from '../signal/index'
import { checkDailyLimit }  from './dailyLimitGuard'
import { executeTrade }     from './tradeExecutor'
import { SYMBOL }           from '../../config/api.config'

export interface BotCycleState {
  settings:           BotSettings
  cooldown:           CooldownState
  tradesToday:        number
  lastTradeDate:      string
  nextTradeId:        number
  isNewsNearby:       boolean
  allResults:         AnalysisResult[]
  openTrades:         Trade[]
  /**
   * [FIX 2] Weighted confluence score (0–17.5) from tradingPipeline.finalScore.
   * Used for confidencePass instead of best.effectiveScore so both the pipeline
   * and the orchestrator operate on the same scoring scale.
   * Optional for backward compatibility — falls back to best.effectiveScore if absent,
   * though that path should not occur in normal operation.
   */
  pipelineFinalScore?: number
}

export interface BotCycleResult {
  trade:       Trade | null
  signalFound: boolean
  blocked:     boolean
  blockReason: string
}

/**
 * Runs one analysis cycle. The cycleRunning guard is managed by the caller
 * (useBotStore + useEffect) since it must be a ref, not React state.
 *
 * [FIX A-1] Always call cycleRunning = false in the caller's finally block.
 * [FIX 2]   Uses pipelineFinalScore for confidencePass when available.
 */
export async function runBotCycle(state: BotCycleState): Promise<BotCycleResult> {
  // Check daily limit
  const daily = checkDailyLimit(
    { tradesToday: state.tradesToday, lastTradeDate: state.lastTradeDate },
    state.settings.maxTradesPerDay,
  )

  if (!daily.allowed) {
    return { trade: null, signalFound: false, blocked: true, blockReason: 'Daily trade limit (UTC) reached.' }
  }

  let signalFound = false
  let blocked     = false
  let blockReason = ''

  const evalResult = evaluateSignals(
    state.allResults,
    state.settings,
    state.cooldown,
    state.isNewsNearby,
    () => { signalFound = true },
    () => { blocked = true },
  )

  blockReason = evalResult.blockReason

  if (!evalResult.best || evalResult.best.signal === 'WAIT') {
    return { trade: null, signalFound, blocked, blockReason }
  }

  const best = evalResult.best

  // [FIX 2] Use the pipeline's weighted score when available. The pipeline already validated
  // confluence at Stage 6 with the same minScore threshold, so this check is a safety net
  // rather than the primary gate. Using best.effectiveScore here was the bug: it came from
  // the legacy flat scorer (max 5.5) and could never clear minScore=8.
  const scoreToCheck    = state.pipelineFinalScore ?? best.effectiveScore
  const confidencePass  = scoreToCheck >= state.settings.minScore

  const structurePass =
    best.struct.structure !== 'ranging' &&
    ((best.signal === 'LONG'  && best.struct.structure === 'bullish') ||
     (best.signal === 'SHORT' && best.struct.structure === 'bearish'))
    || (best.bosR.bos && ((best.signal === 'LONG' && best.bosR.direction === 'bullish') ||
                          (best.signal === 'SHORT' && best.bosR.direction === 'bearish')))

  const pairKey = SYMBOL.replace('/', '')
  const conflictingOpen = state.openTrades.some(t =>
    t.status === 'OPEN' &&
    (t.pair.replace('/', '') === pairKey) &&
    (t.direction !== (best.signal as 'LONG' | 'SHORT'))
  )

  if (!confidencePass || !structurePass || conflictingOpen) {
    blocked = true
    blockReason = !confidencePass
      ? `Signal confidence below threshold (score: ${scoreToCheck.toFixed(1)}, min: ${state.settings.minScore}).`
      : !structurePass
      ? 'Market structure confirmation missing.'
      : 'Conflicting open position exists.'
    return { trade: null, signalFound, blocked, blockReason }
  }

  const trade = executeTrade(best, state.nextTradeId)
  return { trade, signalFound, blocked, blockReason }
}