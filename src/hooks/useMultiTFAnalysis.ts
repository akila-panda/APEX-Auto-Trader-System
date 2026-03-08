/**
 * useMultiTFAnalysis.ts
 * Runs full analysis across all 6 timeframes reactively from cached candle data.
 */

import { useCallback } from 'react'
import { useMarketStore } from '../store/useMarketStore'
import { useMacroStore }  from '../store/useMacroStore'
import { useCalendar }    from './useCalendar'
import { useSessionInfo } from './useSessionInfo'
import { TIMEFRAMES }     from '../config/timeframes.config'
import { analyzeFromCache } from '../App'
import type { AnalysisResult } from '../types/analysis.types'

export function useMultiTFAnalysis() {
  const candles      = useMarketStore(s => s.candles)
  const currentPrice = useMarketStore(s => s.currentPrice)
  const tfAnalysis   = useMarketStore(s => s.tfAnalysis)
  const macro        = useMacroStore(s => s.computedResult())
  const { events }   = useCalendar()
  const sess         = useSessionInfo()

  const runAnalysis = useCallback((): AnalysisResult[] => {
    return TIMEFRAMES.map(tf => {
      const tfCandles = candles[tf.id] ?? []
      return analyzeFromCache(tf.id, tfCandles, currentPrice, macro, sess, events)
    })
  }, [candles, currentPrice, macro, sess, events])

  return { tfAnalysis, runAnalysis }
}
