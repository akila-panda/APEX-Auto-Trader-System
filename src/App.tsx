// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Candle } from './types/candle.types'
import type { AnalysisResult, SessionInfo } from './types/analysis.types'
import type { MacroBiasResult } from './types/macro.types'
import type { CalendarEvent } from './engines/confluence/newsConfluence'

// Engines
import { detectMarketStructure } from './engines/market-structure/index'
import { detectOrderBlocks } from './engines/order-blocks/index'
import { detectFVG } from './engines/fair-value-gaps/index'
import { detectLiquidity } from './engines/liquidity/index'
import { detectBOS } from './engines/bos-choch/index'
import { calculateOTE } from './engines/ote/index'
import { evaluateConfluence } from './engines/confluence/index'
import { buildHumanThinking } from './engines/human-thinking/index'
import { calculateRisk } from './engines/risk/index'

import { generateSignal } from './engines/signal/signalGenerator'
// [FIX 1] Weighted scorer replaces legacy flat scorer in analyzeFromCache
import { scoreWeightedConfluence } from './engines/confluence/weightedConfluenceScorer'
// [FIX 7] ATR for market-adaptive stop loss sizing
import { calculateATR } from './engines/filters/signalFilters'

// Stores
import { useMarketStore } from './store/useMarketStore'
import { useMacroStore } from './store/useMacroStore'
import { useTradeStore } from './store/useTradeStore'
import { useBotStore } from './store/useBotStore'

// Hooks
import { useLivePrice } from './hooks/useLivePrice'
import { useSessionInfo } from './hooks/useSessionInfo'
import { useCalendar } from './hooks/useCalendar'

// Config
import { TIMEFRAMES } from './config/timeframes.config'
import { fetchCandles } from './api/twelveData'
import { isCacheFresh, generateFallbackCandles } from './api/candleCache'
import { runBotCycle } from './engines/auto-trader/index'
import { runTradingPipeline } from './engines/tradingPipeline'
import { patchMacroStore } from './engines/macro/macroBiasEngine'

// Components
import { TopBar } from './components/layout/TopBar'
import { StatusBar } from './components/layout/StatusBar'
import { ChartView } from './components/views/ChartView'
import { AutoTraderView } from './components/views/AutoTraderView'
import { TradeTableView } from './components/views/TradeTableView'
import { JournalView } from './components/views/JournalView'

import './index.css'

const queryClient = new QueryClient()

// [FIX 4] Store key for GBP/USD 1H candles used by SMT divergence engine.
const CORRELATED_TF_KEY = 'gbpusd_1h'

export type NavTab = 'chart' | 'robot' | 'trades' | 'journal'

/**
 * Pure analysis function — orchestrates all engines for one timeframe.
 * Exported for use in hooks and bot cycle.
 * No store access — all state passed as parameters.
 */
export function analyzeFromCache(
  tfId: string,
  candles: Candle[],
  currentPrice: number,
  macro: MacroBiasResult,
  sess: SessionInfo,
  events: CalendarEvent[],
): AnalysisResult {
  const price = currentPrice || (candles[candles.length - 1]?.close ?? 1.0842)
  const isLive = candles.length > 0 && !candles[0].simulated

  const struct = detectMarketStructure(candles, price)
  const obs = detectOrderBlocks(candles, price)
  const fvgs = detectFVG(candles)

  // Get sweep expiry from store for this TF
  const currentExpiry = useMarketStore.getState().sweepWindowExpiry[tfId] ?? null
  const liquidity = detectLiquidity(candles, struct, tfId, currentExpiry)

  // Update sweep expiry in store if changed
  if (liquidity.updatedExpiry !== currentExpiry) {
    useMarketStore.getState().setSweepWindow(tfId, liquidity.updatedExpiry)
  }

  const bosR = detectBOS(candles)
  const ote = calculateOTE(bosR, struct, price)

  // evaluateConfluence populates all cf_* boolean flags.
  // Its own effectiveScore uses the legacy flat scorer (max 5.5) — replaced below.
  const confluence = evaluateConfluence({
    macro, struct, obs, fvgs, sweepR: liquidity, bosR, ote, sess, events, currentPrice: price,
  })

  // [FIX 1] Overwrite effectiveScore with the weighted score (0–17.5) so generateSignal()
  // can clear minScore=8. SMT/SilverBullet bonuses are added later in the pipeline.
  const weighted = scoreWeightedConfluence({
    cf_macro: confluence.cf_macro,
    cf_htf: confluence.cf_htf,
    cf_sweep: confluence.cf_sweep,
    cf_mss: confluence.cf_mss,
    cf_ote: confluence.cf_ote,
    cf_poi: confluence.cf_poi,
    cf_kz: confluence.cf_kz,
    strength: macro.strength,
    smtDivergence: undefined,
    tradeDirection: undefined,
    inSilverBullet: undefined,
  })
  const confluenceFinal = {
    ...confluence,
    effectiveScore: weighted.effectiveScore,
    coreScore: weighted.coreScore,
    macroBonus: weighted.macroBonus,
  }

  const signal = generateSignal(
    confluenceFinal.effectiveScore,
    macro.bias,
    confluenceFinal.cf_kz,
    confluenceFinal.cf_news,
    {
      minScore: useBotStore.getState().minScore,
      kzOnly: useBotStore.getState().kzOnly,
      macroFilter: useBotStore.getState().macroFilter,
      newsFilter: useBotStore.getState().newsFilter,
    },
  )

  const entry = (ote.inOTE && ote.oteSweet) ? ote.oteSweet : price
  // [FIX 7] ATR-scaled SL. Returns 0 on insufficient candles — treated as absent.
  const atrPips = calculateATR(candles)
  const risk = calculateRisk(
    signal !== 'WAIT' ? signal as 'LONG' | 'SHORT' : 'LONG',
    entry,
    atrPips > 0 ? atrPips : undefined,
  )

  const last5 = candles.slice(-5)
  const adr = last5.length
    ? Math.round(last5.reduce((s, c) => s + (c.high - c.low), 0) / last5.length / 0.0001)
    : 0

  const sessLabel = sess.inKZ
    ? (sess.inLondonKZ ? 'London KZ' : 'NY KZ')
    : sess.sessionName

  // Build a temporary result to pass to human thinking engine
  const tempResult: AnalysisResult = {
    tfId, signal, entry, isLive, adr, sessLabel, sess, macro,
    bias: macro.bias, macroStrength: macro.strength,
    ...confluenceFinal,
    struct, obs, fvgs, sweepR: liquidity, bosR, ote, risk,
    equilibrium: struct.equilibrium,
    bullOB: obs.bullOB, bearOB: obs.bearOB,
    fvgBull: fvgs.fvgBull, fvgBear: fvgs.fvgBear,
    displacementHigh: bosR.displacementHigh, displacementLow: bosR.displacementLow,
    impulseHigh: bosR.impulseHigh, impulseLow: bosR.impulseLow,
    asianRange: liquidity.asianRange,
    bosLabel: bosR.label, sweepLabel: liquidity.label,
    zoneLabel: struct.inDiscount ? 'DISCOUNT ZONE ✓' : struct.inPremium ? 'PREMIUM ZONE ✓' : 'MID-RANGE',
    dataSource: isLive ? '✓ LIVE DATA' : '⚠ SIMULATED DATA',
    analysisText: '', lessonText: '',
    timestamp: Date.now(),
  }

  const thinking = buildHumanThinking(tempResult)

  return {
    ...tempResult,
    analysisText: thinking.narrative,
    lessonText: thinking.lesson,
  }
}

declare global {
  interface Window {
    APEX_INITIALIZED?: boolean
  }
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<NavTab>('chart')

  const setCandles = useMarketStore(s => s.setCandles)
  const setAnalysis = useMarketStore(s => s.setAnalysis)
  const candleFetchedAt = useMarketStore(s => s.candleFetchedAt)
  const candles = useMarketStore(s => s.candles)
  const currentPrice = useMarketStore(s => s.currentPrice)

  const macro = useMacroStore(s => s.computedResult())
  const sess = useSessionInfo()
  const { events, isNewsClear } = useCalendar()

  const loadTrades = useTradeStore(s => s.loadPersisted)
  const addTrade = useTradeStore(s => s.addTrade)
  const nextTradeId = useTradeStore(s => s.nextTradeId)
  const tradesToday = useTradeStore(s => s.tradesToday)
  const lastTradeDate = useTradeStore(s => s.lastTradeDate)
  const resetToday = useTradeStore(s => s.resetTodayIfNeeded)

  const botRunning = useBotStore(s => s.running)
  const botSettings = useBotStore(s => ({
    scanIntervalMs: s.scanIntervalMs,
    minScore: s.minScore,
    maxTradesPerDay: s.maxTradesPerDay,
    cooldownMins: s.cooldownMins,
    kzOnly: s.kzOnly,
    macroFilter: s.macroFilter,
    newsFilter: s.newsFilter,
  }))
  const setCycleRunning = useBotStore(s => s.setCycleRunning)
  const incrementScans = useBotStore(s => s.incrementScans)
  const incrementSignals = useBotStore(s => s.incrementSignals)
  const incrementBlocked = useBotStore(s => s.incrementBlocked)
  const setActiveSignals = useBotStore(s => s.setActiveSignals)
  const setLastTrade = useBotStore(s => s.setLastTrade)
  const lastTradeTime = useBotStore(s => s.lastTradeTime)
  const lastTradeDir = useBotStore(s => s.lastTradeDirection)

  const cycleRunningRef = useRef(false)  // [FIX A-1] ref, not state

  useLivePrice()

  // Persist + load trades on mount
  useEffect(() => { loadTrades() }, [loadTrades])

  // Initial candle fetch for all TFs [FIX R-2: staggered & serial to avoid initial rate limit]
  useEffect(() => {
    const fetchAll = async () => {
      // Use a lock to prevent multiple initializations if effect runs twice in dev
      if (window.APEX_INITIALIZED) return
      window.APEX_INITIALIZED = true

      console.log('[App] Starting initial multi-TF fetch...')
      for (const tf of TIMEFRAMES) {
        if (isCacheFresh(tf.id, candleFetchedAt)) continue

        // Staggered delay to avoid hitting the 8/min limit instantly
        // waitIfRateLimited() will handle the actual blocking if we go over 8
        const c = await fetchCandles(tf.id, 80)

        if (c && c.length > 0) {
          setCandles(tf.id, c)
          console.log(`[App] Loaded ${tf.label} data.`)
        } else {
          setCandles(tf.id, generateFallbackCandles(tf.id, 80))
          console.warn(`[App] Falling back for ${tf.label}.`)
        }

        // Small delay between successful requests
        await new Promise(r => setTimeout(r, 800))
      }

      // [FIX 4] Fetch GBP/USD 1H for SMT divergence after the main TF loop.
      if (!isCacheFresh(CORRELATED_TF_KEY, candleFetchedAt)) {
        await new Promise(r => setTimeout(r, 800))
        const gbp = await fetchCandles('1h', 80, 'GBP/USD')
        if (gbp && gbp.length > 0) {
          setCandles(CORRELATED_TF_KEY, gbp)
          console.log('[App] Loaded GBP/USD 1H for SMT divergence.')
        } else {
          console.warn('[App] GBP/USD 1H fetch failed — SMT divergence skipped.')
        }
      }

      console.log('[App] Initial fetch complete.')
    }
    fetchAll().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-run analysis when price or candles change
  useEffect(() => {
    for (const tf of TIMEFRAMES) {
      const tfCandles = candles[tf.id]
      if (!tfCandles || tfCandles.length === 0) continue
      const result = analyzeFromCache(tf.id, tfCandles, currentPrice, macro, sess, events)
      setAnalysis(tf.id, result)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice, candles])

  // Bot cycle [FIX A-1]
  useEffect(() => {
    if (!botRunning) return

    const runCycle = async () => {
      if (cycleRunningRef.current) return  // [FIX A-1] guard
      cycleRunningRef.current = true
      setCycleRunning(true)

      try {
        incrementScans()


        // [FIX 3] Skip cycle if HTF candles aren't loaded yet — prevents macro engine
        // silently returning neutral on every cold-start cycle.
        const earlyState = useMarketStore.getState()
        const dailyCandlesRd = earlyState.candles['1day'] ?? []
        const h4CandlesRd = earlyState.candles['4h'] ?? []
        if (dailyCandlesRd.length < 6 || h4CandlesRd.length < 6) {
          console.warn('[Bot] HTF candles not ready — skipping cycle.',
            'Daily:', dailyCandlesRd.length, '4H:', h4CandlesRd.length)
          return
        }


        // Refresh stale candles
        for (const tf of TIMEFRAMES) {
          if (!isCacheFresh(tf.id, useMarketStore.getState().candleFetchedAt)) {
            await new Promise(r => setTimeout(r, 500))
            const c = await fetchCandles(tf.id, 80)
            if (c && c.length > 0) setCandles(tf.id, c)
          }
        }

        const allResults = TIMEFRAMES.map(tf => {
          const tfCandles = useMarketStore.getState().candles[tf.id] ?? generateFallbackCandles(tf.id, 80)
          return analyzeFromCache(tf.id, tfCandles, useMarketStore.getState().currentPrice, macro, sess, events)
        })

        allResults.forEach(r => setAnalysis(r.tfId, r))
        setActiveSignals(allResults.filter(r => r.signal !== 'WAIT'))

        const today = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}-${new Date().getUTCDate()}`
        resetToday(today)

        // ── APEX2 Pipeline — runs BEFORE runBotCycle() ──────────────────
        // As per integration guide Step 2. We evaluate against the best
        // available TF result (highest weighted score, non-WAIT signal).
        const bestResult = allResults
          .filter(r => r.signal !== 'WAIT')
          .sort((a, b) => b.effectiveScore - a.effectiveScore)[0] ?? null

        // [FIX 3] Log and skip instead of silently falling through to runBotCycle.
        if (!bestResult) {
          console.debug('[Bot] No non-WAIT signals this cycle — weighted threshold not met.')
          return
        }
        let pipelineFinalScore = 0  // [FIX 2] hoisted so runBotCycle can read it below

        {
          const marketState = useMarketStore.getState()
          const macroState = useMacroStore.getState()
          const dailyCandles = marketState.candles['1day'] ?? []
          const h4Candles = marketState.candles['4h'] ?? []
          const tfCandles = marketState.candles[bestResult.tfId] ?? []

          // [FIX 4] GBP/USD candles for SMT divergence bonus (+2 when aligned).
          const correlatedCandles = marketState.candles[CORRELATED_TF_KEY] ?? []
          const hasSMT = correlatedCandles.length > 10

          const pipelineResult = runTradingPipeline({
            analysis: bestResult,
            candles: tfCandles,
            dailyCandles,
            h4Candles,
            correlatedCandles: hasSMT ? correlatedCandles : undefined,
            correlatedSymbol: hasSMT ? 'GBPUSD' : undefined,
            symbol: 'EURUSD',
            spreadPips: 0.8,
            entryPrice: marketState.currentPrice,
            stopLoss: bestResult.risk.sl,
            takeProfit: bestResult.risk.tp1,
            manualMacro: {
              bias: macroState.computedBias(),
              strength: macroState.computedStrength(),
              locked: macroState.locked,
            },
            minWeightedScore: botSettings.minScore,
          })

          console.log(
            `[Pipeline] ${pipelineResult.approved ? '✅ APPROVED' : '❌ BLOCKED'}: ` +
            `${pipelineResult.rejectedReason || pipelineResult.qualityLabel}`
          )
          console.log(
            `[Pipeline] Score: ${pipelineResult.finalScore} | ` +
            `Setup: ${pipelineResult.strategy?.setup?.type ?? 'none'} | ` +
            `Session: ${pipelineResult.session?.sessionLabel}`
          )

          if (!pipelineResult.approved) {
            // Pipeline blocked — log to feed and skip this cycle
            useMarketStore.getState().addFeedItem({
              time: new Date().toISOString(),
              badge: 'WARN',
              cls: 'fb-scan',
              msg: `[${pipelineResult.rejectedBy}] ${pipelineResult.rejectedReason}`,
            })
            return
          }

          // Auto-update macro store from engine result if not manually locked
          if (pipelineResult.macro.source === 'engine') {
            patchMacroStore(pipelineResult.macro, macroState.setFactor)
          }
          pipelineFinalScore = pipelineResult.finalScore  // [FIX 2] hoist out of block
        }
        // ── End APEX2 Pipeline ───────────────────────────────────────────

        const result = await runBotCycle({
          settings: botSettings,
          cooldown: { lastTradeTime, lastTradeDirection: lastTradeDir },
          tradesToday,
          lastTradeDate,
          nextTradeId,
          isNewsNearby: !isNewsClear,
          allResults,
          openTrades: useTradeStore.getState().trades.filter(t => t.status === 'OPEN'),
          pipelineFinalScore,  // [FIX 2] — now reads from hoisted let
        })

        if (result.signalFound) incrementSignals()  // [FIX A-3]
        if (result.blocked) incrementBlocked()

        if (result.trade) {
          addTrade(result.trade)
          setLastTrade(Date.now(), result.trade.direction)
        }
      } catch (err) {
        console.error('Bot cycle error:', err)
      } finally {
        cycleRunningRef.current = false  // [FIX A-1] always release
        setCycleRunning(false)
      }
    }

    runCycle()
    const interval = setInterval(runCycle, botSettings.scanIntervalMs)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botRunning, botSettings.scanIntervalMs])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-ink text-text font-ui text-xs">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chart' && <ChartView />}
        {activeTab === 'robot' && <AutoTraderView />}
        {activeTab === 'trades' && <TradeTableView />}
        {activeTab === 'journal' && <JournalView />}
      </main>
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
