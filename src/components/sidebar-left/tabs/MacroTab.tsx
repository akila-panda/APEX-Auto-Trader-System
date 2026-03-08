// src/components/sidebar-left/tabs/MacroTab.tsx
import { useMacroStore } from '../../../store/useMacroStore'
import { useMarketStore } from '../../../store/useMarketStore'
import type { MacroInputs } from '../../../types/macro.types'

const FACTORS: Array<{
  key: keyof MacroInputs
  label: string
  sub: string
}> = [
  { key: 'rateDiff', label: 'Fed vs ECB Spread',        sub: '+1=ECB>Fed · -1=Fed>ECB' },
  { key: 'dxy',      label: 'DXY Direction',             sub: '+1=DXY falling · -1=DXY rising' },
  { key: 'cot',      label: 'COT Net Position',          sub: '+1=Specs net long EUR · -1=net short' },
  { key: 'dataDiv',  label: 'EU/US Data Divergence',     sub: '+1=EU outperforming · -1=US outperforming' },
  { key: 'geo',      label: 'Geopolitical / Risk',       sub: '+1=Risk-on (EUR+) · -1=Risk-off (USD+)' },
]

export function MacroTab() {
  const { inputs, locked, setFactor, lock, computedScore, computedBias, computedStrength } = useMacroStore()
  const addFeedItem = useMarketStore(s => s.addFeedItem)

  const total    = computedScore()
  const bias     = computedBias()
  const strength = computedStrength()

  const biasColor = bias === 'bullish' ? 'var(--jade)' : bias === 'bearish' ? 'var(--ruby)' : 'var(--gold)'

  const verdictMap = {
    bullish: `▲ BULLISH (${strength}) — Long signals enabled`,
    bearish: `▼ BEARISH (${strength}) — Short signals enabled`,
    neutral: '◈ NEUTRAL — Score must exceed ±2. Adjust factors.',
  }

  const handleLock = () => {
    lock()
    addFeedItem({
      time: new Date().toISOString(),
      badge: 'MACRO',
      cls: 'fb-live',
      msg: `Macro locked. Bias: ${bias.toUpperCase()} (${total}) [${strength}]. ${
        bias === 'neutral' ? 'WARNING: Neutral = no trades will be placed.' : ''
      }`,
    })
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '3px', marginBottom: '10px' }}>
        WEEKLY MACRO SCORECARD · SET EACH FACTOR
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--aqua)', marginBottom: '10px', lineHeight: 1.7 }}>
        Update weekly. +1 = EUR bullish, 0 = neutral, -1 = USD bullish.
      </div>

      {FACTORS.map(({ key, label, sub }) => {
        const val = inputs[key]
        return (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text)', lineHeight: 1.4 }}>{label}</div>
              <div style={{ fontSize: '8px', color: 'var(--muted)' }}>{sub}</div>
            </div>
            <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
              {([1, 0, -1] as const).map(v => {
                const isActive = val === v
                const activeStyle = isActive
                  ? v === 1
                    ? { background: 'var(--jade-dim)', borderColor: 'rgba(0,232,154,0.4)', color: 'var(--jade)' }
                    : v === -1
                    ? { background: 'var(--ruby-dim)', borderColor: 'rgba(255,51,102,0.4)', color: 'var(--ruby)' }
                    : { background: 'var(--gold-dim)', borderColor: 'rgba(232,184,75,0.4)', color: 'var(--gold)' }
                  : {}
                return (
                  <button
                    key={v}
                    onClick={() => setFactor(key, v)}
                    style={{
                      width: 28, height: 24,
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      background: 'transparent',
                      color: 'var(--muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      ...activeStyle,
                    }}
                  >
                    {v === 1 ? '+1' : v === 0 ? ' 0' : '-1'}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Score summary */}
      <div style={{
        marginTop: '14px',
        padding: '12px',
        background: 'var(--surface)',
        borderRadius: '6px',
        border: '1px solid var(--edge)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--muted)' }}>TOTAL SCORE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: biasColor }}>{total}</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '3px',
              letterSpacing: '1px',
              background: strength === 'STRONG' ? 'var(--jade-dim)' : strength === 'MEDIUM' ? 'var(--gold-dim)' : 'rgba(255,255,255,0.04)',
              color: strength === 'STRONG' ? 'var(--jade)' : strength === 'MEDIUM' ? 'var(--gold)' : 'var(--muted)',
              border: `1px solid ${strength === 'STRONG' ? 'rgba(0,232,154,0.3)' : strength === 'MEDIUM' ? 'rgba(232,184,75,0.3)' : 'var(--line)'}`,
            }}>
              {locked ? `${strength} ✓` : strength}
            </span>
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          marginTop: '6px',
          color: biasColor,
        }}>
          {verdictMap[bias]}
        </div>
      </div>

      <div style={{ marginTop: '10px' }}>
        <button
          onClick={handleLock}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--gold-dim)',
            border: '1px solid rgba(232,184,75,0.25)',
            borderRadius: '5px',
            color: 'var(--gold)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
        >
          ↻ LOCK IN MACRO BIAS
        </button>
      </div>

      <div style={{
        marginTop: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '8px',
        color: 'var(--muted)',
        lineHeight: 1.8,
      }}>
        ▸ Score &gt; +2 = BULLISH (Long signals only)<br />
        ▸ Score &lt; -2 = BEARISH (Short signals only)<br />
        ▸ -2 to +2 = NEUTRAL (No directional trades)<br />
        ▸ |Score| ≥ 4 = STRONG (+0.5 score bonus)<br />
        ▸ Update each Monday after COT report.
      </div>
    </div>
  )
}
