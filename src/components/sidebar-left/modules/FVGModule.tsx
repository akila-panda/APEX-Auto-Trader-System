import { Module } from '../../shared/Module'
import type { AnalysisResult } from '../../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

export function FVGModule({ analysis: A }: Props) {
  const hasFVG  = A?.fvgBull != null || A?.fvgBear != null
  const badgeTxt = hasFVG ? 'FOUND' : 'NONE'
  const badgeVariant = hasFVG ? 'aqua' : 'dim'

  const bprStr = A?.fvgBull && A?.fvgBear
    ? `${fmt5(A.fvgBull.low)} – ${fmt5(A.fvgBear.high)}`
    : 'No BPR identified'

  return (
    <Module
      dotColor="var(--aqua)"
      title="Fair Value Gaps"
      badge={badgeTxt}
      badgeVariant={badgeVariant}
    >
      <div className="space-y-3">
        <MRow 
          icon="BULL" 
          iconBg="bg-jade/10 text-jade" 
          label="Bullish FVG" 
          val={A?.fvgBull ? `${fmt5(A.fvgBull.low)} – ${fmt5(A.fvgBull.high)}` : 'None detected'} 
          sub={A?.fvgBull ? 'Most Recent' : undefined}
          valCls="text-aqua"
        />
        <MRow 
          icon="BEAR" 
          iconBg="bg-ruby/10 text-ruby" 
          label="Bearish FVG" 
          val={A?.fvgBear ? `${fmt5(A.fvgBear.low)} – ${fmt5(A.fvgBear.high)}` : 'None detected'} 
          sub={A?.fvgBear ? 'Most Recent' : undefined}
          valCls="text-ruby"
        />
        <MRow 
          icon="BPR" 
          iconBg="bg-violet/10 text-violet" 
          label="Balanced Price Range" 
          val={bprStr} 
          valCls="text-muted"
        />
      </div>
    </Module>
  )
}

function MRow({ icon, iconBg, label, val, sub, valCls }: { icon: string; iconBg: string; label: string; val: string; sub?: string; valCls?: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center font-mono text-[7px] font-bold border border-white/5 group-hover:border-white/10 transition-colors shrink-0`}>
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
