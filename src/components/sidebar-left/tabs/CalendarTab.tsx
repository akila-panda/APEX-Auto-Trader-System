// src/components/sidebar-left/tabs/CalendarTab.tsx
import { useEffect, useState } from 'react'
import { useCalendar } from '../../../hooks/useCalendar'

export function CalendarTab() {
  const { events, isNewsNearby } = useCalendar()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const near = isNewsNearby(30)
  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())

  const z = (n: number) => String(n).padStart(2, '0')
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[9px] text-muted font-bold tracking-[2px] uppercase flex items-center gap-2 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-violet"></span>
          High-Impact Events
        </div>
        {near && (
          <div className="flex items-center gap-1.5 bg-ruby/10 border border-ruby/20 px-2 py-0.5 rounded animate-pulse">
            <span className="text-[8px] text-ruby font-bold font-mono">⚠ NEWS IN 30M</span>
          </div>
        )}
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[10px] text-muted italic font-mono opacity-40">
            No high-impact events scheduled
          </div>
        ) : (
          sorted.map((ev, i) => {
            const diff = ev.date.getTime() - now
            const past = diff < 0
            const soon = !past && diff < 30 * 60_000
            
            const impactColor = ev.impact === 'high' ? 'text-ruby' : ev.impact === 'med' ? 'text-gold' : 'text-muted'
            const impactBg = ev.impact === 'high' ? 'bg-ruby/5 border-ruby/10' : ev.impact === 'med' ? 'bg-gold/5 border-gold/10' : 'bg-white/5 border-white/5'
            
            const timeStr = `${z(ev.date.getUTCHours())}:${z(ev.date.getUTCMinutes())}`
            const dayStr = dayNames[ev.date.getUTCDay()]

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${impactBg} ${past ? 'opacity-30 grayscale' : 'opacity-100'} ${soon ? 'ring-1 ring-ruby/40 animate-pulse' : ''}`}
              >
                <div className="flex flex-col items-center justify-center shrink-0 w-10 border-r border-white/5 pr-3">
                  <span className="text-[8px] text-muted font-mono font-bold uppercase">{dayStr}</span>
                  <span className="text-[10px] text-bright font-mono font-bold tracking-tighter">{timeStr}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[8px] font-bold font-mono ${impactColor}`}>
                      {ev.impact === 'high' ? '●●' : ev.impact === 'med' ? '●○' : '○○'}
                    </span>
                    <span className="text-[9px] text-muted font-bold font-mono uppercase tracking-tighter">{ev.cur}</span>
                  </div>
                  <div className="text-[11px] text-text font-bold truncate leading-tight group-hover:text-aqua transition-colors">
                    {ev.name}
                  </div>
                </div>

                {soon && (
                  <div className="bg-ruby/20 border border-ruby/30 px-1.5 py-0.5 rounded text-[7px] font-bold text-ruby font-mono">
                    SOON
                  </div>
                )}
                {past && (
                  <div className="text-[7px] font-bold text-muted font-mono opacity-50">
                    PAST
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer info */}
      <div className="pt-2 px-1 text-[8px] text-muted font-mono italic opacity-40 leading-relaxed">
        * Times are in UTC. High-impact events are automatically factored into the AI confidence score.
      </div>
    </div>
  )
}
