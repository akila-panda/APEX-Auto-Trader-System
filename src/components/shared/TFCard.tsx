import type { AnalysisResult } from '../../types/analysis.types'
import { TF_WEIGHT } from '../../config/trading.config'
import { TF_LABEL } from '../../config/timeframes.config'

export function TFCard({ analysis, isScanning = false }: { analysis?: AnalysisResult; isScanning?: boolean }) {
  if (!analysis) return null
  const { tfId, signal, coreScore, bias, isLive, bosR, effectiveScore } = analysis
  const weight  = TF_WEIGHT[tfId] ?? 1
  const barPct  = (coreScore / 5) * 100
  const barColor = coreScore >= 4 ? '#00e89a' : coreScore >= 2 ? '#e8b84b' : '#2e4463'
  const sigColor = signal === 'LONG' ? 'text-jade' : signal === 'SHORT' ? 'text-ruby' : 'text-muted'

  const border = isScanning
    ? 'border-aqua shadow-[0_0_8px_rgba(0,212,255,0.2)]'
    : signal === 'LONG'  ? 'border-jade/40 bg-jade/[0.03]'
    : signal === 'SHORT' ? 'border-ruby/40 bg-ruby/[0.03]'
    : coreScore >= 3     ? 'border-aqua/30'
    : 'border-edge'

  return (
    <div className={`bg-surface border rounded-[7px] px-3 py-[11px] mb-2 flex items-center gap-[10px] transition-all ${border}`}>
      <div className="font-mono text-[11px] font-bold text-bright w-[38px] flex-shrink-0">{TF_LABEL[tfId] ?? tfId}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-mono text-[9px] font-bold ${sigColor}`}>{signal}</span>
          <span className="font-mono text-[8px] text-muted">{coreScore}/5 (w:{weight}) eff:{effectiveScore.toFixed(1)}</span>
        </div>
        <div className="h-[3px] bg-line rounded-full overflow-hidden mb-[3px]">
          <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: barColor }} />
        </div>
        <div className="font-mono text-[9px] text-muted">{bias.toUpperCase()} · {isLive ? 'LIVE' : 'SIM'} · {bosR.label.substring(0, 22)}</div>
      </div>
    </div>
  )
}
