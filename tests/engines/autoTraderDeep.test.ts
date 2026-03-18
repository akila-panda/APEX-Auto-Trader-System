// tests/engines/autoTraderDeep.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runBotCycle } from '../../src/engines/auto-trader/botCycleOrchestrator'
import { fmtUTCDate } from '../../src/utils/dateTime'
import type { AnalysisResult } from '../../src/types/analysis.types'
import type { BotCycleState } from '../../src/engines/auto-trader/botCycleOrchestrator'
import type { Trade } from '../../src/types/trade.types'

// Mock executeTrade to avoid fetch() calls
vi.mock('../../src/engines/auto-trader/tradeExecutor', () => ({
  executeTrade: vi.fn((A: AnalysisResult, id: number) => ({
    id: `#${String(id).padStart(4, '0')}`,
    status: 'OPEN',
    direction: A.signal,
    pair: 'EUR/USD',
  } as Trade))
}))

function makeMockAnalysis(overrides: any = {}): AnalysisResult {
  const base = {
    tfId: '1h',
    signal: 'WAIT',
    effectiveScore: 3.0,
    struct: { 
      structure: 'ranging',
      swingHigh: 0,
      swingLow: 0,
      equilibrium: 0,
      inDiscount: false,
      inPremium: false,
      swingHighs: [],
      swingLows: [],
    },
    bosR: { 
      bos: false,
      choch: false,
      displacement: false,
      direction: null,
      label: '',
      displacementHigh: null,
      displacementLow: null,
      impulseHigh: null,
      impulseLow: null,
    },
    macro: { bias: 'neutral' },
  }
  return {
    ...base,
    ...overrides,
    struct: { ...base.struct, ...(overrides.struct || {}) },
    bosR: { ...base.bosR, ...(overrides.bosR || {}) },
  } as any
}

const defaultSettings = {
  scanIntervalMs: 300000,
  minScore: 4.0,
  maxTradesPerDay: 3,
  cooldownMins: 30,
  kzOnly: false,
  macroFilter: false,
  newsFilter: false,
}

const defaultState: BotCycleState = {
  settings: defaultSettings,
  cooldown: { lastTradeTime: 0, lastTradeDirection: null },
  tradesToday: 0,
  lastTradeDate: fmtUTCDate(),
  nextTradeId: 1,
  isNewsNearby: false,
  allResults: [],
  openTrades: [],
}

describe('AutoTrader Deep Test (Bot Cycle Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks when no signals are found', async () => {
    const state = { ...defaultState, allResults: [makeMockAnalysis({ signal: 'WAIT' })] }
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.signalFound).toBe(false)
  })

  it('executes trade when a valid LONG signal is found with structure confirmation', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const state = { ...defaultState, allResults: [analysis] }
    
    const result = await runBotCycle(state)
    expect(result.trade).not.toBeNull()
    expect(result.trade?.direction).toBe('LONG')
    expect(result.blocked).toBe(false)
  })

  it('blocks signal if effectiveScore is below minScore', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 3.5, // default minScore is 4.0
      struct: { structure: 'bullish' }
    })
    const state = { ...defaultState, allResults: [analysis] }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('confidence')
  })

  it('blocks signal if market structure is not confirmed', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bearish' } // conflict
    })
    const state = { ...defaultState, allResults: [analysis] }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('structure')
  })

  it('allows signal if structure is ranging but BOS is confirmed in signal direction', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'ranging' },
      bosR: { bos: true, direction: 'bullish' }
    })
    const state = { ...defaultState, allResults: [analysis] }
    
    const result = await runBotCycle(state)
    expect(result.trade).not.toBeNull()
    expect(result.trade?.direction).toBe('LONG')
  })

  it('blocks signal if a conflicting open trade exists', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const openTrade = { pair: 'EUR/USD', direction: 'SHORT', status: 'OPEN' } as Trade
    const state = { ...defaultState, allResults: [analysis], openTrades: [openTrade] }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('Conflicting open position')
  })

  it('allows signal if an existing open trade is in the SAME direction', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const openTrade = { pair: 'EUR/USD', direction: 'LONG', status: 'OPEN' } as Trade
    const state = { ...defaultState, allResults: [analysis], openTrades: [openTrade] }
    
    const result = await runBotCycle(state)
    expect(result.trade).not.toBeNull()
    expect(result.trade?.direction).toBe('LONG')
  })

  it('blocks by daily trade limit', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const state = { 
      ...defaultState, 
      allResults: [analysis], 
      tradesToday: 3, // limit is 3
      lastTradeDate: fmtUTCDate() 
    }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('Daily trade limit')
  })

  it('blocks by news filter if news is nearby', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const state = { 
      ...defaultState, 
      allResults: [analysis], 
      settings: { ...defaultSettings, newsFilter: true },
      isNewsNearby: true 
    }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('news')
  })

  it('blocks by cooldown if same direction trade was recent', async () => {
    const analysis = makeMockAnalysis({
      signal: 'LONG',
      effectiveScore: 4.5,
      struct: { structure: 'bullish' }
    })
    const state: any = { 
      ...defaultState, 
      allResults: [analysis], 
      cooldown: { lastTradeTime: Date.now() - 5 * 60 * 1000, lastTradeDirection: 'LONG' }, // 5 mins ago
      settings: { ...defaultSettings, cooldownMins: 30 }
    }
    
    const result = await runBotCycle(state)
    expect(result.trade).toBeNull()
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toContain('cooldown')
  })
})
