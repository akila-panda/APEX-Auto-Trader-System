/**
 * signalGenerator.ts
 * Determines signal direction from analysis result.
 * [FIX A-2] Direction driven by actual user macro bias, not hardcoded.
 */
import type { SignalType } from '../../types/analysis.types'

export interface SignalFilterSettings {
  minScore:    number
  kzOnly:      boolean
  macroFilter: boolean
  newsFilter:  boolean
}

/**
 * Returns the signal direction if all filter conditions are met,
 * or 'WAIT' if any filter blocks the trade.
 * [FIX A-2] Signal direction is always derived from macro.bias, not hardcoded.
 */
export function generateSignal(
  effectiveScore: number,
  bias:          string,
  cf_kz:         boolean,
  cf_news:       boolean,
  settings:      SignalFilterSettings,
): SignalType {
  const kzPass    = settings.kzOnly    ? cf_kz    : true
  const macroPass = settings.macroFilter ? bias !== 'neutral' : true
  const newsPass  = settings.newsFilter  ? cf_news : true

  if (effectiveScore >= settings.minScore && kzPass && macroPass && newsPass) {
    // [FIX A-2] Direction from user's macro bias
    if (bias === 'bullish') return 'LONG'
    if (bias === 'bearish') return 'SHORT'
  }

  return 'WAIT'
}
