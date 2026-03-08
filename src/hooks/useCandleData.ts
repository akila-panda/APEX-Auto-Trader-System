// src/hooks/useCandleData.ts
/**
 * useCandleData.ts
 * React Query wrapper for candle fetching per timeframe.
 */

import { useQuery } from '@tanstack/react-query'
import { useMarketStore } from '../store/useMarketStore'
import { fetchCandles } from '../api/twelveData'
import { isCacheFresh, generateFallbackCandles } from '../api/candleCache'
import { CANDLE_CACHE_TTL_MS } from '../config/api.config'

export function useCandleData(tfId: string) {
  const setCandles    = useMarketStore(s => s.setCandles)
  const setApiStatus  = useMarketStore(s => s.setApiStatus)
  const candleFetchedAt = useMarketStore(s => s.candleFetchedAt)

  return useQuery({
    queryKey: ['candles', tfId],
    queryFn:  async () => {
      if (isCacheFresh(tfId, candleFetchedAt)) {
        return useMarketStore.getState().candles[tfId] ?? []
      }
      setApiStatus('loading')
      const candles = await fetchCandles(tfId, 80)
      if (candles && candles.length > 0) {
        setCandles(tfId, candles)
        setApiStatus('live')
        return candles
      }
      const fallback = generateFallbackCandles(tfId, 80)
      setCandles(tfId, fallback)
      setApiStatus('simulated')
      return fallback
    },
    staleTime:    CANDLE_CACHE_TTL_MS,
    refetchInterval: CANDLE_CACHE_TTL_MS,
    retry:        2,
  })
}
