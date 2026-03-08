import { create } from 'zustand'
import type { MacroInputs, MacroBias, MacroStrength, MacroBiasResult } from '../types/macro.types'
import {
  MACRO_BULLISH_THRESHOLD,
  MACRO_BEARISH_THRESHOLD,
  MACRO_STRONG_THRESHOLD,
  MACRO_MEDIUM_THRESHOLD,
} from '../config/trading.config'

interface MacroStore {
  /** [FIX A-2] All factors default to 0 — no hardcoded values */
  inputs: MacroInputs
  locked: boolean

  setFactor: (factor: keyof MacroInputs, value: -1 | 0 | 1) => void
  lock:      () => void
  unlock:    () => void

  /** Derived: recompute bias from current inputs */
  computedBias:     () => MacroBias
  computedScore:    () => number
  computedStrength: () => MacroStrength
  computedResult:   () => MacroBiasResult
}

export const useMacroStore = create<MacroStore>((set, get) => ({
  inputs: { rateDiff: 0, dxy: 0, cot: 0, dataDiv: 0, geo: 0 },
  locked: false,

  setFactor: (factor, value) => set((s) => ({
    inputs: { ...s.inputs, [factor]: value },
    locked: false,
  })),

  lock:   () => set({ locked: true }),
  unlock: () => set({ locked: false }),

  computedScore: () => {
    const { inputs } = get()
    return Object.values(inputs).reduce((a, b) => a + b, 0)
  },

  computedBias: () => {
    const score = get().computedScore()
    if (score > MACRO_BULLISH_THRESHOLD)  return 'bullish'
    if (score < MACRO_BEARISH_THRESHOLD)  return 'bearish'
    return 'neutral'
  },

  computedStrength: () => {
    const score = get().computedScore()
    const abs   = Math.abs(score)
    if (abs >= MACRO_STRONG_THRESHOLD) return 'STRONG'
    if (abs >= MACRO_MEDIUM_THRESHOLD) return 'MEDIUM'
    return 'WEAK'
  },

  computedResult: () => ({
    bias:     get().computedBias(),
    total:    get().computedScore(),
    strength: get().computedStrength(),
  }),
}))
