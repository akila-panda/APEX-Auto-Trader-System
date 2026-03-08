// src/components/shared/SignalCard.tsx
// SignalCard.tsx
import type { AnalysisResult } from '../../types/analysis.types'
import { fmt5 } from '../../utils/priceFormat'
import { TF_WEIGHT } from '../../config/trading.config'
import { TF_LABEL } from '../../config/timeframes.config'

export function SignalCard({ analysis }: { analysis: AnalysisResult }) {
  const { signal, tfId, coreScore, effectiveScore, entry, risk, macro, dataSource, bosR } = analysis
  const isLong = signal === 'LONG'
  return (
    <div className={`rounded-[6px] p-[10px] mb-2 border ${isLong ? 'border-jade/30 bg-jade/[0.04]' : 'border-ruby/30 bg-ruby/[0.04]'}`}>
      <div className="flex justify-between items-center mb-[6px]">
        <span className={`font-mono text-[11px] font-bold ${isLong ? 'text-jade' : 'text-ruby'}`}>{signal}</span>
        <span className="font-mono text-[8px] text-muted">{TF_LABEL[tfId]} (w:{TF_WEIGHT[tfId] ?? 1})</span>
        <span className="font-mono text-[9px] text-aqua">{coreScore}/5 eff:{effectiveScore.toFixed(1)}</span>
      </div>
      <div className="font-mono text-[9px] text-muted mt-[3px]">Entry: <span className="text-bright">{fmt5(entry)}</span> · {dataSource}</div>
      <div className="font-mono text-[9px] text-muted">SL: <span className="text-ruby">{fmt5(risk.sl)}</span> · TP2: <span className="text-jade">{fmt5(risk.tp2)}</span></div>
      <div className="font-mono text-[9px] text-muted mt-[2px]">Macro: <span className={isLong ? 'text-jade' : 'text-ruby'}>{macro.bias.toUpperCase()} [{macro.strength}]</span> · {bosR.label.substring(0, 25)}</div>
    </div>
  )
}
