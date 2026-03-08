/**
 * useMacroBias.ts
 * Reads macro store and exposes computed bias, score, strength.
 * [FIX A-2] Bias always derived from user inputs.
 */
import { useMacroStore } from '../store/useMacroStore'
import type { MacroBiasResult } from '../types/macro.types'

export function useMacroBias(): MacroBiasResult {
  const result = useMacroStore(s => s.computedResult())
  return result
}
