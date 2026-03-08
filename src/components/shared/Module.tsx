import { useState, type ReactNode } from 'react'
import { Badge } from './Badge'

interface ModuleProps {
  title:        string
  dotColor?:    string
  badge?:       string
  badgeVariant?: 'green' | 'red' | 'gold' | 'aqua' | 'violet' | 'amber' | 'dim'
  defaultOpen?: boolean
  children:     ReactNode
}

export function Module({ title, dotColor = '#00e89a', badge, badgeVariant = 'dim', defaultOpen = false, children }: ModuleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-edge overflow-hidden">
      <div
        className="flex items-center gap-[9px] px-[14px] py-[11px] cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="font-mono text-[9px] font-bold tracking-[2px] uppercase text-bright">{title}</span>
        {badge && <Badge variant={badgeVariant} className="ml-auto">{badge}</Badge>}
        <span className="text-[8px] text-muted ml-1 flex-shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(90deg)' : undefined }}>▶</span>
      </div>
      {open && (
        <div className="px-[14px] pb-[14px] pt-[10px] bg-black/20 border-t border-edge">
          {children}
        </div>
      )}
    </div>
  )
}
