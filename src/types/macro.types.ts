// src/types/macro.types.ts
export type MacroBias     = 'bullish' | 'bearish' | 'neutral'
export type MacroStrength = 'STRONG' | 'MEDIUM' | 'WEAK'

export interface MacroInputs {
  rateDiff: -1 | 0 | 1   // Fed vs ECB spread
  dxy:      -1 | 0 | 1   // DXY direction
  cot:      -1 | 0 | 1   // COT net position
  dataDiv:  -1 | 0 | 1   // EU/US data divergence
  geo:      -1 | 0 | 1   // Geopolitical / Risk
}

export interface MacroBiasResult {
  bias:     MacroBias
  total:    number
  strength: MacroStrength
}
