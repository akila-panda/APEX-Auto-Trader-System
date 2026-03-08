// src/engines/liquidity/liquidityLevelMapper.ts
/**
 * liquidityLevelMapper.ts
 * Maps Buy-Side Liquidity (BSL) and Sell-Side Liquidity (SSL) levels
 * from confirmed swing pivot points.
 *
 * ICT concept:
 * - BSL (Buy-Side Liquidity) = resting orders above swing highs (stop-losses of shorts)
 * - SSL (Sell-Side Liquidity) = resting orders below swing lows (stop-losses of longs)
 * Smart money targets these pools before reversing.
 */

import type { PivotPoint } from '../market-structure/pivotDetection'
import { snap } from '../../utils/priceFormat'

export interface LiquidityLevels {
  bsl: number  // most recent swing high = buy-side liquidity
  ssl: number  // most recent swing low  = sell-side liquidity
}

/**
 * Returns BSL/SSL from the most recent confirmed pivot swing points.
 * Falls back to provided swing high/low if no pivots are available.
 */
export function mapLiquidityLevels(
  swingHighs: PivotPoint[],
  swingLows:  PivotPoint[],
  fallbackHigh: number,
  fallbackLow:  number,
): LiquidityLevels {
  const bsl = swingHighs.length > 0
    ? snap(swingHighs[swingHighs.length - 1].price)
    : snap(fallbackHigh)
  const ssl = swingLows.length > 0
    ? snap(swingLows[swingLows.length - 1].price)
    : snap(fallbackLow)
  return { bsl, ssl }
}
