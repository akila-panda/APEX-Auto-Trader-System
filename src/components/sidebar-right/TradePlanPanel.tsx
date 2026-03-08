import type { AnalysisResult } from '../../types/analysis.types'
import {
  RISK_AMOUNT,
  SL_PIPS,
  TP1_RATIO,
  TP2_RATIO,
  RUNNER_RATIO,
} from '../../config/trading.config'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

function PlanRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="text-[10px] text-muted font-mono">{label}</div>
      <div className="text-[10px] font-mono font-bold" style={{ color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  )
}

export function TradePlanPanel({ analysis: A }: Props) {
  const signal = A?.signal ?? 'WAIT'
  const isWait = signal === 'WAIT'
  
  const accentColor = signal === 'LONG' ? 'var(--jade)' : signal === 'SHORT' ? 'var(--ruby)' : 'var(--gold)'
  const accentBg = signal === 'LONG' ? 'bg-jade/5 border-jade/20' : signal === 'SHORT' ? 'bg-ruby/5 border-ruby/20' : 'bg-gold/5 border-gold/20'

  return (
    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
      <div className="text-[9px] text-aqua font-bold tracking-[2px] mb-3 uppercase opacity-70 px-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
        Trade Plan
      </div>

      <div className={`rounded-md border p-3 transition-all duration-300 ${accentBg}`}>
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted font-bold tracking-widest uppercase mb-0.5">Direction</span>
            <span className="text-sm font-bold tracking-tighter" style={{ color: accentColor }}>{signal}</span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[8px] text-muted font-bold tracking-widest uppercase mb-0.5">Target RR</span>
            <span className="text-[10px] font-mono font-bold text-aqua">1:{TP2_RATIO}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <PlanRow label="Entry Price" value={!isWait && A ? fmt5(A.entry) : '—'} />
          <PlanRow label="Stop Loss"   value={!isWait && A ? `${fmt5(A.risk.sl)} (${SL_PIPS}p)` : '—'} color="var(--ruby)" />
          <PlanRow label="TP1 (50%)"   value={!isWait && A ? `${fmt5(A.risk.tp1)} (1:${TP1_RATIO})` : '—'} color="var(--jade)" />
          <PlanRow label="TP2 (30%)"   value={!isWait && A ? `${fmt5(A.risk.tp2)} (1:${TP2_RATIO})` : '—'} color="var(--jade)" />
          <PlanRow label="Runner (20%)" value={!isWait && A ? `${fmt5(A.risk.runner)} (1:${RUNNER_RATIO}+)` : '—'} color="var(--jade)" />
          
          <div className="pt-2 mt-2 border-t border-white/[0.08] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted font-bold tracking-widest uppercase">Risk Amt</span>
              <span className="text-[10px] font-mono font-bold text-gold">${RISK_AMOUNT.toFixed(2)}</span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[8px] text-muted font-bold tracking-widest uppercase">Lot Size</span>
              <span className="text-[10px] font-mono font-bold text-bright">{!isWait && A ? `${A.risk.lots} lots` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
