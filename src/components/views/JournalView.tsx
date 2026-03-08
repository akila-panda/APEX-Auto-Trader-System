import { useTradeStore } from '../../store/useTradeStore'
import type { Trade } from '../../types/trade.types'
import { useState, useMemo } from 'react'

function JournalCard({ trade: t }: { trade: Trade }) {
  const [open, setOpen] = useState(false)
  const pnlColor = t.pnl > 0 ? 'text-jade' : t.pnl < 0 ? 'text-ruby' : 'text-gold'
  const stCls = t.status === 'WIN' ? 'bg-jade/10 text-jade border-jade/20' : t.status === 'LOSS' ? 'bg-ruby/10 text-ruby border-ruby/20' : 'bg-white/5 text-muted border-white/10'

  const cfValues = Object.values(t.confluences)

  return (
    <div className={`transition-all duration-300 border border-white/[0.05] rounded-xl overflow-hidden ${open ? 'bg-black/40 shadow-2xl ring-1 ring-aqua/20' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}>
      <div className="cursor-pointer p-4 flex items-center gap-4 select-none" onClick={() => setOpen(o => !o)}>
        <div className="text-[10px] text-muted font-mono w-6 opacity-50">#{t.id}</div>
        <div className={`px-2 py-0.5 rounded-[3px] text-[9px] font-bold tracking-wider border ${t.direction === 'LONG' ? 'bg-jade/10 text-jade border-jade/20' : 'bg-ruby/10 text-ruby border-ruby/20'}`}>
          {t.direction}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-bright font-bold text-[12px] tracking-tight">{t.pair} <span className="text-muted font-normal text-[10px] opacity-60">· {t.tf}</span></div>
          <div className="text-[9px] text-muted font-mono opacity-50">{t.timestamp}</div>
        </div>
        <div className="hidden md:flex flex-col items-end mr-4">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-40">Score</span>
          <div className="font-mono text-[11px] font-bold text-aqua">{t.effectiveScore.toFixed(1)}/5.5</div>
        </div>
        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-40">PnL</span>
          <div className={`font-mono text-[12px] font-bold ${pnlColor}`}>
            {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-[3px] text-[8px] font-bold border ${stCls}`}>{t.status}</div>
        <div className={`text-muted text-[10px] transition-transform duration-300 ml-2 ${open ? 'rotate-90 text-aqua' : ''}`}>▶</div>
      </div>

      {open && (
        <div className="p-5 pt-0 border-t border-white/[0.05] animate-fade-in">
          {/* Signal source disclaimer */}
          <div className="bg-aqua/[0.03] border border-aqua/10 rounded-lg p-3 my-4 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-50">Source</span>
              <span className="text-[10px] font-mono text-aqua/80">{t.signalSource ?? 'AI ENGINE'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-50">Outcome</span>
              <span className="text-[10px] font-mono text-bright">{t.outcomeType ?? 'SIMULATED'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-50">Macro Bias</span>
              <span className={`text-[10px] font-mono font-bold ${t.macroBias === 'bullish' ? 'text-jade' : t.macroBias === 'bearish' ? 'text-ruby' : 'text-gold'}`}>
                {t.macroBias?.toUpperCase() ?? 'NEUTRAL'} <span className="text-muted font-normal opacity-50">[{t.macroStrength}]</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Trade details */}
            <div className="space-y-4">
              <div className="text-[9px] text-aqua font-bold tracking-[2px] uppercase opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
                Execution Details
              </div>
              <div className="space-y-2.5">
                {[
                  ['Entry Price', t.entry.toFixed(5)],
                  ['Stop Loss', t.stopLoss.toFixed(5)],
                  ['Target 1', t.takeProfit1.toFixed(5)],
                  ['Target 2', t.takeProfit2.toFixed(5)],
                  ['Exit Price', t.exitPrice.toFixed(5)],
                  ['Pips', `${t.pips >= 0 ? '+' : ''}${t.pips}p`],
                  ['Session', t.session],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-[10px] border-b border-white/[0.03] pb-1.5">
                    <span className="text-muted font-mono">{k}</span>
                    <span className="text-text font-mono font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confluence */}
            <div className="space-y-4">
              <div className="text-[9px] text-aqua font-bold tracking-[2px] uppercase opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
                Confluence Checklist
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.cfNames.map((name, i) => (
                  <span key={name} className={`px-2 py-1 rounded-[4px] text-[8px] font-mono font-bold tracking-tight border transition-colors ${cfValues[i] ? 'bg-jade/10 border-jade/30 text-jade' : 'bg-white/[0.02] border-white/5 text-muted opacity-30'}`}>
                    {cfValues[i] ? '✓' : '✗'} {name}
                  </span>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                <div className="bg-black/20 p-2.5 rounded border border-white/[0.03]">
                  <div className="text-[8px] text-muted uppercase tracking-wider mb-1.5 font-bold opacity-50">Market Structure</div>
                  <div className="text-[10px] text-bright font-mono leading-tight">{t.bosLabel ?? 'Waiting for structure...'}</div>
                </div>
                <div className="bg-black/20 p-2.5 rounded border border-white/[0.03]">
                  <div className="text-[8px] text-muted uppercase tracking-wider mb-1.5 font-bold opacity-50">Liquidity Context</div>
                  <div className="text-[10px] text-bright font-mono leading-tight">{t.sweepLabel ?? 'No active sweep...'}</div>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="space-y-4">
              <div className="text-[9px] text-aqua font-bold tracking-[2px] uppercase opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
                Narrative & Logic
              </div>
              <div className="text-[11px] text-muted leading-relaxed font-ui bg-black/30 p-4 rounded-xl border border-white/[0.05] relative italic">
                <span className="absolute -top-2 -left-1 text-3xl text-white/5 font-serif select-none">"</span>
                {t.analysisText ?? 'No narrative captured for this trade.'}
              </div>
              
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted font-bold uppercase tracking-widest text-[8px]">Efficiency</span>
                  <span className="text-aqua font-mono font-bold">{(t.effectiveScore / 5.5 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-aqua transition-all" style={{ width: `${(t.effectiveScore / 5.5 * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson box */}
          <div className="mt-8 bg-violet/[0.03] border border-violet/20 rounded-xl p-5 relative overflow-hidden group hover:bg-violet/[0.05] transition-colors">
            <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-6xl select-none">🧠</span>
            </div>
            <div className="relative z-10">
              <div className="text-[10px] text-violet font-bold tracking-[4px] mb-3 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.4)]"></span>
                Key Trading Lesson
              </div>
              <div className="text-[12px] text-violet/90 leading-relaxed font-ui font-medium">
                {t.lessonText ?? 'Every trade is a data point. Focus on process, not outcome.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function JournalView() {
  const trades = useTradeStore(s => s.trades)
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL')

  const filteredTrades = useMemo(() => {
    return [...trades]
      .filter(t => filter === 'ALL' ? true : t.status === filter)
      .reverse()
  }, [trades, filter])

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-ink">
      {/* Header */}
      <div className="h-[50px] border-b border-edge px-6 flex items-center justify-between shrink-0">
        <div className="font-ui font-bold text-[10px] tracking-[3px] text-muted uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.4)]"></span>
          Trade Journal
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-1">
          {['ALL', 'WIN', 'LOSS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-[5px] text-[9px] font-bold tracking-wider transition-all ${filter === f ? 'bg-aqua/20 text-aqua border border-aqua/30' : 'text-muted hover:text-text'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {filteredTrades.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
            <span className="text-5xl">📓</span>
            <div className="text-center">
              <div className="text-sm font-bold tracking-widest uppercase">Journal Empty</div>
              <div className="text-[10px] font-mono mt-1 italic">Record trades to see logic analysis here</div>
            </div>
          </div>
        ) : (
          filteredTrades.map(t => (
            <JournalCard key={t.id} trade={t} />
          ))
        )}
      </div>
    </div>
  )
}
