// src/components/layout/StatusBar.tsx
import { useState, useEffect } from 'react'
import { useTradeStore }  from '../../store/useTradeStore'
import { useBotStore }    from '../../store/useBotStore'
import { useMacroStore }  from '../../store/useMacroStore'
import { useMarketStore } from '../../store/useMarketStore'
import { useSessionInfo } from '../../hooks/useSessionInfo'
import { useCalendar }    from '../../hooks/useCalendar'
import { fmtClock }       from '../../utils/dateTime'

import { RATE } from '../../api/rateLimit'

export function StatusBar() {
  const [clock, setClock]   = useState(fmtClock())
  const [apiMin, setApiMin]   = useState(0)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setClock(fmtClock())
      setApiMin(RATE.callsThisMin)
      setIsPending(RATE.pendingCalls > 0)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const trades              = useTradeStore(s => s.trades)
  const tradesToday         = useTradeStore(s => s.tradesToday)
  const maxTrades           = useBotStore(s => s.maxTradesPerDay)
  const coreScore           = useMarketStore(s => {
    const a = s.tfAnalysis[s.activeTF]; return a?.coreScore ?? 0
  })
  const macroStr            = useMacroStore(s => s.computedStrength())
  const bias                = useMacroStore(s => s.computedBias())
  const sess                = useSessionInfo()
  const { isNewsClear }     = useCalendar()

  const apiCalls            = useMarketStore(s => s.apiCallsToday)

  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock()), 1000)
    return () => clearInterval(id)
  }, [])

  const n      = trades.length
  const wins   = trades.filter(t => t.status === 'WIN').length
  const wr     = n ? Math.round(wins / n * 100) : null
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0)

  const biasColor = bias === 'bullish' ? 'text-jade' : bias === 'bearish' ? 'text-ruby' : 'text-gold'

  return (
    <footer className="h-[30px] bg-deep border-t border-edge flex items-center px-[18px] gap-5 flex-shrink-0">
      <SBItem label="SESSION">{sess.sessionName}</SBItem>
      <SBItem label="BIAS"><span className={biasColor}>{bias.toUpperCase()} [{macroStr}]</span></SBItem>
      <SBItem label="WIN RATE"><span className="text-jade">{wr != null ? `${wr}%` : '—'}</span></SBItem>
      <SBItem label="NET P&L"><span className={netPnl > 0 ? 'text-jade' : netPnl < 0 ? 'text-ruby' : 'text-text'}>{netPnl >= 0 ? '+' : ''}${Math.abs(netPnl).toFixed(2)}</span></SBItem>
      <SBItem label="TODAY">{tradesToday} / {maxTrades}</SBItem>
      <SBItem label="SCORE"><span className="text-aqua">{coreScore}/5</span></SBItem>
      <SBItem label="NEWS"><span className={isNewsClear ? 'text-jade' : 'text-ruby'}>{isNewsClear ? 'CLEAR' : '⚠ NEAR'}</span></SBItem>
      <SBItem label="API DAY"><span className="text-gold">{apiCalls}/800</span></SBItem>
      <SBItem label="API MIN">
        <span className={isPending ? 'text-ruby animate-pulse' : apiMin >= 7 ? 'text-gold' : 'text-aqua'}>
          {apiMin}/8{isPending ? ' (WAITING)' : ''}
        </span>
      </SBItem>
      <div className="ml-auto font-mono text-[9px] text-muted">{clock}</div>
    </footer>
  )
}

function SBItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="font-mono text-[8px] text-muted tracking-[0.5px]">
      {label} <span className="text-text">{children}</span>
    </div>
  )
}
