import { Module } from '../../shared/Module'
import type { AnalysisResult } from '../../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

export function LiquidityModule({ analysis: A }: Props) {
  const swept   = A?.sweepR.swept ?? false
  const badgeTxt = swept ? 'SWEPT!' : 'WATCHING'
  const badgeVariant = swept ? 'red' : 'gold'
  const sweepColor = swept ? 'text-jade' : 'text-muted'

  return (
    <Module
      dotColor="var(--amber)"
      title="Liquidity Analysis"
      badge={badgeTxt}
      badgeVariant={badgeVariant}
    >
      <div className="space-y-3">
        <MRow 
          icon="BSL" 
          iconBg="bg-amber/10 text-amber" 
          label="Buy-Side Liquidity" 
          val={A ? `${fmt5(A.sweepR.bsl)} (BSL target)` : '—'} 
          valCls="text-amber"
        />
        <MRow 
          icon="SSL" 
          iconBg="bg-amber/10 text-amber" 
          label="Sell-Side Liquidity" 
          val={A ? `${fmt5(A.sweepR.ssl)} (SSL target)` : '—'} 
          valCls="text-amber"
        />
        <MRow 
          icon="⚡" 
          iconBg="bg-ruby/10 text-ruby" 
          label="Sweep Status" 
          val={A ? A.sweepR.label : 'Monitoring...'} 
          valCls={sweepColor}
        />
        <MRow 
          icon="AS" 
          iconBg="bg-jade/10 text-jade" 
          label="Asian Session Range" 
          val={A?.asianRange.high != null ? `H: ${fmt5(A.asianRange.high)} · L: ${fmt5(A.asianRange.low)}` : '—'} 
          valCls="text-muted"
        />
      </div>
    </Module>
  )
}

function MRow({ icon, iconBg, label, val, sub, valCls }: { icon: string; iconBg: string; label: string; val: string; sub?: string; valCls?: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center font-mono text-[8px] font-bold border border-white/5 group-hover:border-white/10 transition-colors shrink-0`}>
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
