/**
 * newsConfluence.ts — cf_news: no high-impact event within ±NEWS_PROXIMITY_MINS
 */
import { NEWS_PROXIMITY_MINS } from '../../config/trading.config'

export interface CalendarEvent {
  date:   Date
  impact: 'high' | 'med' | 'low'
  name:   string
  cur:    string
}

export function evaluateNewsConfluence(
  events:      CalendarEvent[],
  windowMins?: number,
): boolean {
  const win = (windowMins ?? NEWS_PROXIMITY_MINS) * 60 * 1000
  const now  = Date.now()
  return !events
    .filter(ev => ev.impact === 'high')
    .some(ev => Math.abs(ev.date.getTime() - now) < win)
}
