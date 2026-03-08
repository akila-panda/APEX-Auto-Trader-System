// src/components/sidebar-right/ConfluencePanel.tsx
import type { AnalysisResult } from '../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

interface CfRowProps {
  label:       string
  active:      boolean
  indent?:     boolean
  small?:      boolean
  labelColor?: string
}

function CfRow({
  label,
  active,
  indent = false,
  small = false,
  labelColor,
}: CfRowProps) {
  return (
    <div className="cf-item flex justify-between items-center py-[5px] border-b border-white/[0.04] last:border-0">
      <div
        className="cf-name font-mono"
        style={{
          paddingLeft: indent ? 10 : 0,
          fontSize: small ? '9px' : '10px',
          color: labelColor ?? (indent ? 'var(--muted)' : 'var(--text)'),
        }}
      >
        {label}
      </div>
      <div
        className={`cf-chk w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold text-[10px] ${active ? 'bg-jade/20 text-jade' : 'bg-ruby/20 text-ruby'}`}
        style={small ? { width: 14, height: 14, fontSize: '8px' } : undefined}
      >
        {active ? '✓' : '✗'}
      </div>
    </div>
  )
}

export function ConfluencePanel({ analysis: A }: Props) {
  const coreScore     = A?.coreScore     ?? 0
  const effectiveScore = A?.effectiveScore ?? 0
  const strength      = A?.macroStrength  ?? 'WEAK'
  const fillPct       = Math.min(100, (effectiveScore / 5.5) * 100)
  const fillColor     = effectiveScore >= 4
    ? 'var(--jade)'
    : effectiveScore >= 2
    ? 'var(--gold)'
    : 'var(--ruby)'

  const scoreLabel = strength === 'STRONG'
    ? `${coreScore}/5 +0.5 STRONG`
    : `${coreScore} / 5`

  return (
    <div className="p-3">
      <div className="rs-section-title text-[9px] text-aqua font-bold tracking-[2px] mb-3 uppercase opacity-70">Confluence Check</div>

      <div className="flex flex-col">
        <CfRow label="① Macro Bias Aligned"       active={A?.cf_macro     ?? false} />
        <CfRow label="↳ Structure vs Bias"         active={A?.cf_structure ?? false} indent small />
        <CfRow label="↳ POI Within 20 Pips"        active={A?.cf_poi       ?? false} indent small />
        <CfRow label="② HTF Structure + POI"       active={A?.cf_htf       ?? false} />
        <CfRow label="③ Liquidity Sweep"           active={A?.cf_sweep     ?? false} />
        <CfRow label="④ MSS + Displacement"        active={A?.cf_mss       ?? false} />
        <CfRow label="⑤ OTE Entry Zone"            active={A?.cf_ote       ?? false} />
        <CfRow label="+ Kill Zone Active"          active={A?.cf_kz        ?? false} labelColor="var(--gold)" />
        <CfRow label="+ No News Risk"              active={A?.cf_news      ?? false} labelColor="var(--amber)" />
      </div>

      <div className="score-wrap mt-5">
        <div className="score-labels flex justify-between items-center mb-1 font-mono text-[10px]">
          <span className="text-muted uppercase tracking-wider">Final Score</span>
          <span className="text-aqua font-bold">{scoreLabel}</span>
        </div>
        <div className="score-track h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="score-fill h-full transition-all duration-500"
            style={{ width: `${fillPct}%`, background: fillColor }}
          />
        </div>
      </div>
    </div>
  )
}
