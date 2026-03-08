// src/components/layout/TopBar.tsx
import { useState, useEffect } from 'react'
import type { NavTab } from '../../App'
import { useMarketStore } from '../../store/useMarketStore'
import { useBotStore }    from '../../store/useBotStore'
import { useSessionInfo } from '../../hooks/useSessionInfo'
import { fmtClock }       from '../../utils/dateTime'
import { ACCOUNT_BALANCE, RISK_PCT } from '../../config/trading.config'

const NAV_TABS: Array<{ id: NavTab; label: string; icon: string }> = [
  { id: 'chart',   label: 'CHART',       icon: '📊' },
  { id: 'robot',   label: 'AUTO-TRADER', icon: '🤖' },
  { id: 'trades',  label: 'TRADE TABLE', icon: '📋' },
  { id: 'journal', label: 'JOURNAL',     icon: '📓' },
]

export function TopBar({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (t: NavTab) => void }) {
  const [clock, setClock] = useState(fmtClock())
  const apiStatus    = useMarketStore(s => s.apiStatus)
  const currentPrice = useMarketStore(s => s.currentPrice)
  const prevPrice    = useMarketStore(s => s.prevPrice)
  const botRunning   = useBotStore(s => s.running)
  const startBot     = useBotStore(s => s.start)
  const stopBot      = useBotStore(s => s.stop)
  const sess         = useSessionInfo()

  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock()), 1000)
    return () => clearInterval(id)
  }, [])

  const priceUp = currentPrice >= prevPrice

  const apiClasses: Record<string, string> = {
    live:      'text-jade border-jade/30 bg-jade/10',
    loading:   'text-gold border-gold/30 bg-gold/10 kz-pulse',
    error:     'text-ruby border-ruby/30 bg-ruby/10',
    simulated: 'text-amber border-amber/30 bg-amber/10',
  }
  const apiLabels: Record<string, string> = {
    live: 'LIVE DATA', loading: 'CONNECTING...', error: 'API ERROR', simulated: '⚠ SIMULATED',
  }

  return (
    <header className="h-[54px] bg-deep border-b border-edge flex items-center px-5 gap-[14px] flex-shrink-0 z-50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aqua/10 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 bg-gradient-to-br from-aqua to-jade rounded-[6px] flex items-center justify-center text-[12px] font-black text-ink shadow-[0_0_16px_rgba(0,212,255,0.15)]">A</div>
        <div>
          <div className="text-[15px] font-extrabold text-white tracking-[3px]">APEX</div>
          <div className="text-[8px] tracking-[4px] text-muted font-normal leading-none">EUR/USD · v3 ULTIMATE</div>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-[2px] bg-void border border-edge rounded-[8px] p-1">
        {NAV_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-[18px] py-[6px] rounded-[5px] font-mono text-[9px] font-bold tracking-[1.5px] uppercase transition-all cursor-pointer border ${
              activeTab === t.id
                ? 'bg-aqua/10 text-aqua border-aqua/25 shadow-[0_0_12px_rgba(0,212,255,0.1)]'
                : 'text-muted border-transparent hover:text-text hover:bg-surface'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Session pills */}
      <div className="flex gap-[6px]">
        {[
          { label: 'LONDON', active: sess.isLondon, kz: sess.inLondonKZ },
          { label: 'NY',     active: sess.isNY,     kz: sess.inNYKZ },
          { label: 'ASIA',   active: sess.isAsia,   kz: false },
        ].map(p => (
          <span key={p.label} className={`font-mono text-[8px] font-bold px-[10px] py-1 rounded-full border tracking-[1px] transition-all ${
            p.kz    ? 'text-gold border-gold/40 bg-gold/10 kz-pulse'
            : p.active ? 'text-jade border-jade/40 bg-jade/10'
            : 'text-muted border-line'
          }`}>{p.label}</span>
        ))}
      </div>

      {/* API Status */}
      <div className={`flex items-center gap-[6px] font-mono text-[8px] px-[10px] py-1 rounded-[4px] border transition-all ${apiClasses[apiStatus]}`}>
        <div className="w-[5px] h-[5px] rounded-full bg-current" />
        {apiLabels[apiStatus]}
      </div>

      {/* Bot controls */}
      <div className={`flex items-center gap-[7px] px-[14px] py-[6px] rounded-full border font-mono text-[9px] font-bold tracking-[1px] transition-all ${botRunning ? 'text-jade border-jade/30 bg-jade/10 kz-pulse' : 'text-muted border-line'}`}>
        <div className="w-[6px] h-[6px] rounded-full bg-current" />
        {botRunning ? 'BOT RUNNING' : 'BOT OFFLINE'}
      </div>
      <button
        onClick={() => botRunning ? stopBot() : startBot()}
        className={`px-4 py-[6px] rounded-[6px] border font-mono text-[9px] font-bold tracking-[1.5px] uppercase cursor-pointer transition-all ${
          botRunning
            ? 'border-ruby/40 text-ruby bg-ruby/10'
            : 'border-jade/40 text-jade bg-jade/10 hover:bg-jade/20 hover:shadow-[0_0_16px_rgba(0,232,154,0.3)]'
        }`}
      >
        {botRunning ? '■ STOP BOT' : '▶ START BOT'}
      </button>

      {/* Price */}
      {currentPrice > 0 && (
        <span className={`font-mono text-[13px] font-bold transition-colors ${priceUp ? 'text-jade' : 'text-ruby'}`}>
          {currentPrice.toFixed(5)}
        </span>
      )}

      {/* Risk badge + clock */}
      <div className="ml-auto flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-[8px] text-gold border border-gold/20 px-3 py-1 rounded-[4px] bg-gold/10 tracking-[1px] whitespace-nowrap">
          ${ACCOUNT_BALANCE.toLocaleString()} ACCT · {(RISK_PCT * 100).toFixed(0)}% RISK · 1:3 R:R
        </span>
        <span className="font-mono text-[10px] text-muted whitespace-nowrap">{clock}</span>
      </div>
    </header>
  )
}
