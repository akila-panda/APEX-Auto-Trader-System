/**
 * sessionEngine.ts
 * Full ICT session detection engine.
 *
 * Detects and tracks:
 *  - Asia Range (20:00–00:00 UTC) — accumulation, defines initial SSL/BSL
 *  - London Session (03:00–12:00 UTC) — sweep + expansion phase
 *  - New York Session (12:00–21:00 UTC) — continuation or reversal
 *  - Silver Bullet Windows (03–04, 10–11, 15–16 UTC) — highest-probability ICT entries
 *  - Session phase: ASIA | LONDON_OPEN | LONDON_MAIN | NY_OPEN | NY_MAIN | DEAD_ZONE
 *
 * This replaces the partial killzone logic in killZoneConfluence.ts.
 * killZoneConfluence.ts still works for the cf_kz boolean — this engine adds
 * richer session context for the Strategy Engine and tradingPipeline.
 */

import type { Candle } from '../../types/candle.types'
import { SILVER_BULLET_WINDOWS } from '../../config/trading.config'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionPhase =
  | 'ASIA'
  | 'LONDON_OPEN'     // 03–07 UTC  — London pre-market / early sweep
  | 'LONDON_MAIN'     // 07–10 UTC  — main London KZ (already in killZoneConfluence)
  | 'NY_OPEN'         // 12–13 UTC  — NY open power hour
  | 'NY_MAIN'         // 13–15 UTC  — main NY KZ
  | 'NY_LATE'         // 15–17 UTC  — Silver Bullet 3 / fading
  | 'DEAD_ZONE'       // 17–20 UTC  — no trading

export interface AsiaRange {
  high:    number | null
  low:     number | null
  mid:     number | null
  defined: boolean
}

export interface SessionEngineResult {
  phase:           SessionPhase
  inKillZone:      boolean      // London 07-10 or NY 12-15 (matches existing cf_kz)
  inSilverBullet:  boolean      // inside a Silver Bullet window
  silverBulletIdx: number       // 0=none, 1=03-04, 2=10-11, 3=15-16
  asiaRange:       AsiaRange
  sessionLabel:    string       // human-readable label for UI
  isWeekend:       boolean
  utcHour:         number
  utcMinute:       number
}

// ─── Asia Range Builder ────────────────────────────────────────────────────────

/**
 * Calculates the Asia session range from candles that fall within the Asia window.
 * Asia = 20:00 UTC previous evening to 00:00 UTC current day.
 *
 * [BUG #2 FIX] Original used c.timestamp — Candle interface uses c.datetime (string).
 */
export function buildAsiaRange(candles: Candle[]): AsiaRange {
  if (!candles || candles.length === 0) {
    return { high: null, low: null, mid: null, defined: false }
  }

  const asiaCandles = candles.filter(c => {
    const d    = new Date(c.datetime)   // FIX: was c.timestamp — Candle uses datetime: string
    const hour = d.getUTCHours()
    // Asia = 20:00–23:59 UTC (previous evening) + 00:00 if any
    return !isNaN(d.getTime()) && (hour >= 20 || hour < 1)
  })

  if (asiaCandles.length === 0) {
    return { high: null, low: null, mid: null, defined: false }
  }

  const high = Math.max(...asiaCandles.map(c => c.high))
  const low  = Math.min(...asiaCandles.map(c => c.low))
  const mid  = (high + low) / 2

  return { high, low, mid, defined: true }
}

// ─── Phase Classifier ─────────────────────────────────────────────────────────

function classifyPhase(utcHour: number): SessionPhase {
  if (utcHour >= 20 || utcHour < 3)  return 'ASIA'
  if (utcHour >= 3  && utcHour < 7)  return 'LONDON_OPEN'
  if (utcHour >= 7  && utcHour < 10) return 'LONDON_MAIN'
  if (utcHour >= 10 && utcHour < 12) return 'LONDON_OPEN'  // London close / NY pre
  if (utcHour >= 12 && utcHour < 13) return 'NY_OPEN'
  if (utcHour >= 13 && utcHour < 15) return 'NY_MAIN'
  if (utcHour >= 15 && utcHour < 17) return 'NY_LATE'
  return 'DEAD_ZONE'
}

function phaseLabel(phase: SessionPhase): string {
  const labels: Record<SessionPhase, string> = {
    ASIA:         '🌙 Asia Range',
    LONDON_OPEN:  '🇬🇧 London Open',
    LONDON_MAIN:  '🇬🇧 London Killzone',
    NY_OPEN:      '🗽 NY Open',
    NY_MAIN:      '🗽 NY Killzone',
    NY_LATE:      '🗽 NY Late / Silver Bullet',
    DEAD_ZONE:    '💤 Dead Zone',
  }
  return labels[phase]
}

// ─── Silver Bullet Checker ────────────────────────────────────────────────────

function detectSilverBullet(utcHour: number, utcMinute: number): { active: boolean; idx: number } {
  const totalMins = utcHour * 60 + utcMinute
  for (let i = 0; i < SILVER_BULLET_WINDOWS.length; i++) {
    const w = SILVER_BULLET_WINDOWS[i]
    if (totalMins >= w.start * 60 && totalMins < w.end * 60) {
      return { active: true, idx: i + 1 }
    }
  }
  return { active: false, idx: 0 }
}

// ─── Kill Zone Check (matches existing killZoneConfluence.ts logic) ───────────

function isInKillZone(utcHour: number, utcMinute: number, isWeekend: boolean): boolean {
  if (isWeekend) return false
  const total   = utcHour * 60 + utcMinute
  const london  = total >= 7 * 60  && total < 10 * 60
  const ny      = total >= 12 * 60 && total < 15 * 60
  return london || ny
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Runs the full session engine.
 * Call once per bot cycle with live candles + current UTC time.
 *
 * @param candles   - recent candles (used to build Asia range)
 * @param now       - current Date (defaults to Date.now())
 */
export function runSessionEngine(
  candles: Candle[],
  now: Date = new Date(),
): SessionEngineResult {
  const utcHour    = now.getUTCHours()
  const utcMinute  = now.getUTCMinutes()
  const dayOfWeek  = now.getUTCDay()   // 0=Sun, 6=Sat
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6

  const phase         = classifyPhase(utcHour)
  const inKillZone    = isInKillZone(utcHour, utcMinute, isWeekend)
  const sb            = detectSilverBullet(utcHour, utcMinute)
  const asiaRange     = buildAsiaRange(candles)
  const sessionLabel  = phaseLabel(phase)

  return {
    phase,
    inKillZone,
    inSilverBullet:  sb.active,
    silverBulletIdx: sb.idx,
    asiaRange,
    sessionLabel,
    isWeekend,
    utcHour,
    utcMinute,
  }
}
