/**
 * tradingPipeline.ts
 * APEX2 Trading Pipeline Orchestrator
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        APEX2 PIPELINE FLOW                              │
 * │                                                                         │
 * │  Market Data (useMarketStore)                                           │
 * │       ↓                                                                 │
 * │  Session Engine       → phase, killzone, silverBullet, asiaRange        │
 * │       ↓                                                                 │
 * │  Macro Bias Engine    → auto bias from Daily + 4H structure             │
 * │       ↓  (manual override respected if locked)                          │
 * │  SMT Divergence       → intermarket confirmation (optional)             │
 * │       ↓                                                                 │
 * │  Existing Indicator Engines (market-structure, bos-choch, liquidity,   │
 * │   order-blocks, fvg, ote) → AnalysisResult per TF                      │
 * │       ↓                                                                 │
 * │  Strategy Engine      → ICT setup detection (gatekeeper)                │
 * │       ↓  (returns null if no valid setup → pipeline stops)              │
 * │  Signal Filters       → spread, volatility, RR validation               │
 * │       ↓  (rejects on bad conditions → pipeline stops)                   │
 * │  Weighted Confluence  → weighted score with SMT + Silver Bullet bonuses │
 * │       ↓  (rejects if score < threshold)                                 │
 * │  Signal Engine        → existing signalGenerator + signalRanker         │
 * │       ↓                                                                 │
 * │  Risk Engine          → existing SL/TP/lot calculators                  │
 * │       ↓                                                                 │
 * │  botCycleOrchestrator → existing execution path → MT5 EA               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Integration note:
 *   This pipeline runs BEFORE botCycleOrchestrator.runBotCycle().
 *   Call it in the bot cycle useEffect in App.tsx, passing:
 *     stopLoss:   analysis.risk.sl    ← NOTE: NOT analysis.sl (field is risk.sl)
 *     takeProfit: analysis.risk.tp1   ← NOTE: NOT analysis.tp1 (field is risk.tp1)
 *   [BUG #3 FIX] The integration guide had wrong field paths (analysis.sl / analysis.tp1).
 *   Correct paths: analysis.risk.sl and analysis.risk.tp1.
 */

import type { Candle }          from '../types/candle.types'
import type { AnalysisResult }  from '../types/analysis.types'
import type { MacroBiasResult } from '../types/macro.types'

import { runSessionEngine }      from './session/sessionEngine'
import { runMacroBiasEngine }    from './macro/macroBiasEngine'
import { detectSMTDivergence }   from './smt/smtDivergenceEngine'
import { runStrategyEngine }     from './strategy/ictStrategyEngine'
import { runAllFilters }         from './filters/signalFilters'
import {
  scoreWeightedConfluence,
  getScoreQualityLabel,
}                                from './confluence/weightedConfluenceScorer'

import type { SessionEngineResult }   from './session/sessionEngine'
import type { MacroEngineResult }     from './macro/macroBiasEngine'
import type { SMTDivergenceResult }   from './smt/smtDivergenceEngine'
import type { StrategyEngineResult }  from './strategy/ictStrategyEngine'
import type { CombinedFilterResult }  from './filters/signalFilters'
import type { WeightedScorerResult }  from './confluence/weightedConfluenceScorer'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradingPipelineInput {
  /** The AnalysisResult for the timeframe being evaluated (from existing engines) */
  analysis:       AnalysisResult

  /** Candles for current TF */
  candles:        Candle[]
  /** Candles for Daily TF (for macro bias engine) */
  dailyCandles:   Candle[]
  /** Candles for 4H TF (for macro bias engine) */
  h4Candles:      Candle[]

  /** Optional: candles for correlated pair (for SMT divergence) */
  correlatedCandles?: Candle[]
  /** Label for primary pair (e.g. 'EURUSD') */
  symbol:          string
  /** Label for correlated pair (e.g. 'GBPUSD') — optional */
  correlatedSymbol?: string

  /** Live spread in pips (from your broker feed or simulated) */
  spreadPips:      number

  /** Entry price (usually currentPrice) */
  entryPrice:      number
  /**
   * Stop loss price.
   * [BUG #3 FIX] Use analysis.risk.sl — NOT analysis.sl (that field doesn't exist).
   */
  stopLoss:        number
  /**
   * Take profit price.
   * [BUG #3 FIX] Use analysis.risk.tp1 — NOT analysis.tp1 (that field doesn't exist).
   */
  takeProfit:      number

  /**
   * Manual macro override (from useMacroStore).
   * [BUG #5 FIX] Now includes strength so macroBiasEngine doesn't hardcode 'STRONG'.
   */
  manualMacro?: {
    bias:     MacroBiasResult['bias']
    strength: MacroBiasResult['strength']
    locked:   boolean
  }

  /** Minimum weighted confluence score to approve (default 8) */
  minWeightedScore?: number

  /** Current UTC time (for session engine — defaults to now) */
  now?: Date
}

export interface TradingPipelineResult {
  /** True if all engines approved this trade — proceed to botCycleOrchestrator */
  approved:       boolean
  /** Which stage rejected (empty string if approved) */
  rejectedBy:     string
  rejectedReason: string

  /** Results from each engine stage */
  session:    SessionEngineResult
  macro:      MacroEngineResult
  smt:        SMTDivergenceResult
  strategy:   StrategyEngineResult
  filters:    CombinedFilterResult
  confluence: WeightedScorerResult

  /** Final weighted score */
  finalScore:       number
  /** Quality label for UI */
  qualityLabel:     string
  /** The direction this pipeline approved (or null if rejected) */
  approvedDirection: 'LONG' | 'SHORT' | null
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

const PIPELINE_REJECT = (
  stage: string,
  reason: string,
  partials: Partial<TradingPipelineResult>,
): TradingPipelineResult => ({
  approved:          false,
  rejectedBy:        stage,
  rejectedReason:    reason,
  session:           partials.session!,
  macro:             partials.macro    ?? {} as MacroEngineResult,
  smt:               partials.smt      ?? { divergence: 'NONE', confirmed: false, pairA_label: '', pairB_label: '', description: '', divergenceLevel: null, confirmLevel: null },
  strategy:          partials.strategy ?? { setup: null, allSetups: {} as Record<import('./strategy/ictStrategyEngine').SetupType, import('./strategy/ictStrategyEngine').SetupResult>, hasValidSetup: false, direction: null, bias: 'neutral' },
  filters:           partials.filters  ?? {} as CombinedFilterResult,
  confluence:        partials.confluence ?? {} as WeightedScorerResult,
  finalScore:        0,
  qualityLabel:      '❌ Rejected',
  approvedDirection: null,
})

/**
 * Runs the full APEX2 trading pipeline for a single timeframe's analysis result.
 *
 * @returns TradingPipelineResult — check `.approved` before proceeding to execution.
 */
export function runTradingPipeline(input: TradingPipelineInput): TradingPipelineResult {
  const minScore = input.minWeightedScore ?? 8

  // ── Stage 1: Session Engine ──────────────────────────────────────────────
  const session = runSessionEngine(input.candles, input.now)

  // Dead zone — no trading outside session hours
  if (session.phase === 'DEAD_ZONE' || session.isWeekend) {
    return PIPELINE_REJECT('SESSION', `${session.isWeekend ? 'Weekend' : 'Dead zone'} — no trading (${session.sessionLabel})`, { session })
  }

  // ── Stage 2: Macro Bias Engine ───────────────────────────────────────────
  const macro = runMacroBiasEngine({
    dailyCandles:   input.dailyCandles,
    h4Candles:      input.h4Candles,
    manualOverride: input.manualMacro,   // includes strength now (BUG #5 FIX)
  })

  if (macro.bias === 'neutral') {
    return PIPELINE_REJECT('MACRO', `Macro neutral — Daily: ${macro.dailyStructure}, 4H: ${macro.h4Structure}`, { session, macro })
  }

  // ── Stage 3: SMT Divergence (Optional Enhancement) ───────────────────────
  let smt: SMTDivergenceResult = {
    divergence: 'NONE', confirmed: false,
    pairA_label: input.symbol, pairB_label: input.correlatedSymbol ?? '',
    description: 'No correlated pair provided', divergenceLevel: null, confirmLevel: null,
  }

  if (input.correlatedCandles && input.correlatedCandles.length > 10) {
    smt = detectSMTDivergence(
      input.candles,
      input.correlatedCandles,
      input.symbol,
      input.correlatedSymbol ?? 'Correlated',
    )
  }

  // ── Stage 4: Strategy Engine (Gatekeeper) ───────────────────────────────
  const strategy = runStrategyEngine({
    analysis: input.analysis,
    session,
    macro,
    smt,
  })

  if (!strategy.hasValidSetup) {
    return PIPELINE_REJECT('STRATEGY', 'No valid ICT setup detected on current candles', { session, macro, smt, strategy })
  }

  // ── Stage 5: Signal Filters ──────────────────────────────────────────────
  const filters = runAllFilters({
    spreadPips: input.spreadPips,
    candles:    input.candles,
    symbol:     input.symbol,
    entry:      input.entryPrice,
    stopLoss:   input.stopLoss,
    takeProfit: input.takeProfit,
  })

  if (!filters.passed) {
    const blockedList = filters.blockedBy.join(', ')
    const reasons = [
      !filters.spread.passed     ? filters.spread.reason     : '',
      !filters.volatility.passed ? filters.volatility.reason : '',
      !filters.rr.passed         ? filters.rr.reason         : '',
    ].filter(Boolean).join(' | ')
    return PIPELINE_REJECT('FILTERS', `Blocked by: ${blockedList} — ${reasons}`, { session, macro, smt, strategy, filters })
  }

  // ── Stage 6: Weighted Confluence ─────────────────────────────────────────
  const direction  = strategy.direction!
  const r          = input.analysis

  const confluence = scoreWeightedConfluence({
    cf_macro:       r.cf_macro,
    cf_htf:         r.cf_htf,
    cf_sweep:       r.cf_sweep,
    cf_mss:         r.cf_mss,
    cf_ote:         r.cf_ote,
    cf_poi:         r.cf_poi,
    cf_kz:          r.cf_kz,
    strength:       macro.strength,
    smtDivergence:  smt.divergence,
    tradeDirection: direction,
    inSilverBullet: session.inSilverBullet,
  })

  if (confluence.effectiveScore < minScore) {
    return PIPELINE_REJECT(
      'CONFLUENCE',
      `Weighted score ${confluence.effectiveScore.toFixed(1)} < minimum ${minScore} — active: [${confluence.activeFactors.join(', ')}]`,
      { session, macro, smt, strategy, filters, confluence },
    )
  }

  // ── All stages passed ────────────────────────────────────────────────────
  return {
    approved:          true,
    rejectedBy:        '',
    rejectedReason:    '',
    session,
    macro,
    smt,
    strategy,
    filters,
    confluence,
    finalScore:        confluence.effectiveScore,
    qualityLabel:      getScoreQualityLabel(confluence.effectiveScore),
    approvedDirection: direction,
  }
}
