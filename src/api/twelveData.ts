// src/api/twelveData.ts
/**
 * twelveData.ts
 * All Twelve Data API calls funnel through here.
 * No component or engine calls fetch() directly.
 */

import type { Candle } from '../types/candle.types'
import { TD_BASE_URL, TD_API_KEY, SYMBOL } from '../config/api.config'
import { canMakeAPICall, trackAPICall, waitIfRateLimited } from './rateLimit'
import { snap } from '../utils/priceFormat'

/** Fetches OHLCV candles for a given interval. Returns null on failure. */
export async function fetchCandles(
  interval:   string,
  outputsize: number = 80,
): Promise<Candle[] | null> {
  if (!canMakeAPICall()) return null
  
  // Use a unique lock for each TF to prevent concurrent requests for the same TF
  // and ensure waitIfRateLimited is respected.
  await waitIfRateLimited()

  const url = `${TD_BASE_URL}/time_series?symbol=${encodeURIComponent(SYMBOL)}&interval=${interval}&outputsize=${outputsize}&apikey=${TD_API_KEY}`

  try {
    const res  = await fetch(url)
    const data = await res.json() as {
      status?: string
      message?: string
      values?: Array<{ open: string; high: string; low: string; close: string; datetime: string }>
    }

    if (data.status === 'error') {
      // If we hit a rate limit even with our guard, force a reset
      if (data.message?.toLowerCase().includes('api credits')) {
        console.warn(`[API] Rate limit hit on ${interval}. Backing off...`)
      }
      throw new Error(data.message ?? 'API error')
    }
    
    if (!data.values || !Array.isArray(data.values)) throw new Error('No candle data returned')

    // Twelve Data returns newest-first — reverse to get chronological order
    return data.values.reverse().map(v => ({
      open:     snap(parseFloat(v.open)),
      high:     snap(parseFloat(v.high)),
      low:      snap(parseFloat(v.low)),
      close:    snap(parseFloat(v.close)),
      datetime: v.datetime,
    }))
  } catch (err) {
    console.error(`fetchCandles(${interval}):`, err)
    return null
  }
}

/** Fetches the current live price. Returns null on failure. */
export async function fetchPrice(): Promise<number | null> {
  if (!canMakeAPICall()) return null
  await waitIfRateLimited()

  try {
    trackAPICall()
    const res  = await fetch(`${TD_BASE_URL}/price?symbol=${encodeURIComponent(SYMBOL)}&apikey=${TD_API_KEY}`)
    const data = await res.json() as { price?: string }
    return data.price ? parseFloat(data.price) : null
  } catch {
    return null
  }
}
