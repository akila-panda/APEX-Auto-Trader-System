// src/components/sidebar-left/modules/StructureModule.tsx
import { Module } from '../../shared/Module'
import type { AnalysisResult } from '../../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

export function StructureModule({ analysis: A }: Props) {
  const badgeVariant = A
    ? A.struct.structure === 'bullish' ? 'green'
    : A.struct.structure === 'bearish' ? 'red'
    : 'dim'
    : 'dim'

  const badgeTxt = A ? A.struct.structure.toUpperCase() : 'LOADING'

  const d1Label = A
    ? A.struct.structure === 'bullish'
      ? `HH/HL Bullish (pivot-det.)`
      : A.struct.structure === 'bearish'
      ? `LH/LL Bearish (pivot-det.)`
      : `Ranging`
    : 'Fetching...'

  const h4Label = A
    ? `${A.struct.structure === 'bullish' ? 'Bullish continuation' : 'Bearish / Ranging'}`
    : 'Fetching...'

  const zoneColor = A
    ? A.struct.inDiscount ? 'text-jade'
    : A.struct.inPremium  ? 'text-ruby'
    : 'text-gold'
    : 'text-muted'

  return (
    <Module
      dotColor="var(--jade)"
      title="HTF Structure"
      badge={badgeTxt}
      badgeVariant={badgeVariant}
      defaultOpen
    >
      <div className="space-y-3">
        <MRow 
          icon="D1" 
          iconBg="bg-jade/10 text-jade" 
          label="D1 Structure" 
          val={d1Label} 
          sub={A?.dataSource}
        />
        <MRow 
          icon="4H" 
          iconBg="bg-aqua/10 text-aqua" 
          label="H4 Structure" 
          val={h4Label} 
          sub={`${A?.struct.swingHighs.length ?? 0} SH / ${A?.struct.swingLows.length ?? 0} SL`}
        />
        <MRow 
          icon="EQ" 
          iconBg="bg-gold/10 text-gold" 
          label="Equilibrium (50%)" 
          val={A ? fmt5(A.struct.equilibrium) : '—'} 
          valCls="text-gold"
        />
        <MRow 
          icon="P/D" 
          iconBg="bg-violet/10 text-violet" 
          label="Current Zone" 
          val={A ? A.zoneLabel : '—'} 
          valCls={zoneColor}
        />
      </div>
    </Module>
  )
}

function MRow({ icon, iconBg, label, val, sub, valCls }: { icon: string; iconBg: string; label: string; val: string; sub?: string; valCls?: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center font-mono text-[9px] font-bold border border-white/5 group-hover:border-white/10 transition-colors shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <div className="text-[9px] text-muted font-bold tracking-tight uppercase opacity-60">{label}</div>
          {sub && <div className="text-[8px] text-muted font-mono opacity-40 uppercase truncate max-w-[100px]">{sub}</div>}
        </div>
        <div className={`text-[10px] font-mono font-bold truncate ${valCls ?? 'text-bright'}`}>
          {val}
        </div>
      </div>
    </div>
  )
}
