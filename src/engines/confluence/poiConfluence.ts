// src/engines/confluence/poiConfluence.ts
/**
 * poiConfluence.ts
 * [FIX C-1] cf_poi: OB or FVG within POI_PROXIMITY_PIPS of current price.
 *
 * Previous bug: required price to be inside the OB body.
 * Fix: Math.abs(price - poi.mid) < POI_PROXIMITY_PIPS * PIP — proximity only, not containment.
 */
import type { OrderBlock, FVGLevel } from '../../types/analysis.types'
import type { MacroBias } from '../../types/macro.types'
import { POI_PROXIMITY_PIPS, PIP } from '../../config/trading.config'

export function evaluatePOIConfluence(
  bullOB:  OrderBlock | null,
  bearOB:  OrderBlock | null,
  fvgBull: FVGLevel   | null,
  fvgBear: FVGLevel   | null,
  price:   number,
  bias:    MacroBias,
): boolean {
  const proximity = POI_PROXIMITY_PIPS * PIP

  const nearBullOB  = bullOB  != null && Math.abs(price - bullOB.mid)  < proximity
  const nearBearOB  = bearOB  != null && Math.abs(price - bearOB.mid)  < proximity
  const nearBullFVG = fvgBull != null && Math.abs(price - fvgBull.mid) < proximity
  const nearBearFVG = fvgBear != null && Math.abs(price - fvgBear.mid) < proximity

  if (bias === 'bullish') return nearBullOB || nearBullFVG
  if (bias === 'bearish') return nearBearOB || nearBearFVG
  return false
}
