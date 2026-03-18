export {
  filterSpread,
  filterVolatility,
  filterRiskReward,
  runAllFilters,
  calculateATR,
  DEFAULT_SPREAD_LIMITS,
  DEFAULT_ATR_LIMITS,
} from './signalFilters'

export type {
  SpreadFilterResult,
  VolatilityFilterResult,
  RRFilterResult,
  CombinedFilterResult,
  CombinedFilterInput,
} from './signalFilters'
