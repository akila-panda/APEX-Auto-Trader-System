// shared/Badge.tsx
import type { ReactNode } from 'react'

type BadgeVariant = 'green' | 'red' | 'gold' | 'aqua' | 'violet' | 'amber' | 'dim'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green:  'bg-jade/10 text-jade border border-jade/20',
  red:    'bg-ruby/10 text-ruby border border-ruby/20',
  gold:   'bg-gold/10 text-gold border border-gold/20',
  aqua:   'bg-aqua/10 text-aqua border border-aqua/20',
  violet: 'bg-violet/10 text-violet border border-violet/20',
  amber:  'bg-amber/10 text-amber border border-amber/20',
  dim:    'bg-white/[0.04] text-muted border border-line',
}

export function Badge({ children, variant = 'dim', className = '' }: {
  children: ReactNode; variant?: BadgeVariant; className?: string
}) {
  return (
    <span className={`font-mono text-[7px] font-bold px-[7px] py-[2px] rounded-[3px] tracking-[1px] ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  )
}
