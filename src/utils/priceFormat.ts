/**
 * priceFormat.ts
 * Price formatting utilities for EUR/USD (5 decimal places).
 */

/** Snap to 5 decimal places */
export const snap = (n: number): number => parseFloat(n.toFixed(5))

/** Format to 5 decimal places as string, or '—' if invalid */
export const fmt5 = (n: number | null | undefined): string =>
  n != null && !isNaN(n) ? parseFloat(String(n)).toFixed(5) : '—'

/** Round to 2 decimal places */
export const p2 = (n: number): number => parseFloat(n.toFixed(2))

/** Format to 2 decimal places as string */
export const fmt2 = (n: number | null | undefined): string =>
  n != null && !isNaN(n) ? parseFloat(String(n)).toFixed(2) : '—'

/** Format pips with 'p' suffix */
export const fmtPips = (pips: number): string =>
  `${pips >= 0 ? '' : '-'}${Math.abs(Math.round(pips))}p`

/** Format PnL with + prefix and $ suffix */
export const fmtPnl = (pnl: number): string => {
  const abs = Math.abs(pnl).toFixed(2)
  if (pnl > 0) return `+$${abs}`
  if (pnl < 0) return `-$${abs}`
  return `+$0.00`
}
