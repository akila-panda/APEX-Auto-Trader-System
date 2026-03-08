// src/engines/auto-trader/index.ts
/**
 * engines/auto-trader/index.ts
 * Module contract:
 *   runBotCycle(state) → BotCycleResult
 */

export { runBotCycle } from './botCycleOrchestrator'
export type { BotCycleState, BotCycleResult } from './botCycleOrchestrator'
