import { Module } from '../../shared/Module'
import type { AnalysisResult } from '../../../types/analysis.types'
import {
  RISK_AMOUNT,
  SL_PIPS,
} from '../../../config/trading.config'

interface Props { analysis: AnalysisResult | null }

const fmt5 = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toFixed(5) : '—'

const CF_NAMES = ['Macro', 'HTF+POI', 'Liq Sweep', 'MSS+BOS', 'OTE Zone']

export function SignalModule({ analysis: A }: Props) {
  const signal = A?.signal ?? 'WAIT'
  const isWait = signal === 'WAIT'

  const accentColor = signal === 'LONG' ? 'text-jade' : signal === 'SHORT' ? 'text-ruby' : 'text-gold'
  const accentBg = signal === 'LONG' ? 'bg-jade/5 border-jade/20' : signal === 'SHORT' ? 'bg-ruby/5 border-ruby/20' : 'bg-gold/5 border-gold/20'

  const cfVals = A
    ? [A.cf_macro, A.cf_htf, A.cf_sweep, A.cf_mss, A.cf_ote]
    : [false, false, false, false, false]

  return (
    <Module
      dotColor="var(--gold)"
      title="Apex Signal"
      badge={signal}
      badgeVariant={signal === 'LONG' ? 'green' : signal === 'SHORT' ? 'red' : 'gold'}
      defaultOpen
    >
      <div className={`rounded-xl border p-4 mb-4 transition-all duration-300 ${accentBg}`}>
        <div className={`font-mono text-[12px] font-bold mb-3 flex items-center gap-2 ${accentColor}`}>
          <span>{signal === 'LONG' ? '▲' : signal === 'SHORT' ? '▼' : '⏳'}</span>
          {signal === 'LONG' ? 'LONG SIGNAL' : signal === 'SHORT' ? 'SHORT SIGNAL' : 'AWAIT SETUP'}
        </div>

        {!isWait && A ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <StatItem label="ENTRY" val={fmt5(A.entry)} color="text-bright" />
              <StatItem label="STOP" val={fmt5(A.risk.sl)} color="text-ruby" />
              <StatItem label="TP2" val={fmt5(A.risk.tp2)} color="text-jade" />
            </div>
            
            <div className="pt-3 border-t border-white/[0.05] flex flex-wrap gap-x-4 gap-y-1">
              <MetaItem label="Risk" val={`$${RISK_AMOUNT}`} />
              <MetaItem label="Lots" val={A.risk.lots} />
              <MetaItem label="SL" val={`${SL_PIPS}p`} />
              <MetaItem label="Sess" val={A.sessLabel} />
              <MetaItem label="Score" val={`${A.coreScore}/5`} />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-muted leading-relaxed font-ui italic opacity-80">
            {A?.analysisText || 'Monitoring market data for high-probability setups...'}
          </div>
        )}
      </div>

      {/* Confluence Grid */}
      <div className="grid grid-cols-5 gap-1.5 px-1">
        {CF_NAMES.map((name, i) => (
          <div key={name} className="flex flex-col items-center gap-1.5">
            <div className={`w-full h-1 rounded-full transition-all duration-500 ${cfVals[i] ? 'bg-jade shadow-[0_0_5px_rgba(0,232,154,0.4)]' : 'bg-white/10'}`} />
            <span className={`text-[7px] font-bold tracking-tighter text-center uppercase ${cfVals[i] ? 'text-jade' : 'text-muted opacity-40'}`}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </Module>
  )
}

function StatItem({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] text-muted font-bold tracking-widest mb-0.5 opacity-50 uppercase">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{val}</span>
    </div>
  )
}

function MetaItem({ label, val }: { label: string; val: string | number }) {
  return (
    <span className="text-[8px] font-mono text-muted">
      <span className="opacity-40">{label}:</span> <span className="text-bright/80 font-bold">{val}</span>
    </span>
  )
}
