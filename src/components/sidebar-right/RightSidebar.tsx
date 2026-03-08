// src/components/sidebar-right/RightSidebar.tsx
import { useState } from 'react'
import { useMarketStore } from '../../store/useMarketStore'
import { PriceLevelsPanel } from './PriceLevelsPanel'
import { TradePlanPanel } from './TradePlanPanel'
import { ConfluencePanel } from './ConfluencePanel'
import { SignalAnalysisPanel } from './SignalAnalysisPanel'
import { useMacroStore } from '../../store/useMacroStore'
import { useCalendar } from '../../hooks/useCalendar'
import { useSessionInfo } from '../../hooks/useSessionInfo'
import { analyzeFromCache } from '../../App'

export function RightSidebar() {
  const activeTF   = useMarketStore(s => s.activeTF)
  const tfAnalysis = useMarketStore(s => s.tfAnalysis)
  const setAnalysis = useMarketStore(s => s.setAnalysis)
  const addFeedItem = useMarketStore(s => s.addFeedItem)
  const refreshCandlesForTF = useMarketStore(s => s.refreshCandlesForTF)
  
  const macro = useMacroStore(s => s.computedResult())
  const { events } = useCalendar()
  const sess = useSessionInfo()

  const analysis = tfAnalysis[activeTF] ?? null
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      await refreshCandlesForTF(activeTF)
      const tfCandles = useMarketStore.getState().candles[activeTF] ?? []
      const price = useMarketStore.getState().currentPrice
      const result = analyzeFromCache(activeTF, tfCandles, price, macro, sess, events)
      
      setAnalysis(activeTF, result)
      addFeedItem({
        time: new Date().toISOString(),
        badge: 'ANALYSIS',
        msg: `${result.dataSource} ${activeTF}: ${result.signal} | ${result.coreScore}/5 (${result.effectiveScore.toFixed(1)} eff) | ${result.bias.toUpperCase()} [${result.macroStrength}]`,
      })
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  return (
    <div className="w-[280px] bg-deep border-l border-edge flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="h-[45px] px-4 border-b border-edge flex items-center justify-between shrink-0">
        <div className="font-ui font-bold text-[10px] tracking-[3px] text-muted uppercase">Analysis Panel</div>
        <button
          className={`h-[24px] px-3 rounded-[4px] font-mono text-[9px] font-bold tracking-[1px] transition-all duration-200 ${
            loading 
              ? 'bg-white/5 text-muted cursor-not-allowed' 
              : 'bg-aqua/10 text-aqua border border-aqua/30 hover:bg-aqua/20 active:scale-95'
          }`}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'ANALYZING...' : '▶ RE-SCAN'}
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
        <PriceLevelsPanel analysis={analysis} />
        <TradePlanPanel   analysis={analysis} />
        <ConfluencePanel  analysis={analysis} />
        <SignalAnalysisPanel analysis={analysis} />
      </div>
    </div>
  )
}
