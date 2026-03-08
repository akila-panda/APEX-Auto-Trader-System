import { create } from 'zustand'
import type { Candle } from '../types/candle.types'
import type { AnalysisResult } from '../types/analysis.types'
import { fetchCandles as apiFetchCandles } from '../api/twelveData'
import { CANDLE_CACHE_TTL_MS as CANDLE_CACHE_TTL } from '../config/api.config'

export type ApiStatus = 'live' | 'loading' | 'error' | 'simulated'

interface SweepWindow {
  expiry:    number
  direction: 'bullish' | 'bearish'
}

export interface FeedItemData {
  time:  string
  badge: string
  cls:   string
  msg:   string
}

interface MarketStore {
  currentPrice:   number
  prevPrice:      number
  priceHistory:   number[]
  candles:        Record<string, Candle[]>
  candleFetchedAt: Record<string, number>
  wsConnected:    boolean
  apiStatus:      ApiStatus
  activeTF:       string
  activeTFLabel:  string
  sweepWindowExpiry: Record<string, SweepWindow>
  tfAnalysis:     Record<string, AnalysisResult>
  feedItems:      FeedItemData[]
  apiCallsToday:  number

  setPrice:       (price: number) => void
  setCandles:     (tfId: string, candles: Candle[]) => void
  setAnalysis:    (tfId: string, result: AnalysisResult) => void
  setWsConnected: (connected: boolean) => void
  setApiStatus:   (status: ApiStatus) => void
  setActiveTF:    (tfId: string, label: string) => void
  setSweepWindow: (tfId: string, window: SweepWindow | null) => void
  pushPriceHistory: (price: number) => void
  addFeedItem:    (item: FeedItemData) => void
  clearFeed:      () => void
  incrementApiCalls: () => void
  refreshCandlesForTF: (tfId: string) => Promise<boolean>
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  currentPrice:   0,
  prevPrice:      0,
  priceHistory:   [],
  candles:        {},
  candleFetchedAt: {},
  wsConnected:    false,
  apiStatus:      'loading',
  activeTF:       '4h',
  activeTFLabel:  '4H',
  sweepWindowExpiry: {},
  tfAnalysis:     {},
  feedItems:      [],
  apiCallsToday:  0,

  setPrice: (price) => set((s) => ({
    prevPrice:    s.currentPrice || price,
    currentPrice: price,
  })),

  setCandles: (tfId, candles) => set((s) => ({
    candles:          { ...s.candles, [tfId]: candles },
    candleFetchedAt:  { ...s.candleFetchedAt, [tfId]: Date.now() },
  })),

  setAnalysis: (tfId, result) => set((s) => ({
    tfAnalysis: { ...s.tfAnalysis, [tfId]: result },
  })),

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setApiStatus:   (status)    => set({ apiStatus: status }),

  setActiveTF: (tfId, label) => set({ activeTF: tfId, activeTFLabel: label }),

  setSweepWindow: (tfId, window) => set((s) => {
    const next = { ...s.sweepWindowExpiry }
    if (window === null) {
      delete next[tfId]
    } else {
      next[tfId] = window
    }
    return { sweepWindowExpiry: next }
  }),

  pushPriceHistory: (price) => set((s) => {
    const hist = [...s.priceHistory, price]
    return { priceHistory: hist.length > 300 ? hist.slice(-300) : hist }
  }),

  addFeedItem: (item) => set((s) => {
    const items = [item, ...s.feedItems].slice(0, 80)
    return { feedItems: items }
  }),

  clearFeed: () => set({ feedItems: [] }),

  incrementApiCalls: () => set((s) => ({ apiCallsToday: s.apiCallsToday + 1 })),

  refreshCandlesForTF: async (tfId) => {
    const s = get()
    const cached = s.candles[tfId]
    const fetchedAt = s.candleFetchedAt[tfId] ?? 0
    const fresh = cached?.length > 0 && (Date.now() - fetchedAt < CANDLE_CACHE_TTL)
    if (fresh) return true

    s.setApiStatus('loading')
    try {
      const candles = await apiFetchCandles(tfId, 80)
      if (candles && candles.length > 0) {
        s.setCandles(tfId, candles)
        s.setApiStatus('live')
        s.incrementApiCalls()
        return true
      }
    } catch {
      // fall through to simulated
    }
    s.setApiStatus('simulated')
    return false
  },
}))
