/**
 * signalFilters.ts
 * Pre-signal quality filters: Spread, Volatility (ATR), and Risk/Reward validation.
 *
 * These three filters run BEFORE a signal is created, inside the Strategy Engine
 * and tradingPipeline. Each filter can independently reject a trade.
 *
 * Rejection reasons are collected so the UI can explain exactly why a trade was blocked.
 *
 * ─── Filter 1: Spread Filter ───────────────────────────────────────────────
 *   Rejects trades when live spread exceeds a per-instrument limit.
 *   Critical for scalping — a 3-pip spread on a 15-pip SL means you start -20% down.
 *
 * ─── Filter 2: Volatility Filter (ATR) ─────────────────────────────────────
 *   Rejects trades when ATR is below minimum (dead market) or above maximum (chaotic).
 *   ATR too low  → price unlikely to move to TP → low reward
 *   ATR too high → SL likely to be hit by noise → random outcomes
 *
 * ─── Filter 3: RR Validation ────────────────────────────────────────────────
 *   Calculates the real Risk/Reward ratio from entry, SL, and TP.
 *   Rejects any trade below the configured minimum RR (default 1.5R).
 */

import type { Candle } from '../../types/candle.types'
import { PIP, TP1_RATIO } from '../../config/trading.config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpreadFilterResult {
  passed:       boolean
  spread:       number        // in pips
  maxAllowed:   number        // in pips
  reason:       string
}

export interface VolatilityFilterResult {
  passed:       boolean
  atr:          number        // in pips
  minAtr:       number
  maxAtr:       number
  reason:       string
}

export interface RRFilterResult {
  passed:       boolean
  rr:           number        // calculated RR ratio
  minRR:        number        // required minimum
  reason:       string
}

export interface CombinedFilterResult {
  passed:       boolean       // true only if ALL filters pass
  spread:       SpreadFilterResult
  volatility:   VolatilityFilterResult
  rr:           RRFilterResult
  blockedBy:    string[]      // list of filter names that rejected
}

// ─── Default Limits ───────────────────────────────────────────────────────────

/** Per-instrument spread limits in pips. Extend as needed. */
export const DEFAULT_SPREAD_LIMITS: Record<string, number> = {
  EURUSD: 1.5,
  GBPUSD: 2.0,
  USDJPY: 1.5,
  XAUUSD: 3.0,   // Gold — wider spread is normal
  GBPJPY: 3.0,
  NASDAQ: 5.0,
  DEFAULT: 2.5,
}

/** ATR thresholds in pips. Extend per instrument. */
export const DEFAULT_ATR_LIMITS: Record<string, { min: number; max: number }> = {
  EURUSD: { min: 5,   max: 60  },
  GBPUSD: { min: 7,   max: 80  },
  USDJPY: { min: 5,   max: 60  },
  XAUUSD: { min: 50,  max: 800 },
  GBPJPY: { min: 10,  max: 120 },
  NASDAQ: { min: 20,  max: 500 },
  DEFAULT: { min: 5,  max: 100 },
}

// ─── ATR Calculator ───────────────────────────────────────────────────────────

/**
 * Calculates Average True Range over the last `period` candles.
 * Returns ATR in pips (divided by PIP constant).
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0

  const recent = candles.slice(-(period + 1))
  const trs: number[] = []

  for (let i = 1; i < recent.length; i++) {
    const high  = recent[i].high
    const low   = recent[i].low
    const close = recent[i - 1].close
    const tr = Math.max(
      high - low,
      Math.abs(high - close),
      Math.abs(low  - close),
    )
    trs.push(tr)
  }

  const atrRaw = trs.reduce((a, b) => a + b, 0) / trs.length
  return atrRaw / PIP  // convert to pips
}

// ─── Filter 1: Spread ─────────────────────────────────────────────────────────

/**
 * Validates that current spread is within the acceptable limit for the symbol.
 *
 * @param spreadPips   - live spread in pips from your broker feed
 * @param symbol       - instrument symbol (e.g. "EURUSD")
 * @param customLimits - optional override map for spread limits
 */
export function filterSpread(
  spreadPips:   number,
  symbol:       string,
  customLimits?: Record<string, number>,
): SpreadFilterResult {
  const limits   = customLimits ?? DEFAULT_SPREAD_LIMITS
  const maxPips  = limits[symbol.toUpperCase()] ?? limits['DEFAULT']
  const passed   = spreadPips <= maxPips

  return {
    passed,
    spread:     spreadPips,
    maxAllowed: maxPips,
    reason: passed
      ? `Spread OK: ${spreadPips.toFixed(1)}p ≤ ${maxPips}p`
      : `❌ Spread too wide: ${spreadPips.toFixed(1)}p > ${maxPips}p limit — trade rejected`,
  }
}

// ─── Filter 2: Volatility (ATR) ───────────────────────────────────────────────

/**
 * Validates market has sufficient (but not excessive) volatility to trade.
 *
 * @param candles      - recent candle data for ATR calculation
 * @param symbol       - instrument symbol
 * @param atrPeriod    - ATR period (default 14)
 * @param customLimits - optional override map for ATR limits
 */
export function filterVolatility(
  candles:      Candle[],
  symbol:       string,
  atrPeriod     = 14,
  customLimits?: Record<string, { min: number; max: number }>,
): VolatilityFilterResult {
  const limits  = customLimits ?? DEFAULT_ATR_LIMITS
  const bounds  = limits[symbol.toUpperCase()] ?? limits['DEFAULT']
  const atr     = calculateATR(candles, atrPeriod)

  if (atr === 0) {
    return {
      passed:   false,
      atr:      0,
      minAtr:   bounds.min,
      maxAtr:   bounds.max,
      reason:   '❌ ATR calculation failed — insufficient candle data',
    }
  }

  const tooLow  = atr < bounds.min
  const tooHigh = atr > bounds.max
  const passed  = !tooLow && !tooHigh

  let reason: string
  if (tooLow)  reason = `❌ ATR too low: ${atr.toFixed(1)}p < ${bounds.min}p minimum — dead market`
  else if (tooHigh) reason = `❌ ATR too high: ${atr.toFixed(1)}p > ${bounds.max}p maximum — chaotic market`
  else reason = `Volatility OK: ATR ${atr.toFixed(1)}p (range ${bounds.min}–${bounds.max}p)`

  return { passed, atr, minAtr: bounds.min, maxAtr: bounds.max, reason }
}

// ─── Filter 3: Risk/Reward Validation ────────────────────────────────────────

/**
 * Validates minimum Risk/Reward ratio before trade is created.
 *
 * @param entry      - proposed entry price
 * @param stopLoss   - stop loss price
 * @param takeProfit - take profit price (TP1 recommended)
 * @param minRR      - minimum acceptable RR (default 1.5 from trading.config TP1_RATIO)
 */
export function filterRiskReward(
  entry:      number,
  stopLoss:   number,
  takeProfit: number,
  minRR       = TP1_RATIO,
): RRFilterResult {
  const risk   = Math.abs(entry - stopLoss)
  const reward = Math.abs(takeProfit - entry)

  if (risk === 0) {
    return {
      passed: false,
      rr:     0,
      minRR,
      reason: '❌ RR invalid: stop loss equals entry price',
    }
  }

  const rr     = reward / risk
  const passed = rr >= minRR

  return {
    passed,
    rr,
    minRR,
    reason: passed
      ? `RR OK: ${rr.toFixed(2)}R ≥ ${minRR}R minimum`
      : `❌ RR too low: ${rr.toFixed(2)}R < ${minRR}R minimum — trade rejected`,
  }
}

// ─── Combined Filter Runner ───────────────────────────────────────────────────

export interface CombinedFilterInput {
  spreadPips:   number
  candles:      Candle[]
  symbol:       string
  entry:        number
  stopLoss:     number
  takeProfit:   number
  minRR?:       number
  spreadLimits?: Record<string, number>
  atrLimits?:   Record<string, { min: number; max: number }>
}

/**
 * Runs all three filters and returns a single combined result.
 * A trade only proceeds if ALL filters pass.
 *
 * Usage in tradingPipeline.ts:
 *   const filters = runAllFilters({ spreadPips, candles, symbol, entry, sl, tp })
 *   if (!filters.passed) return null
 */
export function runAllFilters(input: CombinedFilterInput): CombinedFilterResult {
  const spread     = filterSpread(input.spreadPips, input.symbol, input.spreadLimits)
  const volatility = filterVolatility(input.candles, input.symbol, 14, input.atrLimits)
  const rr         = filterRiskReward(input.entry, input.stopLoss, input.takeProfit, input.minRR)

  const blockedBy: string[] = []
  if (!spread.passed)     blockedBy.push('SPREAD')
  if (!volatility.passed) blockedBy.push('VOLATILITY')
  if (!rr.passed)         blockedBy.push('RR')

  return {
    passed: blockedBy.length === 0,
    spread,
    volatility,
    rr,
    blockedBy,
  }
}
