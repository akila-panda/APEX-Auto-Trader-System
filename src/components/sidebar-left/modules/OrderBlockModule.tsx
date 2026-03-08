// src/components/sidebar-left/modules/OrderBlockModule.tsx
import { Module } from '../../shared/Module'
import type { AnalysisResult } from '../../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

export function OrderBlockModule({ analysis: A }: Props) {
  const hasPOI = A?.bullOB != null || A?.bearOB != null
  const badgeTxt = hasPOI ? 'FOUND' : 'NONE'
  const badgeVariant = hasPOI ? 'green' : 'dim'

  const bosColor = A?.bosR.bos
    ? 'text-jade'
    : A?.bosR.choch
    ? 'text-gold'
    : 'text-muted'

  const oteStr = A?.ote.ote79 && A?.ote.ote62
    ? `${fmt5(A.ote.ote79)} – ${fmt5(A.ote.ote62)}${A.ote.inOTE ? ' ✓ IN OTE' : ''}`
    : 'No impulse leg detected'

  const oteColor = A?.ote.inOTE ? 'text-jade' : 'text-gold'

  return (
    <Module
      dotColor="var(--violet)"
      title="Order Blocks"
      badge={badgeTxt}
      badgeVariant={badgeVariant}
    >
      <div className="space-y-3">
        <MRow 
          icon="BULL" 
          iconBg="bg-jade/10 text-jade" 
          label="Bullish OB (Demand)" 
          val={A?.bullOB ? `${fmt5(A.bullOB.bot)} – ${fmt5(A.bullOB.top)}` : 'None detected'} 
          valCls="text-violet"
        />
        <MRow 
          icon="BEAR" 
          iconBg="bg-ruby/10 text-ruby" 
          label="Bearish OB (Supply)" 
          val={A?.bearOB ? `${fmt5(A.bearOB.bot)} – ${fmt5(A.bearOB.top)}` : 'None detected'} 
          valCls="text-ruby"
        />
        <MRow 
          icon="BOS" 
          iconBg="bg-aqua/10 text-aqua" 
          label="BOS / CHoCH (LTF)" 
          val={A ? A.bosR.label : '—'} 
          valCls={bosColor}
        />
        <MRow 
          icon="OTE" 
          iconBg="bg-gold/10 text-gold" 
          label="OTE Zone (62–79%)" 
          val={oteStr} 
          sub={A?.ote.inOTE ? `Impulse: ${fmt5(A.bosR.impulseLow)}–${fmt5(A.bosR.impulseHigh)}` : undefined}
          valCls={oteColor}
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
          {sub && <div className="text-[8px] text-muted font-mono opacity-40 uppercase truncate max-w-[120px]">{sub}</div>}
        </div>
        <div className={`text-[10px] font-mono font-bold truncate ${valCls ?? 'text-bright'}`}>
          {val}
        </div>
      </div>
    </div>
  )
}
