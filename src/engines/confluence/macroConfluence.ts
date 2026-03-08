// src/engines/confluence/macroConfluence.ts
/**
 * macroConfluence.ts
 * cf_macro: User macro bias is not neutral (FIX A-2)
 */
import type { MacroBias } from '../../types/macro.types'
/** Returns true if macro bias has been set to bullish or bearish by the user. */
export function evaluateMacroConfluence(bias: MacroBias): boolean {
  return bias !== 'neutral'
}
