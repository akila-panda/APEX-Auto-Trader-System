import { useState } from 'react'

const CHECKLIST_ITEMS = [
  'Macro bias confirmed (Rate differential + DXY)',
  'HTF structure aligned (D1 + H4 same direction)',
  'Price in correct Premium/Discount zone',
  'Unmitigated OB or FVG identified at POI',
  'Liquidity sweep confirmed (Asian H/L or PDH/PDL)',
  'Sweep candle closed back inside range',
  'Market Structure Shift (MSS/ChoCH) on M5/M15',
  'Displacement candle ≥60% body with FVG',
  'OTE entry zone (62–79% fib) reached',
  'Kill Zone active (London 07-10 / NY 12-15 UTC)',
  'No high-impact news within ±30 min (check CAL tab)',
  'Daily trade limit not exceeded (max 3/day)',
]

export function ChecklistTab() {
  const [checked, setChecked] = useState<boolean[]>(
    new Array(CHECKLIST_ITEMS.length).fill(false)
  )

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const reset = () => setChecked(new Array(CHECKLIST_ITEMS.length).fill(false))

  const done  = checked.filter(Boolean).length
  const total = CHECKLIST_ITEMS.length
  const pct   = Math.round((done / total) * 100)

  return (
    <div>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--edge)',
        fontFamily: 'var(--font-mono)',
        fontSize: '7px',
        color: 'var(--muted)',
        letterSpacing: '3px',
      }}>
        5-LAYER PRE-TRADE CHECKLIST
      </div>

      {CHECKLIST_ITEMS.map((text, i) => (
        <label
          key={i}
          className="ck-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '7px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => toggle(i)}
            style={{ width: 14, height: 14, accentColor: 'var(--jade)', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{
            fontSize: '10px',
            color: checked[i] ? 'var(--jade)' : 'var(--text)',
            lineHeight: 1.4,
            textDecoration: checked[i] ? 'line-through' : 'none',
            opacity: checked[i] ? 0.7 : 1,
            transition: 'all 0.15s',
          }}>
            {text}
          </span>
        </label>
      ))}

      {/* Progress */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--edge)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--muted)' }}>Completed</span>
          <span style={{ color: 'var(--aqua)' }}>{done} / {total}</span>
        </div>
        <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct === 100 ? 'var(--jade)' : pct >= 50 ? 'var(--gold)' : 'var(--ruby)',
            borderRadius: '2px',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
      </div>

      <div style={{ padding: '0 14px 12px' }}>
        <button
          onClick={reset}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--aqua-dim)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '5px',
            color: 'var(--aqua)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
        >
          RESET CHECKLIST
        </button>
      </div>
    </div>
  )
}
