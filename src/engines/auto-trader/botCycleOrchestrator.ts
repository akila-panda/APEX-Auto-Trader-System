// src/engines/auto-trader/botCycleOrchestrator.ts
/**
 * botCycleOrchestrator.ts
 * [FIX A-1] Main bot cycle with cycleRunning ref guard preventing concurrent execution.
 *
 * The cycle guard uses a ref (not React state) to avoid triggering re-renders.
 * The finally block ALWAYS releases the lock, even if the cycle throws.
 */

import type { AnalysisResult } from '../../types/analysis.types'
import type { BotSettings } from '../../store/useBotStore'
import type { CooldownState } from '../signal/cooldownGuard'
import type { Trade } from '../../types/trade.types'
import { evaluateSignals } from '../signal/index'
import { checkDailyLimit }  from './dailyLimitGuard'
import { executeTrade }     from './tradeExecutor'

export interface BotCycleState {
  settings:         BotSettings
  cooldown:         CooldownState
  tradesToday:      number
  lastTradeDate:    string
  nextTradeId:      number
  isNewsNearby:     boolean
  allResults:       AnalysisResult[]
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

  const trade = executeTrade(evalResult.best, state.nextTradeId)
  return { trade, signalFound, blocked, blockReason }
}
