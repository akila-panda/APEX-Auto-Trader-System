import type { RiskParams } from './trade.types'
import type { MacroBias, MacroStrength } from './macro.types'

export type SignalType = 'LONG' | 'SHORT' | 'WAIT'

export interface MarketStructureResult {
  structure: 'bullish' | 'bearish' | 'ranging'
  swingHigh: number
  swingLow: number
  equilibrium: number
  inDiscount: boolean
  inPremium: boolean
  swingHighs: Array<{ idx: number; price: number }>
  swingLows:  Array<{ idx: number; price: number }>
}

export interface OrderBlock {
  bot: number
  top: number
  mid: number
}

export interface OrderBlockResult {
  bullOB: OrderBlock | null
  bearOB: OrderBlock | null
}

export interface FVGLevel {
  low: number
  high: number
  mid: number
}

export interface FVGResult {
  fvgBull: FVGLevel | null
  fvgBear: FVGLevel | null
}

export interface LiquidityResult {
  swept: boolean
  direction: 'bullish' | 'bearish' | null
  bsl: number
  ssl: number
  label: string
  asianRange: { high: number | null; low: number | null }
}

export interface BOSResult {
  bos: boolean
  choch: boolean
  displacement: boolean
  direction: 'bullish' | 'bearish' | null
  label: string
  displacementHigh: number | null
  displacementLow:  number | null
  impulseHigh: number | null
  impulseLow:  number | null
}

export interface OTEResult {
  ote62:    number | null
  ote79:    number | null
  oteSweet: number | null
  inOTE:    boolean
  range:    number
  direction: 'bullish' | 'bearish' | null
}

export interface ConfluenceResult {
  cf_macro:     boolean
  cf_structure: boolean
  cf_poi:       boolean
  cf_htf:       boolean
  cf_sweep:     boolean
  cf_mss:       boolean
  cf_ote:       boolean
  cf_kz:        boolean
  cf_news:      boolean
  coreScore:     number
  effectiveScore: number
  macroBonus:    number
}

export interface AnalysisResult {
  tfId:           string
  signal:         SignalType
  entry:          number
  coreScore:      number
  effectiveScore: number
  macro:          { bias: MacroBias; total: number; strength: MacroStrength }
  sess:           SessionInfo
  sessLabel:      string
  isLive:         boolean
  adr:            number
  cf_macro:     boolean
  cf_structure: boolean
  cf_poi:       boolean
  cf_htf:       boolean
  cf_sweep:     boolean
  cf_mss:       boolean
  cf_ote:       boolean
  cf_kz:        boolean
  cf_news:      boolean
  struct:        MarketStructureResult
  obs:           OrderBlockResult
  fvgs:          FVGResult
  sweepR:        LiquidityResult
  bosR:          BOSResult
  ote:           OTEResult
  risk:          RiskParams
  bias:          MacroBias
  macroStrength: MacroStrength
  equilibrium:   number
  bullOB:        OrderBlock | null
  bearOB:        OrderBlock | null
  fvgBull:       FVGLevel | null
  fvgBear:       FVGLevel | null
  displacementHigh: number | null
  displacementLow:  number | null
  impulseHigh:   number | null
  impulseLow:    number | null
  asianRange:    { high: number | null; low: number | null }
  bosLabel:      string
  sweepLabel:    string
  zoneLabel:     string
  dataSource:    string
  analysisText:  string
  lessonText:    string
  timestamp:     number
}

export interface SessionInfo {
  h:            number
  m:            number
  total:        number
  isLondon:     boolean
  isNY:         boolean
  isAsia:       boolean
  isWeekend:    boolean
  inKZ:         boolean
  inLondonKZ:   boolean
  inNYKZ:       boolean
  sessionName:  string
}
