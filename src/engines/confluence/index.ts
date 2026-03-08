// src/engines/confluence/index.ts
/**
 * engines/confluence/index.ts
 * Module contract:
 *   evaluateConfluence(params) → ConfluenceResult
 */

import type { ConfluenceResult, OrderBlockResult, FVGResult, LiquidityResult, BOSResult, OTEResult, MarketStructureResult } from '../../types/analysis.types'
import type { MacroBiasResult } from '../../types/macro.types'
import type { CalendarEvent } from './newsConfluence'
import type { SessionInfo } from '../../types/analysis.types'

import { evaluateMacroConfluence }     from './macroConfluence'
import { evaluateStructureConfluence } from './structureConfluence'
import { evaluatePOIConfluence }       from './poiConfluence'
import { evaluateSweepConfluence }     from './sweepConfluence'
import { evaluateMSSConfluence }       from './mssConfluence'
import { evaluateOTEConfluence }       from './oteConfluence'
import { evaluateKillZoneConfluence }  from './killZoneConfluence'
import { evaluateNewsConfluence }      from './newsConfluence'
import { scoreConfluence }             from './confluenceScorer'

export interface ConfluenceParams {
  macro:   MacroBiasResult
  struct:  MarketStructureResult
  obs:     OrderBlockResult
  fvgs:    FVGResult
  sweepR:  LiquidityResult
  bosR:    BOSResult
  ote:     OTEResult
  sess:    SessionInfo
  events:  CalendarEvent[]
  currentPrice: number
}

export function evaluateConfluence(params: ConfluenceParams): ConfluenceResult {
  const { macro, struct, obs, fvgs, sweepR, bosR, ote, sess, events, currentPrice } = params

  const cf_macro     = evaluateMacroConfluence(macro.bias)
  const cf_structure = evaluateStructureConfluence(struct, macro.bias)
  const cf_poi       = evaluatePOIConfluence(obs.bullOB, obs.bearOB, fvgs.fvgBull, fvgs.fvgBear, currentPrice, macro.bias)
  const cf_htf       = cf_structure && cf_poi
  const cf_sweep     = evaluateSweepConfluence(sweepR.swept, sweepR.direction, macro.bias)
  const cf_mss       = evaluateMSSConfluence(bosR.bos, bosR.choch, bosR.direction, macro.bias)
  const cf_ote       = evaluateOTEConfluence(ote.inOTE)
  const cf_kz        = evaluateKillZoneConfluence(sess.h, sess.m, sess.isWeekend)
  const cf_news      = evaluateNewsConfluence(events)

  const { coreScore, macroBonus, effectiveScore } = scoreConfluence({
    cf_macro, cf_htf, cf_sweep, cf_mss, cf_ote, strength: macro.strength,
  })

  return {
    cf_macro, cf_structure, cf_poi, cf_htf,
    cf_sweep, cf_mss, cf_ote, cf_kz, cf_news,
    coreScore, effectiveScore, macroBonus,
  }
}
