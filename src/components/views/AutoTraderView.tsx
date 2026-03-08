import { useBotStore, type BotSettings } from '../../store/useBotStore'
import { useMarketStore } from '../../store/useMarketStore'
import { useTradeStore } from '../../store/useTradeStore'
import { TFCard } from '../shared/TFCard'
import { SignalCard } from '../shared/SignalCard'
import { TIMEFRAMES } from '../../config/timeframes.config'
import { useEffect, useRef, useMemo } from 'react'
import { fmtPnl } from '../../utils/priceFormat'

function SettingRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] px-2 rounded-lg transition-colors group">
      <div className="flex flex-col gap-0.5">
        <div className="text-[11px] font-bold text-bright tracking-tight group-hover:text-aqua transition-colors">{label}</div>
        <div className="text-[9px] text-muted font-mono opacity-60 uppercase tracking-tighter">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  )
}

export function AutoTraderView() {
  const bot  = useBotStore()
  const feed = useMarketStore(s => s.feedItems)
  const tfAnalysis = useMarketStore(s => s.tfAnalysis)
  const trades = useTradeStore(s => s.trades)
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log to top on new items
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [feed])

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.status === 'WIN').length
    const netPnl = trades.reduce((s, t) => s + t.pnl, 0)
    const wr = trades.length ? Math.round((wins / trades.length) * 100) : 0
    return { wins, netPnl, wr, total: trades.length }
  }, [trades])

  const toggleBot = () => bot.running ? bot.stop() : bot.start()

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-ink">
      {/* Header */}
      <div className="h-[50px] border-b border-edge px-6 flex items-center justify-between shrink-0 bg-black/20">
        <div className="font-ui font-bold text-[10px] tracking-[3px] text-muted uppercase flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${bot.running ? 'bg-jade animate-pulse shadow-[0_0_8px_rgba(0,232,154,0.4)]' : 'bg-ruby shadow-[0_0_8px_rgba(255,82,82,0.4)]'}`}></span>
          Apex Auto-Trader <span className="text-[8px] opacity-40 ml-1">v3.0.2</span>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="hidden md:flex gap-4">
            <HeaderStat label="SCANS" value={bot.scanCycles} color="text-aqua" />
            <HeaderStat label="SIGNALS" value={bot.totalSignals} color="text-gold" />
            <HeaderStat label="TRADES" value={stats.total} color="text-jade" />
          </div>
          <button
            className={`h-[30px] px-5 rounded-[6px] font-mono text-[10px] font-bold tracking-[2px] transition-all duration-300 active:scale-95 shadow-lg ${
              bot.running 
                ? 'bg-ruby/20 text-ruby border border-ruby/30 hover:bg-ruby/30' 
                : 'bg-jade/20 text-jade border border-jade/30 hover:bg-jade/30 shadow-jade/10'
            }`}
            onClick={toggleBot}
          >
            {bot.running ? '■ STOP ENGINE' : '▶ START ENGINE'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column: Monitor & Settings */}
        <div className="w-[320px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          {/* Monitor */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="text-[9px] text-aqua font-bold tracking-[2px] mb-4 uppercase opacity-70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-aqua"></span>
              Timeframe Monitor
            </div>
            <div className="space-y-2">
              {TIMEFRAMES.map(tf => (
                <TFCard
                  key={tf.id}
                  analysis={tfAnalysis[tf.id] ?? null}
                />
              ))}
            </div>
          </section>

          {/* Settings */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="text-[9px] text-gold font-bold tracking-[2px] mb-4 uppercase opacity-70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
              Engine Parameters
            </div>
            
            <div className="space-y-1">
              <SettingRow label="Min Confluence" sub="Required score (3-5)">
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={3} max={5} step={0.5} value={bot.minScore}
                    onChange={e => bot.setSetting('minScore', parseFloat(e.target.value))}
                    className="w-16 accent-aqua"
                  />
                  <span className="text-[10px] font-mono font-bold text-aqua w-6">{bot.minScore}</span>
                </div>
              </SettingRow>

              <SettingRow label="Kill Zone Filter" sub="Active London/NY Only">
                <ToggleButton 
                  active={bot.kzOnly} 
                  onClick={() => bot.setSetting('kzOnly', !bot.kzOnly)} 
                />
              </SettingRow>

              <SettingRow label="Macro Alignment" sub="Bias must match trade">
                <ToggleButton 
                  active={bot.macroFilter} 
                  onClick={() => bot.setSetting('macroFilter', !bot.macroFilter)} 
                />
              </SettingRow>

              <SettingRow label="News Shield" sub="Auto-Block high impact">
                <ToggleButton 
                  active={bot.newsFilter} 
                  onClick={() => bot.setSetting('newsFilter', !bot.newsFilter)} 
                />
              </SettingRow>
            </div>
          </section>
        </div>

        {/* Center Column: Signal Feed */}
        <div className="flex-1 flex flex-col gap-4">
          <section className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden">
            <div className="h-10 px-4 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/20">
              <div className="text-[9px] text-bright font-bold tracking-[2px] uppercase opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-bright"></span>
                Active Signal Stream
              </div>
              <div className="text-[8px] font-mono text-muted uppercase tracking-widest tabular-nums">
                LIVE UPDATES · {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {bot.activeSignals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-3 grayscale">
                  <span className="text-4xl">📡</span>
                  <div className="text-center font-mono">
                    <div className="text-[10px] font-bold tracking-widest uppercase">Scanning Markets...</div>
                    <div className="text-[8px] mt-1">Waiting for confluence alignment</div>
                  </div>
                </div>
              ) : (
                bot.activeSignals.map((sig, i) => (
                  <SignalCard key={`${sig.tfId}-${i}`} analysis={sig} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Performance & Logs */}
        <div className="w-[300px] flex flex-col gap-4">
          {/* Performance Stats */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="text-[9px] text-jade font-bold tracking-[2px] mb-4 uppercase opacity-70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-jade"></span>
              Session Performance
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="WIN RATE" value={`${stats.wr}%`} color="text-jade" />
              <StatBox label="NET PNL" value={fmtPnl(stats.netPnl)} color={stats.netPnl >= 0 ? 'text-jade' : 'text-ruby'} />
              <StatBox label="TOTAL" value={stats.total} />
              <StatBox label="WINS" value={stats.wins} color="text-jade" />
            </div>
          </section>

          {/* Activity Log */}
          <section className="flex-1 bg-black/40 border border-white/[0.05] rounded-xl flex flex-col overflow-hidden">
            <div className="h-8 px-3 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/40">
              <div className="text-[8px] text-muted font-bold tracking-[2px] uppercase opacity-70">
                Activity Log
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-jade/40 animate-pulse"></div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 font-mono text-[9px] leading-relaxed">
              {feed.length === 0 ? (
                <div className="text-muted/30 italic text-center mt-10">Log initialized...</div>
              ) : (
                feed.map((item, i) => (
                  <div key={i} className="border-l border-white/5 pl-2 py-0.5 hover:bg-white/[0.02] transition-colors">
                    <span className="text-muted/50">[{new Date(item.time).toLocaleTimeString([], {hour12:false})}]</span>
                    <span className={`mx-1.5 font-bold ${item.cls === 'fb-scan' ? 'text-aqua' : item.cls === 'fb-trade' ? 'text-jade' : 'text-gold'}`}>
                      {item.badge}
                    </span>
                    <span className="text-text/80">{item.msg}</span>
                  </div>
                )).reverse()
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function HeaderStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] text-muted font-bold tracking-widest opacity-50 uppercase">{label}</span>
      <span className={`font-mono text-[11px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-2.5 border border-white/[0.03]">
      <div className="text-[8px] text-muted font-bold uppercase tracking-widest mb-1 opacity-50">{label}</div>
      <div className={`text-[12px] font-mono font-bold tabular-nums ${color ?? 'text-bright'}`}>{value}</div>
    </div>
  )
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-4 rounded-full relative transition-all duration-300 ${active ? 'bg-jade/40 border border-jade/50' : 'bg-white/5 border border-white/10'}`}
    >
      <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ${active ? 'right-0.5 bg-jade shadow-[0_0_5px_rgba(0,232,154,0.5)]' : 'left-0.5 bg-muted'}`}></div>
    </button>
  )
}
