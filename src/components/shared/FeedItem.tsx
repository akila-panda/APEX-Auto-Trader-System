// src/components/shared/FeedItem.tsx
// FeedItem.tsx
type FeedBadge = 'SCAN' | 'TRADE' | 'WARN' | 'INFO' | 'ERR' | 'SIGNAL' | 'LIVE' | 'BOT' | 'MACRO' | 'COOLDOWN' | 'NEWS' | string

const BADGE_CLASSES: Record<string, string> = {
  SCAN:    'bg-aqua/10 text-aqua',
  TRADE:   'bg-jade/10 text-jade',
  WARN:    'bg-amber/10 text-amber',
  INFO:    'bg-white/[0.05] text-muted',
  ERR:     'bg-ruby/10 text-ruby',
  SIGNAL:  'bg-gold/10 text-gold',
  LIVE:    'bg-jade/[0.15] text-jade',
  BOT:     'bg-aqua/10 text-aqua',
  MACRO:   'bg-jade/10 text-jade',
  COOLDOWN:'bg-amber/10 text-amber',
  NEWS:    'bg-amber/10 text-amber',
}

export function FeedItem({ time, badge, message }: { time: string; badge: FeedBadge; message: string }) {
  const cls = BADGE_CLASSES[badge] ?? 'bg-white/[0.05] text-muted'
  return (
    <div className="flex gap-2 px-3 py-[7px] border-b border-white/[0.03] fade-in">
      <span className="font-mono text-[8px] text-muted flex-shrink-0 w-[42px] pt-[1px]">{time}</span>
      <span className={`font-mono text-[7px] font-bold px-[6px] py-[2px] rounded-[3px] flex-shrink-0 h-fit tracking-[1px] ${cls}`}>{badge}</span>
      <span className="text-[10px] text-text leading-[1.5] flex-1">{message}</span>
    </div>
  )
}
