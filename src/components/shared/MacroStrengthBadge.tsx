// MacroStrengthBadge.tsx — FIX C-4
import type { MacroStrength } from '../../types/macro.types'

const CLASSES: Record<MacroStrength, string> = {
  STRONG: 'bg-jade/10 text-jade border border-jade/30',
  MEDIUM: 'bg-gold/10 text-gold border border-gold/30',
  WEAK:   'bg-white/[0.04] text-muted border border-line',
}

export function MacroStrengthBadge({ strength, locked = false }: { strength: MacroStrength; locked?: boolean }) {
  return (
    <span className={`font-mono text-[8px] font-bold px-2 py-[2px] rounded-[3px] tracking-[1px] ml-[6px] ${CLASSES[strength]}`}>
      {strength}{locked ? ' ✓' : ''}
    </span>
  )
}
