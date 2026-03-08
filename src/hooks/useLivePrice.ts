// src/hooks/useLivePrice.ts
/**
 * useLivePrice.ts
 * Subscribes to the WebSocket price feed and updates the market store.
 */

import { useEffect } from 'react'
import { useMarketStore } from '../store/useMarketStore'
import { connectWebSocket, disconnectWebSocket } from '../api/webSocket'

export function useLivePrice(): void {
  const setPrice     = useMarketStore(s => s.setPrice)
  const pushHistory  = useMarketStore(s => s.pushPriceHistory)
  const setConnected = useMarketStore(s => s.setWsConnected)
  const setStatus    = useMarketStore(s => s.setApiStatus)

  useEffect(() => {
    connectWebSocket(
      (price) => { setPrice(price); pushHistory(price) },
      (connected) => {
        setConnected(connected)
        setStatus(connected ? 'live' : 'loading')
      },
    )
    return () => disconnectWebSocket()
  }, [setPrice, pushHistory, setConnected, setStatus])
}
