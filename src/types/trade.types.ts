export type TradeStatus = 'WIN' | 'LOSS' | 'BE' | 'OPEN'

export interface RiskParams {
  lots:     number
  sl:       number
  tp1:      number
  tp2:      number
  runner:   number
  slPips:   number
  tp1Pips:  number
  tp2Pips:  number
}

export interface Trade {
  id:             string
  timestamp:      string
  pair:           string
  tf:             string
  direction:      'LONG' | 'SHORT'
  entry:          number
  stopLoss:       number
  takeProfit1:    number
  takeProfit2:    number
  runner:         number
  exitPrice:      number
  slPips:         number
  pips:           number
  pnl:            number
  rMultiple:      number
  riskAmount:     number
  lots:           number
  confluenceScore:  number
  effectiveScore:   number
  status:         TradeStatus
  session:        string
  macroBias:      string
  macroScore:     number
  macroStrength:  string
  confluences:    Record<string, boolean>
  cfNames:        string[]
  analysisText:   string
  lessonText:     string
  bosLabel:       string
  sweepLabel:     string
  zoneLabel:      string
  signalSource:   string
  outcomeType:    string
}
