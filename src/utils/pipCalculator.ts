/**
 * pipCalculator.ts
 * Pip distance and value conversions for EUR/USD.
 */
import { PIP, PIP_VALUE } from '../config/trading.config'

/** Distance in pips between two prices */
export const pipDistance = (a: number, b: number): number =>
  Math.abs(Math.round((a - b) / PIP))

/** USD value of N pips at 1 standard lot */
export const pipValueUSD = (pips: number): number => pips * PIP_VALUE
