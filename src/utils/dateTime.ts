// src/utils/dateTime.ts
/**
 * dateTime.ts
 * UTC date/time formatting utilities.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** "HH:MM" in UTC */
export const fmtT = (): string => {
  const d = new Date()
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** "YYYY-MM-DD HH:MM UTC" */
export const fmtDT = (): string => {
  const d = new Date()
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

/** "YYYY-M-D" string used as UTC date key for daily limit checks */
export const fmtUTCDate = (): string => {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

/** "HH:MM:SS UTC" */
export const fmtClock = (): string => {
  const d = new Date()
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}
