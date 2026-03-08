// src/components/sidebar-right/PriceLevelsPanel.tsx
import type { AnalysisResult } from '../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

interface Level {
  label: string
  price: number | null | undefined
  type: 'RESIST' | 'OB' | 'EQ' | 'SUPP' | 'FVG'
}

function LevelRow({ label, price, type }: Level) {
  if (!price) return null

  const typeConfig = {
    RESIST: { cls: 'bg-ruby/10 text-ruby border-ruby/20', label: 'RESIST' },
    OB:     { cls: 'bg-violet/10 text-violet border-violet/20', label: 'OB' },
    EQ:     { cls: 'bg-white/5 text-muted border-white/10', label: 'EQ' },
    SUPP:   { cls: 'bg-jade/10 text-jade border-jade/20', label: 'SUPP' },
    FVG:    { cls: 'bg-gold/10 text-gold border-gold/20', label: 'FVG' },
  }

  const { cls, label: badgeLabel } = typeConfig[type]

  return (
    <div className="flex items-center justify-between py-[6px] px-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group">
      <div className="text-[10px] text-muted font-mono tracking-tight group-hover:text-text transition-colors">
        {label}
      </div>
      <div className="flex items-center gap-3">
        <div className={`px-[5px] py-[1px] border rounded-[2px] text-[8px] font-bold tracking-wider ${cls}`}>
          {badgeLabel}
        </div>
        <div className="text-[10px] text-text font-mono font-bold tabular-nums">
          {fmt5(price)}
        </div>
      </div>
    </div>
  )
}

export function PriceLevelsPanel({ analysis: A }: Props) {
  // Define levels and filter out nulls
  const levels: Level[] = ([
    { label: 'Swing High (BSL)', price: A?.struct.swingHigh, type: 'RESIST' as const },
    { label: 'Bearish OB Top',   price: A?.bearOB?.bot,     type: 'OB' as const },
    { label: 'Equilibrium (50%)', price: A?.struct.equilibrium, type: 'EQ' as const },
    { label: 'Bullish OB Base',  price: A?.bullOB?.top,     type: 'OB' as const },
    { label: 'FVG Midpoint',     price: A?.fvgBull?.mid,    type: 'FVG' as const },
    { label: 'Swing Low (SSL)',  price: A?.struct.swingLow,  type: 'SUPP' as const },
  ]).filter(l => l.price != null) as Level[]

  return (
    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
      <div className="text-[9px] text-aqua font-bold tracking-[2px] mb-3 uppercase opacity-70 px-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
        Key Price Levels
      </div>
      
      <div className="bg-black/20 rounded-md border border-white/[0.03] overflow-hidden">
        {levels.length > 0 ? (
          levels.map((l, i) => <LevelRow key={i} {...l} />)
        ) : (
          <div className="py-6 text-center text-[9px] text-muted italic font-mono opacity-50">
            No active levels detected
          </div>
        )}
      </div>
    </div>
  )
}
