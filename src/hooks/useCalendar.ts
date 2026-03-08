/**
 * useCalendar.ts
 * Builds the weekly high-impact economic calendar and checks for nearby events.
 */

import { useMemo } from 'react'
import type { CalendarEvent } from '../engines/confluence/newsConfluence'
import { evaluateNewsConfluence } from '../engines/confluence/newsConfluence'
import { NEWS_PROXIMITY_MINS } from '../config/trading.config'

function buildWeeklyCalendar(): CalendarEvent[] {
  const now    = new Date()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7))
  monday.setUTCHours(0, 0, 0, 0)

  const template: Array<{ offsetDays: number; h: number; m: number; name: string; impact: 'high' | 'med' | 'low'; cur: string }> = [
    { offsetDays:0, h:13, m:30, name:'German Manufacturing PMI',    impact:'med',  cur:'EUR' },
    { offsetDays:0, h:14, m:0,  name:'Eurozone Sentix',             impact:'med',  cur:'EUR' },
    { offsetDays:1, h:9,  m:0,  name:'Eurozone PPI',                impact:'med',  cur:'EUR' },
    { offsetDays:1, h:14, m:0,  name:'US JOLTS Job Openings',       impact:'high', cur:'USD' },
    { offsetDays:2, h:7,  m:0,  name:'German Retail Sales',         impact:'med',  cur:'EUR' },
    { offsetDays:2, h:13, m:15, name:'ADP Employment Change',       impact:'high', cur:'USD' },
    { offsetDays:2, h:14, m:0,  name:'US ISM Services PMI',         impact:'high', cur:'USD' },
    { offsetDays:2, h:18, m:0,  name:'FOMC Minutes',                impact:'high', cur:'USD' },
    { offsetDays:3, h:8,  m:55, name:'German Unemployment Change',  impact:'high', cur:'EUR' },
    { offsetDays:3, h:10, m:0,  name:'Eurozone CPI Flash',          impact:'high', cur:'EUR' },
    { offsetDays:3, h:13, m:30, name:'US Initial Jobless Claims',   impact:'med',  cur:'USD' },
    { offsetDays:3, h:15, m:0,  name:'US Factory Orders',           impact:'low',  cur:'USD' },
    { offsetDays:4, h:8,  m:30, name:'Eurozone Retail Sales',       impact:'med',  cur:'EUR' },
    { offsetDays:4, h:13, m:30, name:'US NFP + Unemployment Rate',  impact:'high', cur:'USD' },
    { offsetDays:4, h:15, m:0,  name:'US Michigan Consumer Sentiment', impact:'med', cur:'USD' },
  ]

  return template.map(ev => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + ev.offsetDays)
    d.setUTCHours(ev.h, ev.m, 0, 0)
    return { ...ev, date: d }
  })
}

export function useCalendar() {
  const events     = useMemo(() => buildWeeklyCalendar(), [])
  const isNewsClear = evaluateNewsConfluence(events, NEWS_PROXIMITY_MINS)
  const isNewsNearby = (mins: number) => !evaluateNewsConfluence(events, mins)
  const nextHighImpact = events
    .filter(e => e.impact === 'high' && e.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null

  return { events, isNewsClear, isNewsNearby, nextHighImpact }
}
