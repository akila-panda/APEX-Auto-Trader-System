// src/engines/liquidity/sweepDetector.ts
/**
 * sweepDetector.ts
 * [FIX C-2] Detects liquidity sweeps over a 6-candle window, persisting validity
 * for SWEEP_EXPIRY_CANDLES candles using a per-TF expiry map.
 *
 * ICT concept: Smart money "sweeps" liquidity pools (swing highs = BSL, swing lows = SSL)
 * by briefly breaching them with a wick, then closing back inside — trapping retail traders.
 * A sweep is valid if:
 * - Price wicks above the swing high (BSL sweep) and candle closes BELOW it, OR
 * - Price wicks below the swing low (SSL sweep) and candle closes ABOVE it.
 *
 * Previous bug: only checked the LAST candle, missing sweeps from 1-5 candles ago.
 * Fix: scan ALL SWEEP_CANDLE_WINDOW candles newest-first, persist via sweepWindowExpiry map.
 */

import type { Candle } from '../../types/candle.types'
import type { MarketStructureResult } from '../../types/analysis.types'
import { SWEEP_CANDLE_WINDOW, SWEEP_EXPIRY_CANDLES } from '../../config/trading.config'
import { TF_INTERVAL_MS } from '../../config/timeframes.config'

export interface SweepWindowExpiry {
  expiry:    number
  direction: 'bullish' | 'bearish'
}

export interface SweepDetectorResult {
  swept:           boolean
  direction:       'bullish' | 'bearish' | null
  label:           string
  updatedExpiry:   SweepWindowExpiry | null
}

/**
 * Scans the last SWEEP_CANDLE_WINDOW candles for a liquidity sweep.
 * Also checks the Asian range if provided.
 * Returns whether a sweep occurred and direction (bullish = SSL swept = buy signal).
 *
 * [FIX C-2] sweepWindowExpiry is passed in and returned (not stored globally here).
 */
export function detectSweep(
  candles:        Candle[],
  struct:         MarketStructureResult,
  asianRange:     { high: number | null; low: number | null },
  tfId:           string,
  currentExpiry:  SweepWindowExpiry | null,
): SweepDetectorResult {
  if (!candles || candles.length < 1) {
    return { swept: false, direction: null, label: 'Monitoring...', updatedExpiry: currentExpiry }
  }

  const window   = candles.slice(-SWEEP_CANDLE_WINDOW)
  const swingH   = struct.swingHigh
  const swingL   = struct.swingLow
  const now      = Date.now()

  let swept    = false
  let dir: 'bullish' | 'bearish' | null = null
  let updatedExpiry: SweepWindowExpiry | null = currentExpiry

  // [FIX C-2] Scan ALL candles in window, newest-first for most-recent match
  for (let i = window.length - 1; i >= 0; i--) {
    const c = window[i]

    const sweptH   = c.high > swingH && c.close < swingH
    const sweptL   = c.low  < swingL && c.close > swingL
    const asianBSL = asianRange.high != null && c.high > asianRange.high && c.close < asianRange.high
    const asianSSL = asianRange.low  != null && c.low  < asianRange.low  && c.close > asianRange.low

    if (sweptH || asianBSL) {
      swept = true; dir = 'bearish'; break
    }
    if (sweptL || asianSSL) {
      swept = true; dir = 'bullish'; break
    }
  }

  // Persist sweep in validity window: SWEEP_EXPIRY_CANDLES candles
  if (swept && dir) {
    const candleMs = TF_INTERVAL_MS[tfId] ?? 300_000
    updatedExpiry  = { expiry: now + candleMs * SWEEP_EXPIRY_CANDLES, direction: dir }
  }

  // Use persisted sweep if still within validity window and no new sweep
  if (!swept && currentExpiry) {
    if (currentExpiry.expiry > now) {
      swept = true
      dir   = currentExpiry.direction
    } else {
      updatedExpiry = null  // expired — clear it
    }
  }

  const label = swept
    ? `⚡ ${dir === 'bullish' ? 'SSL' : 'BSL'} sweep confirmed${currentExpiry ? ' [valid window]' : ''}`
    : 'No active sweep detected'

  return { swept, direction: dir, label, updatedExpiry }
}
