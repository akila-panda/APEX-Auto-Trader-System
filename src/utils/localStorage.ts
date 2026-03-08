/**
 * localStorage.ts
 * Versioned persistence for trades. Schema v3 — old schemas are cleared on detection.
 */

import type { Trade } from '../types/trade.types'
import { SCHEMA_VERSION } from '../config/trading.config'

const STORAGE_KEY = 'apex_v3_trades'

interface PersistedData {
  v:      number
  trades: Trade[]
  nextId: number
}

export function saveTrades(data: { trades: Trade[]; nextId: number }): void {
  try {
    const payload: PersistedData = { v: SCHEMA_VERSION, ...data }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch { /* storage full or unavailable */ }
}

export function loadTrades(): { trades: Trade[]; nextId: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedData
    if (!data.v || data.v < SCHEMA_VERSION) {
      // Schema migration — clear old data
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { trades: data.trades ?? [], nextId: data.nextId ?? 1 }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearTrades(): void {
  localStorage.removeItem(STORAGE_KEY)
}
