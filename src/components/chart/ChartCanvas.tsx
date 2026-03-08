// src/components/chart/ChartCanvas.tsx
import { useRef, useEffect } from 'react'
import { useMarketStore } from '../../store/useMarketStore'
import { useMacroStore }  from '../../store/useMacroStore'
import { useChartDrawing } from '../../hooks/useChartDrawing'
import { useSessionInfo }  from '../../hooks/useSessionInfo'
import { TIMEFRAMES } from '../../config/timeframes.config'

export function ChartCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const currentPrice = useMarketStore(s => s.currentPrice)
  const activeTF     = useMarketStore(s => s.activeTF)
  const tfAnalysis   = useMarketStore(s => s.tfAnalysis)
  const setActiveTF  = useMarketStore(s => s.setActiveTF)
  const refreshCandlesForTF = useMarketStore(s => s.refreshCandlesForTF)
  const bias         = useMacroStore(s => s.computedBias())
  const strength     = useMacroStore(s => s.computedStrength())
  const sess         = useSessionInfo()
  const { scheduleDraw } = useChartDrawing(canvasRef)

  const analysis = tfAnalysis[activeTF]

  // Redraw when price, analysis or TF changes
  useEffect(() => { scheduleDraw(analysis) }, [currentPrice, analysis, scheduleDraw])

  const handleTFSwitch = async (tfId: string, label: string) => {
    setActiveTF(tfId, label)
    await refreshCandlesForTF(tfId)
  }

  const biasClass = bias === 'bullish' ? 'bg-jade/10 text-jade border-jade/30'
    : bias === 'bearish' ? 'bg-ruby/10 text-ruby border-ruby/30'
    : 'bg-gold/10 text-gold border-gold/30'

  const vol = sess.inKZ ? 'HIGH' : (sess.isLondon || sess.isNY) ? 'MED' : 'LOW'

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-void">
      {/* Chart topbar */}
      <div className="h-[40px] bg-void border-b border-edge flex items-center px-4 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[14px] font-bold text-white tracking-[2px]">EUR/USD</span>
          <span className="font-mono text-[9px] text-muted tracking-[1px] opacity-50">SPOT FX</span>
        </div>
        
        <span className={`font-mono text-[13px] font-bold transition-colors min-w-[70px] ${currentPrice > 0 ? (currentPrice >= (tfAnalysis[activeTF]?.entry ?? currentPrice) ? 'text-jade' : 'text-ruby') : 'text-muted'}`}>
          {currentPrice > 0 ? currentPrice.toFixed(5) : '——————'}
        </span>

        <div className="flex gap-[2px] ml-2">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              onClick={() => handleTFSwitch(tf.id, tf.label)}
              className={`px-[10px] py-1 border-none rounded-[3px] font-mono text-[8px] font-bold tracking-[1px] cursor-pointer transition-all ${
                activeTF === tf.id ? 'bg-aqua text-ink shadow-[0_0_8px_rgba(0,212,255,0.3)]' : 'bg-transparent text-muted hover:text-text hover:bg-white/[0.05]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className={`ml-auto font-mono text-[9px] font-bold px-3 py-1 rounded-[4px] border tracking-[2px] shadow-sm ${biasClass}`}>
          {bias === 'bullish' ? '▲' : bias === 'bearish' ? '▼' : '◈'} {bias.toUpperCase()} [{strength}]
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative group">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

        {/* MTF overlay */}
        <div className="absolute top-3 right-3 bg-ink/92 border border-edge rounded-[8px] px-[14px] py-3 min-w-[200px] backdrop-blur-md shadow-xl transition-opacity group-hover:opacity-100 opacity-90">
          <div className="font-mono text-[8px] text-aqua tracking-[3px] mb-[9px] font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua animate-pulse" />
            MULTI-TF SCAN
          </div>
          <div className="flex flex-col gap-0.5">
            {TIMEFRAMES.map(tf => {
              const A = tfAnalysis[tf.id]
              const sigClass = A?.signal === 'LONG' ? 'text-jade' : A?.signal === 'SHORT' ? 'text-ruby' : 'text-muted'
              const scoreColor = (A?.coreScore ?? 0) >= 4 ? 'text-jade' : (A?.coreScore ?? 0) >= 2 ? 'text-gold' : 'text-muted'
              return (
                <div key={tf.id} className="flex justify-between items-center py-[4px] border-b border-white/[0.04] last:border-0 font-mono text-[9px]">
                  <span className="text-muted w-[35px] font-bold">{tf.label}</span>
                  <span className={`font-bold tracking-[1px] ${sigClass}`}>{A?.signal ?? 'WAIT'}</span>
                  <span className={`text-[8px] font-bold ${scoreColor}`}>{A?.coreScore ?? 0}/5</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 bg-ink/90 border border-edge rounded-[6px] px-4 py-[10px] flex gap-6 backdrop-blur-md shadow-lg">
          {[
            { val: '1.2', lbl: 'SPREAD', col: 'var(--text)' },
            { val: vol, lbl: 'VOLATILITY', col: vol === 'HIGH' ? 'var(--jade)' : vol === 'MED' ? 'var(--gold)' : 'var(--muted)' },
            { val: `${analysis?.adr ?? '—'}p`, lbl: 'ADR (20)', col: 'var(--aqua)' },
            { val: sess.sessionName.replace(' 🎯', ''), lbl: 'MARKET', col: 'var(--text)' },
          ].map(s => (
            <div key={s.lbl} className="font-mono text-center min-w-[60px]">
              <div className="text-[11px] font-bold tracking-[1px]" style={{ color: s.col }}>{s.val}</div>
              <div className="text-[7px] text-muted mt-[3px] tracking-[1.5px] font-bold uppercase">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
