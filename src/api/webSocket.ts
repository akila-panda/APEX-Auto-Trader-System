/**
 * webSocket.ts
 * Manages the Twelve Data WebSocket connection for live EUR/USD price streaming.
 * Includes reconnect logic and poll fallback.
 */

import { TD_WS_URL, SYMBOL, WS_RECONNECT_DELAY_MS } from '../config/api.config'
import { fetchPrice } from './twelveData'

export type PriceCallback = (price: number) => void
export type StatusCallback = (connected: boolean) => void

let ws:           WebSocket | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null
let onPrice:      PriceCallback  | null = null
let onStatus:     StatusCallback | null = null

export function connectWebSocket(
  priceCallback:  PriceCallback,
  statusCallback: StatusCallback,
): void {
  onPrice  = priceCallback
  onStatus = statusCallback
  openConnection()
}

function openConnection(): void {
  stopPollFallback()
  try {
    ws = new WebSocket(TD_WS_URL)

    ws.onopen = () => {
      onStatus?.(true)
      ws?.send(JSON.stringify({ action: 'subscribe', params: { symbols: SYMBOL } }))
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as { event?: string; symbol?: string; price?: string }
        if (msg.event === 'price' && msg.symbol === SYMBOL && msg.price) {
          onPrice?.(parseFloat(msg.price))
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onerror = () => {
      onStatus?.(false)
      startPollFallback()
    }

    ws.onclose = () => {
      onStatus?.(false)
      setTimeout(openConnection, WS_RECONNECT_DELAY_MS)
    }
  } catch {
    startPollFallback()
  }
}

export function disconnectWebSocket(): void {
  ws?.close()
  ws = null
  stopPollFallback()
}

function startPollFallback(): void {
  if (pollInterval) return
  pollInterval = setInterval(async () => {
    const price = await fetchPrice()
    if (price) onPrice?.(price)
  }, 5_000)
}

function stopPollFallback(): void {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
}
