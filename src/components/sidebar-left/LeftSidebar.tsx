// src/components/sidebar-left/LeftSidebar.tsx
import { useState } from 'react'
import { StrategyTab }  from './tabs/StrategyTab'
import { FeedTab }      from './tabs/FeedTab'
import { ChecklistTab } from './tabs/ChecklistTab'
import { MacroTab }     from './tabs/MacroTab'
import { CalendarTab }  from './tabs/CalendarTab'

type STab = 'strategy' | 'feed' | 'checklist' | 'macro' | 'calendar'

interface TabConfig {
  id: STab
  label: string
  icon: string
}

const TABS: TabConfig[] = [
  { id: 'strategy',  label: 'STRAT', icon: '🎯' },
  { id: 'feed',      label: 'FEED',  icon: '📡' },
  { id: 'checklist', label: 'CHK',   icon: '✅' },
  { id: 'macro',     label: 'MACRO', icon: '🌍' },
  { id: 'calendar',  label: 'CAL',   icon: '📅' },
]

export function LeftSidebar() {
  const [active, setActive] = useState<STab>('strategy')

  return (
    <aside className="w-[280px] flex-shrink-0 bg-deep border-r border-edge flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <nav className="flex bg-black/40 border-b border-edge shrink-0">
        {TABS.map(t => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-all duration-200 group relative ${
                isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
              }`}
            >
              <span className={`text-[12px] mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                {t.icon}
              </span>
              <span className={`font-mono text-[8px] font-bold tracking-[1px] transition-colors ${
                isActive ? 'text-aqua' : 'text-muted group-hover:text-text'
              }`}>
                {t.label}
              </span>
              
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-aqua shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/10">
        <div className="animate-fade-in h-full">
          {active === 'strategy'  && <StrategyTab />}
          {active === 'feed'      && <FeedTab />}
          {active === 'checklist' && <ChecklistTab />}
          {active === 'macro'     && <MacroTab />}
          {active === 'calendar'  && <CalendarTab />}
        </div>
      </div>
    </aside>
  )
}
