// src/api/mt5Bridge.ts
/**
 * mt5Bridge.ts
 * TypeScript adapter that reads candle data from the local MT5 listener
 * instead of the Twelve Data API.
 *
 * Drop-in replacement for fetchCandles() in twelveData.ts:
 *   - Identical function signature
 *   - Returns Candle[] | null (null on any failure)
 *   - Applies snap() to all four price fields
 *   - Does NOT import from twelveData.ts or rateLimit.ts
 *
 * The MT5 EA (mt5_ea/APEX2_Bridge.mq5) pushes candle data to the listener
 * via POST /mt5/candles. This adapter reads it back via GET /mt5/read.
 *
 * Symbol mapping (Twelve Data format → filename format):
 *   'EUR/USD' → 'EURUSD'
 *   'GBP/USD' → 'GBPUSD'
 */

import type { Candle } from '../types/candle.types'
import { MT5_BRIDGE_URL } from '../config/api.config'
import { snap } from '../utils/priceFormat'

// Raw shape returned by the listener — same fields the EA writes
interface RawCandle {
  datetime: string
  open:     number | string
  high:     number | string
  low:      number | string
  close:    number | string
}

/**
 * Maps a Twelve Data–style symbol string to the uppercase filename format
 * used by the MT5 listener.
 *   'EUR/USD' → 'EURUSD'
 *   'GBP/USD' → 'GBPUSD'
 *   'EURUSD'  → 'EURUSD'  (already correct — passed through unchanged)
 */
function toListenerSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase()
}

/**
 * Fetches candles from the local MT5 listener.
 *
 * Signature is identical to fetchCandles() in twelveData.ts so App.tsx
 * can swap between the two with a single feature flag.
 *
 * @param interval   - APEX2 TF id: '1day' | '4h' | '1h' | '30min' | '15min' | '5min'
 * @param outputsize - ignored (listener returns whatever the EA pushed, max 80)
 * @param symbol     - Twelve Data format, e.g. 'EUR/USD' or 'GBP/USD'
 * @returns Candle[] on success, null on any error
 */
export async function fetchCandlesMT5(
interval:   string,
  _outputsize: number = 80,
  symbol:     string = 'EUR/USD',
): Promise<Candle[] | null> {
  const listenerSymbol = toListenerSymbol(symbol)
  const url = `${MT5_BRIDGE_URL}/mt5/read?symbol=${listenerSymbol}&timeframe=${interval}`

  try {
    const res = await fetch(url)

    if (res.status === 404) {
      // No data pushed yet for this TF — not an error, just not ready
      console.warn(`[MT5 Bridge] No data yet for ${listenerSymbol} ${interval}`)
      return null
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[MT5 Bridge] HTTP ${res.status} for ${listenerSymbol} ${interval}: ${body}`)
      return null
    }

    const raw = await res.json() as RawCandle[]

    if (!Array.isArray(raw) || raw.length === 0) {
      console.warn(`[MT5 Bridge] Empty candle array for ${listenerSymbol} ${interval}`)
      return null
    }

    // Apply snap() to all four price fields — same treatment as twelveData.ts
    const candles: Candle[] = raw.map(c => ({
      open:     snap(parseFloat(String(c.open))),
      high:     snap(parseFloat(String(c.high))),
      low:      snap(parseFloat(String(c.low))),
      close:    snap(parseFloat(String(c.close))),
      datetime: c.datetime,
    }))

    return candles
  } catch (err) {
    console.error(`[MT5 Bridge] fetch error for ${listenerSymbol} ${interval}:`, err)
    return null
  }
}