// src/components/views/TradeTableView.tsx
import { useTradeStore } from '../../store/useTradeStore'
import type { Trade } from '../../types/trade.types'
import { useState, useMemo } from 'react'
import { fmtPnl } from '../../utils/priceFormat'

function computeStats(trades: Trade[]) {
  const n      = trades.length
  const wins   = trades.filter(t => t.status === 'WIN').length
  const losses = trades.filter(t => t.status === 'LOSS').length
  const wr     = n ? Math.round((wins / n) * 100) : 0
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const avgRM  = n ? parseFloat((trades.reduce((s, t) => s + t.rMultiple, 0) / n).toFixed(2)) : 0
  const gW = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0)
  const gL = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0))
  const pf = gL > 0 ? parseFloat((gW / gL).toFixed(2)) : null
  return { n, wins, losses, wr, netPnl, avgRM, pf }
}

type SortKey = keyof Trade | 'id_num'

export function TradeTableView() {
  const { trades, clearTrades } = useTradeStore()
  const { n, wins, losses, wr, netPnl, avgRM, pf } = computeStats(trades)
  
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let valA: any = a[sortKey as keyof Trade]
      let valB: any = b[sortKey as keyof Trade]

      if (sortKey === 'id_num') {
        valA = parseInt(a.id)
        valB = parseInt(b.id)
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [trades, sortKey, sortOrder])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const exportCSV = () => {
    if (!trades.length) return alert('No trades to export.')
    const headers = ['ID','Timestamp','Pair','TF','Direction','Entry','SL','TP1','TP2','Exit','Pips','PnL','R-Mult','Score','EffScore','Status','Session','MacroBias','MacroStrength','MacroScore','SignalSource','OutcomeType']
    const rows = trades.map(t => [
      t.id, t.timestamp, t.pair, t.tf, t.direction,
      t.entry, t.stopLoss, t.takeProfit1, t.takeProfit2, t.exitPrice,
      t.pips, t.pnl, t.rMultiple, t.confluenceScore, t.effectiveScore,
      t.status, t.session, t.macroBias, t.macroStrength, t.macroScore,
      t.signalSource, t.outcomeType,
    ].join(','))
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `APEX_v3_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const handleClear = () => {
    if (!confirm('Clear ALL trades? Cannot be undone.')) return
    clearTrades()
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-ink">
      {/* Header */}
      <div className="h-[50px] border-b border-edge px-4 flex items-center justify-between shrink-0">
        <div className="font-ui font-bold text-[10px] tracking-[3px] text-muted uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-aqua animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.4)]"></span>
          Trade Table
        </div>
        <div className="flex gap-4">
          <button 
            className="h-[26px] px-3 rounded-[4px] font-mono text-[9px] font-bold tracking-[1px] bg-white/5 text-muted border border-white/10 hover:bg-white/10 transition-all"
            onClick={exportCSV}
          >
            ⬇ EXPORT CSV
          </button>
          <button 
            className="h-[26px] px-3 rounded-[4px] font-mono text-[9px] font-bold tracking-[1px] bg-ruby/10 text-ruby border border-ruby/20 hover:bg-ruby/20 transition-all"
            onClick={handleClear}
          >
            ✕ CLEAR ALL
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="TOTAL TRADES" value={n} sub="All sessions" />
          <KPICard label="WIN RATE" value={n ? wr + '%' : '—'} sub="Target: 55–70%" color="text-jade" />
          <KPICard label="NET P&L" value={fmtPnl(netPnl)} sub="Simulated only" color={netPnl >= 0 ? 'text-jade' : 'text-ruby'} />
          <KPICard label="AVG R-MULT" value={n ? avgRM + 'R' : '—'} sub="Target: 1.5–2.5R" color="text-gold" />
          <KPICard label="PROFIT FACTOR" value={pf ?? '—'} sub="Target: ≥1.8" color="text-aqua" />
          <KPICard label="W/L RATIO" value={`${wins}:${losses}`} sub="Wins vs Losses" />
        </div>

        {/* Disclaimer */}
        <div className="bg-amber/5 border border-amber/10 rounded-lg p-3 flex gap-3 items-start">
          <span className="text-amber text-lg mt-0.5 leading-none">⚠</span>
          <div className="text-[10px] text-amber/80 leading-relaxed font-ui">
            <strong className="text-amber">SIMULATED OUTCOMES:</strong> Entries based on real live candle data (Twelve Data API).
            Trade outcomes (Win/Loss) are probability-weighted simulations — not real executions.
            KPIs shown have no statistical validity. Use for signal quality review only.
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.05]">
                  <SortableTh label="#" sortKey="id_num" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="DATE / TIME (UTC)" sortKey="timestamp" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="PAIR" sortKey="pair" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="TF" sortKey="tf" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="DIR" sortKey="direction" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <th className="p-3 text-[9px] text-muted font-bold tracking-widest uppercase">Entry</th>
                  <th className="p-3 text-[9px] text-muted font-bold tracking-widest uppercase">Stop Loss</th>
                  <th className="p-3 text-[9px] text-muted font-bold tracking-widest uppercase">Target 2</th>
                  <SortableTh label="EXIT" sortKey="exitPrice" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="PIPS" sortKey="pips" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="P&L $" sortKey="pnl" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="R-MULT" sortKey="rMultiple" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="SCORE" sortKey="effectiveScore" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <SortableTh label="STATUS" sortKey="status" activeKey={sortKey} order={sortOrder} onClick={toggleSort} />
                  <th className="p-3 text-[9px] text-muted font-bold tracking-widest uppercase">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {sortedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-12 text-center text-[10px] text-muted italic font-mono opacity-50">
                      No trades recorded yet. Start the Auto-Trader to begin monitoring signals.
                    </td>
                  </tr>
                ) : (
                  sortedTrades.map((t) => {
                    const isWin = t.status === 'WIN'
                    const isLoss = t.status === 'LOSS'
                    const stCls = isWin ? 'bg-jade/10 text-jade border-jade/20' : isLoss ? 'bg-ruby/10 text-ruby border-ruby/20' : 'bg-white/5 text-muted border-white/10'
                    
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group tabular-nums">
                        <td className="p-3 text-[10px] text-muted font-mono">{t.id}</td>
                        <td className="p-3 text-[10px] text-muted font-mono whitespace-nowrap">{t.timestamp}</td>
                        <td className="p-3 text-[10px] text-bright font-bold font-mono">{t.pair}</td>
                        <td className="p-3 text-[10px] text-aqua font-mono">{t.tf}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold ${t.direction === 'LONG' ? 'bg-jade/10 text-jade border border-jade/20' : 'bg-ruby/10 text-ruby border border-ruby/20'}`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-text font-mono font-bold">{t.entry.toFixed(5)}</td>
                        <td className="p-3 text-[10px] text-ruby font-mono">{t.stopLoss.toFixed(5)}</td>
                        <td className="p-3 text-[10px] text-jade font-mono">{t.takeProfit2.toFixed(5)}</td>
                        <td className="p-3 text-[10px] text-text font-mono font-bold">{t.exitPrice.toFixed(5)}</td>
                        <td className={`p-3 text-[10px] font-mono font-bold ${t.pips >= 0 ? 'text-jade' : 'text-ruby'}`}>
                          {t.pips >= 0 ? '+' : ''}{t.pips}p
                        </td>
                        <td className={`p-3 text-[10px] font-mono font-bold ${t.pnl >= 0 ? 'text-jade' : 'text-ruby'}`}>
                          {fmtPnl(t.pnl)}
                        </td>
                        <td className="p-3 text-[10px] text-gold font-mono font-bold">{t.rMultiple}R</td>
                        <td className="p-3 text-[10px] text-aqua font-mono font-bold">
                          {t.effectiveScore.toFixed(1)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-[3px] text-[8px] font-bold border ${stCls}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-muted font-mono uppercase truncate max-w-[80px]">
                          {t.session}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 hover:bg-white/[0.04] transition-colors group">
      <div className="text-[8px] text-muted font-bold tracking-widest uppercase mb-1 group-hover:text-aqua transition-colors">{label}</div>
      <div className={`text-lg font-bold tracking-tighter tabular-nums ${color ?? 'text-text'}`}>{value}</div>
      <div className="text-[8px] text-muted italic mt-1">{sub}</div>
    </div>
  )
}

interface SortableThProps {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  order: 'asc' | 'desc'
  onClick: (key: SortKey) => void
}

function SortableTh({ label, sortKey, activeKey, order, onClick }: SortableThProps) {
  const isActive = activeKey === sortKey
  return (
    <th 
      className={`p-3 text-[9px] font-bold tracking-widest uppercase cursor-pointer select-none transition-colors ${isActive ? 'text-aqua' : 'text-muted hover:text-text'}`}
      onClick={() => onClick(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`text-[8px] ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          {order === 'asc' ? '▲' : '▼'}
        </span>
      </div>
    </th>
  )
}
