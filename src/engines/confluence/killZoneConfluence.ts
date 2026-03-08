/**
 * killZoneConfluence.ts — cf_kz: London 07–10 or NY 12–15 UTC
 */
import {
  LONDON_KZ_START, LONDON_KZ_END,
  NY_KZ_START, NY_KZ_END,
} from '../../config/trading.config'

export function evaluateKillZoneConfluence(utcHour: number, utcMinute: number, isWeekend: boolean): boolean {
  if (isWeekend) return false
  const total = utcHour * 60 + utcMinute
  const inLondon = total >= LONDON_KZ_START * 60 && total < LONDON_KZ_END * 60
  const inNY     = total >= NY_KZ_START * 60     && total < NY_KZ_END * 60
  return inLondon || inNY
}
