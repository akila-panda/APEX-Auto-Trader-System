/**
 * tradeExecutor.ts
 * Creates a trade record with a probability-weighted simulated outcome.
 * All outcomes are clearly labeled as SIMULATED — not real executions.
 */

import type { Trade } from '../../types/trade.types'
import type { AnalysisResult } from '../../types/analysis.types'
import { fmtDT } from '../../utils/dateTime'
import { snap, p2 } from '../../utils/priceFormat'
import {
  RISK_AMOUNT, SL_PIPS, TP1_RATIO, TP2_RATIO
} from '../../config/trading.config'

export function executeTrade(
  A:           AnalysisResult,
  nextTradeId: number,
): Trade {
  const { signal, entry, risk, macro, sess, coreScore, effectiveScore,
          cf_macro, cf_htf, cf_sweep, cf_mss, cf_ote, cf_kz, cf_news, isLive } = A

  // Probability-weighted simulation — session and score influence win rate
  const baseWR  = sess.inLondonKZ ? 0.65 : sess.inNYKZ ? 0.62 : 0.55
  const bonusWR = coreScore === 5 ? 0.05 : 0
  const isWin   = Math.random() < (baseWR + bonusWR)
  const hitTP2  = isWin && Math.random() < 0.55
  const isBE    = !isWin && Math.random() < 0.20

  let exitPrice: number, pipCount: number, pnl: number, rMultiple: number, status: Trade['status']

  if (hitTP2)  { exitPrice = risk.tp2; pipCount = risk.tp2Pips;  pnl = p2(RISK_AMOUNT * TP2_RATIO); rMultiple = TP2_RATIO;  status = 'WIN'  }
  else if (isWin) { exitPrice = risk.tp1; pipCount = risk.tp1Pips; pnl = p2(RISK_AMOUNT * TP1_RATIO); rMultiple = TP1_RATIO; status = 'WIN' }
  else if (isBE) { exitPrice = entry;    pipCount = 0;            pnl = 0;                            rMultiple = 0;         status = 'BE'   }
  else           { exitPrice = risk.sl;  pipCount = -SL_PIPS;     pnl = -RISK_AMOUNT;                 rMultiple = -1;        status = 'LOSS' }

  if (signal === 'SHORT') pipCount = -pipCount

  return {
    id:             `#${String(nextTradeId).padStart(4, '0')}`,
    timestamp:      fmtDT(),
    pair:           'EUR/USD',
    tf:             A.tfId,
    direction:      signal as 'LONG' | 'SHORT',
    entry:          snap(entry),
    stopLoss:       risk.sl,
    takeProfit1:    risk.tp1,
    takeProfit2:    risk.tp2,
    runner:         risk.runner,
    exitPrice:      snap(exitPrice),
    slPips:         SL_PIPS,
    pips:           Math.round(pipCount),
    pnl,
    rMultiple,
    riskAmount:     RISK_AMOUNT,
    lots:           risk.lots,
    confluenceScore:  coreScore,
    effectiveScore,
    status,
    session:        A.sessLabel,
    macroBias:      macro.bias,
    macroScore:     macro.total,
    macroStrength:  macro.strength,
    confluences:    { cf_macro, cf_htf, cf_sweep, cf_mss, cf_ote, cf_kz, cf_news },
    cfNames:        ['Macro Bias', 'HTF+POI', 'Liq Sweep', 'MSS+BOS', 'OTE Zone', 'Kill Zone', 'No News'],
    analysisText:   A.analysisText,
    lessonText:     A.lessonText,
    bosLabel:       A.bosR.label,
    sweepLabel:     A.sweepR.label,
    zoneLabel:      A.zoneLabel,
    signalSource:   isLive ? 'LIVE CANDLES' : 'SIMULATED CANDLES',
    outcomeType:    'SIMULATED OUTCOME',
  }
}
