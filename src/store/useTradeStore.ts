import { create } from 'zustand'
import type { Trade } from '../types/trade.types'
import { loadTrades, saveTrades } from '../utils/localStorage'

interface TradeStore {
  trades:       Trade[]
  nextTradeId:  number
  tradesToday:  number
  lastTradeDate: string

  addTrade:       (trade: Trade) => void
  clearTrades:    () => void
  loadPersisted:  () => void
  incrementToday: () => void
  resetTodayIfNeeded: (utcDate: string) => void
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  trades:        [],
  nextTradeId:   1,
  tradesToday:   0,
  lastTradeDate: '',

  addTrade: (trade) => {
    set((s) => {
      const trades     = [...s.trades, trade]
      const nextTradeId = s.nextTradeId + 1
      saveTrades({ trades, nextId: nextTradeId })
      return { trades, nextTradeId }
    })
    get().incrementToday()
  },

  clearTrades: () => {
    const nextTradeId = 1
    saveTrades({ trades: [], nextId: nextTradeId })
    set({ trades: [], nextTradeId, tradesToday: 0 })
  },

  loadPersisted: () => {
    const data = loadTrades()
    if (data) {
      set({ trades: data.trades, nextTradeId: data.nextId })
    }
  },

  incrementToday: () => set((s) => ({ tradesToday: s.tradesToday + 1 })),

  resetTodayIfNeeded: (utcDate) => set((s) => {
    if (s.lastTradeDate !== utcDate) {
      return { tradesToday: 0, lastTradeDate: utcDate }
    }
    return {}
  }),
}))
