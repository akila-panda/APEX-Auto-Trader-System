// src/store/useBotStore.ts
import { create } from 'zustand'
import type { AnalysisResult } from '../types/analysis.types'

interface BotStore {
  running:          boolean
  /** [FIX A-1] cycleRunning is synchronously updated — not React state — to prevent re-renders causing race conditions */
  cycleRunning:     boolean
  scanCycles:       number
  /** [FIX A-3] Only incremented post-filter in evaluateSignals() */
  totalSignals:     number
  totalBlocked:     number
  lastTradeTime:    number
  /** [FIX A-5] Direction of last trade for cooldown guard */
  lastTradeDirection: 'LONG' | 'SHORT' | null
  activeSignals:    AnalysisResult[]
  scanIntervalMs:   number
  minScore:         number
  maxTradesPerDay:  number
  cooldownMins:     number
  kzOnly:           boolean
  macroFilter:      boolean
  newsFilter:       boolean

  start:              () => void
  stop:               () => void
  setCycleRunning:    (v: boolean) => void
  incrementScans:     () => void
  /** [FIX A-3] Called only in evaluateSignals() after ALL filters pass */
  incrementSignals:   () => void
  incrementBlocked:   () => void
  setActiveSignals:   (signals: AnalysisResult[]) => void
  setLastTrade:       (time: number, direction: 'LONG' | 'SHORT') => void
  setSetting:         <K extends keyof BotSettings>(key: K, value: BotSettings[K]) => void
}

export interface BotSettings {
  scanIntervalMs:  number
  minScore:        number
  maxTradesPerDay: number
  cooldownMins:    number
  kzOnly:          boolean
  macroFilter:     boolean
  newsFilter:      boolean
}

export const useBotStore = create<BotStore>((set) => ({
  running:            false,
  cycleRunning:       false,
  scanCycles:         0,
  totalSignals:       0,
  totalBlocked:       0,
  lastTradeTime:      0,
  lastTradeDirection: null,
  activeSignals:      [],
  scanIntervalMs:     300_000,
  minScore:           8,   // APEX2: weighted system scores 0–17.5 (was 4 on 0–5 scale)
  maxTradesPerDay:    3,
  cooldownMins:       30,
  kzOnly:             true,
  macroFilter:        true,
  newsFilter:         true,

  start:  () => set({ running: true }),
  stop:   () => set({ running: false }),

  setCycleRunning: (v) => set({ cycleRunning: v }),
  incrementScans:  ()  => set((s) => ({ scanCycles:  s.scanCycles  + 1 })),
  incrementSignals:()  => set((s) => ({ totalSignals: s.totalSignals + 1 })),
  incrementBlocked:()  => set((s) => ({ totalBlocked: s.totalBlocked + 1 })),

  setActiveSignals: (signals) => set({ activeSignals: signals }),

  setLastTrade: (time, direction) => set({
    lastTradeTime:      time,
    lastTradeDirection: direction,
  }),

  setSetting: (key, value) => set({ [key]: value } as Partial<BotStore>),
}))
