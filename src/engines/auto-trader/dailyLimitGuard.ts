/**
 * dailyLimitGuard.ts
 * UTC date-based daily trade limit enforcement.
 * UTC date prevents timezone drift bugs (trades placed at 23:59 local ≠ 00:01 UTC).
 */

import { fmtUTCDate } from '../../utils/dateTime'

export interface DailyLimitState {
  tradesToday:   number
  lastTradeDate: string
}

export interface DailyLimitResult {
  allowed:      boolean
  todayCount:   number
  updatedDate:  string
}

/**
 * Checks if another trade is allowed today (UTC).
 * Resets the counter when the UTC date changes.
 */
export function checkDailyLimit(
  state:          DailyLimitState,
  maxTradesPerDay: number,
): DailyLimitResult {
  const today       = fmtUTCDate()
  const todayCount  = state.lastTradeDate !== today ? 0 : state.tradesToday

  return {
    allowed:     todayCount < maxTradesPerDay,
    todayCount,
    updatedDate: today,
  }
}
