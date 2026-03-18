/**
 * smtDivergenceEngine.ts
 * SMT (Smart Money Technique) Divergence Engine.
 *
 * ICT concept:
 *   Correlated instruments (e.g. EURUSD & GBPUSD, ES & NQ) should make
 *   the same swing highs/lows in sync. When one makes a new high/low and
 *   the correlated pair does NOT confirm it, that divergence signals that
 *   institutional money is distributing/accumulating — a high-probability
 *   reversal cue.
 *
 * How it works:
 *   - Pair A makes a new swing high  → Pair B fails to make a new swing high
 *     → BEARISH SMT divergence (distribution at highs)
 *   - Pair A makes a new swing low   → Pair B fails to make a new swing low
 *     → BULLISH SMT divergence (accumulation at lows)
 *
 * Usage in APEX2:
 *   Feed it candles for two correlated pairs on the same timeframe.
 *   Common pairs:
 *     EURUSD / GBPUSD   (both USD-denominated, highly correlated)
 *     XAUUSD / XAGUSD   (metals)
 *     NAS100 / US500    (indices)
 *
 * The result feeds into the Strategy Engine and Confluence Engine as
 * an additional high-conviction confirmation signal.
 */

import type { Candle } from '../../types/candle.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SMTDivergenceType = 'BULLISH' | 'BEARISH' | 'NONE'

export interface SMTSwingPoint {
  idx:   number
  price: number
}

export interface SMTDivergenceResult {
  divergence:    SMTDivergenceType
  confirmed:     boolean
  pairA_label:   string
  pairB_label:   string
  description:   string
  /** swing high/low that diverged on pairA */
  divergenceLevel: number | null
  /** swing high/low that confirmed (or failed) on pairB */
  confirmLevel:    number | null
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the last N confirmed 3-bar swing highs and lows.
 * Uses the same 3-bar strict rule as pivotDetection.ts.
 */
function getSwingPoints(
  candles: Candle[],
  lookback = 40,
): { highs: SMTSwingPoint[]; lows: SMTSwingPoint[] } {
  const recent = candles.slice(-lookback)
  const highs: SMTSwingPoint[] = []
  const lows:  SMTSwingPoint[] = []

  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      highs.push({ idx: i, price: recent[i].high })
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      lows.push({ idx: i, price: recent[i].low })
    }
  }

  return { highs, lows }
}

// ─── Main SMT Logic ───────────────────────────────────────────────────────────

/**
 * Detects SMT divergence between two correlated instruments.
 *
 * @param candlesA   - candles for primary pair (e.g. EURUSD)
 * @param candlesB   - candles for correlated pair (e.g. GBPUSD)
 * @param labelA     - display name for pair A
 * @param labelB     - display name for pair B
 * @param lookback   - number of candles to scan (default 40)
 * @param tolerance  - % tolerance for "same" swing (default 0.1 = 10bps)
 */
export function detectSMTDivergence(
  candlesA:  Candle[],
  candlesB:  Candle[],
  labelA     = 'PairA',
  labelB     = 'PairB',
  lookback   = 40,
  tolerance  = 0.001,  // 0.1% price tolerance for "equal" swing comparison
): SMTDivergenceResult {

  const noDiv: SMTDivergenceResult = {
    divergence:      'NONE',
    confirmed:       false,
    pairA_label:     labelA,
    pairB_label:     labelB,
    description:     'No SMT divergence detected',
    divergenceLevel: null,
    confirmLevel:    null,
  }

  if (candlesA.length < 10 || candlesB.length < 10) return noDiv

  const swingsA = getSwingPoints(candlesA, lookback)
  const swingsB = getSwingPoints(candlesB, lookback)

  if (swingsA.highs.length < 2 || swingsB.highs.length < 2) return noDiv
  if (swingsA.lows.length  < 2 || swingsB.lows.length  < 2) return noDiv

  const lastHighA = swingsA.highs[swingsA.highs.length - 1].price
  const prevHighA = swingsA.highs[swingsA.highs.length - 2].price
  const lastHighB = swingsB.highs[swingsB.highs.length - 1].price
  const prevHighB = swingsB.highs[swingsB.highs.length - 2].price

  const lastLowA  = swingsA.lows[swingsA.lows.length - 1].price
  const prevLowA  = swingsA.lows[swingsA.lows.length - 2].price
  const lastLowB  = swingsB.lows[swingsB.lows.length - 1].price
  const prevLowB  = swingsB.lows[swingsB.lows.length - 2].price

  // ── Bearish SMT: A makes Higher High, B fails to make Higher High ──────────
  //    A: lastHigh > prevHigh (HH)
  //    B: lastHigh <= prevHigh (no HH — fail to confirm)
  const aNewHigh = lastHighA > prevHighA * (1 + tolerance)
  const bFailsHH = lastHighB <= prevHighB * (1 + tolerance)

  if (aNewHigh && bFailsHH) {
    return {
      divergence:      'BEARISH',
      confirmed:       true,
      pairA_label:     labelA,
      pairB_label:     labelB,
      description:     `⚠️ BEARISH SMT: ${labelA} made HH at ${lastHighA.toFixed(5)} but ${labelB} failed to confirm (${lastHighB.toFixed(5)}) — distribution at highs`,
      divergenceLevel: lastHighA,
      confirmLevel:    lastHighB,
    }
  }

  // ── Bullish SMT: A makes Lower Low, B fails to make Lower Low ─────────────
  //    A: lastLow < prevLow (LL)
  //    B: lastLow >= prevLow (no LL — fail to confirm)
  const aNewLow  = lastLowA < prevLowA * (1 - tolerance)
  const bFailsLL = lastLowB >= prevLowB * (1 - tolerance)

  if (aNewLow && bFailsLL) {
    return {
      divergence:      'BULLISH',
      confirmed:       true,
      pairA_label:     labelA,
      pairB_label:     labelB,
      description:     `✅ BULLISH SMT: ${labelA} made LL at ${lastLowA.toFixed(5)} but ${labelB} failed to confirm (${lastLowB.toFixed(5)}) — accumulation at lows`,
      divergenceLevel: lastLowA,
      confirmLevel:    lastLowB,
    }
  }

  return noDiv
}

// ─── Multi-Pair Scanner ───────────────────────────────────────────────────────

export interface SMTPairConfig {
  labelA:   string
  labelB:   string
  candlesA: Candle[]
  candlesB: Candle[]
}

/**
 * Scans multiple correlated pair combinations for SMT divergence.
 * Returns the first confirmed divergence found, or NONE if none found.
 * Use this when your system tracks multiple instruments.
 */
export function scanSMTDivergence(pairs: SMTPairConfig[]): SMTDivergenceResult {
  for (const pair of pairs) {
    const result = detectSMTDivergence(
      pair.candlesA,
      pair.candlesB,
      pair.labelA,
      pair.labelB,
    )
    if (result.confirmed) return result
  }

  return {
    divergence:      'NONE',
    confirmed:       false,
    pairA_label:     '',
    pairB_label:     '',
    description:     'No SMT divergence across any pair',
    divergenceLevel: null,
    confirmLevel:    null,
  }
}
