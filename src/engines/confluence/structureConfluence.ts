// src/engines/confluence/structureConfluence.ts
/**
 * structureConfluence.ts
 * [FIX C-1] cf_structure: HTF structure matches macro bias AND price is in the right zone.
 * This is one half of the split cf_htf point.
 */
import type { MarketStructureResult } from '../../types/analysis.types'
import type { MacroBias } from '../../types/macro.types'

export function evaluateStructureConfluence(
  struct: MarketStructureResult,
  bias:   MacroBias,
): boolean {
  if (bias === 'neutral') return false
  const inRightZone = bias === 'bullish' ? struct.inDiscount : struct.inPremium
  return struct.structure === bias && inRightZone
}
