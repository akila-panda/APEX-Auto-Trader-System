/**
 * cooldownGuard.ts
 * [FIX A-5] Re-entry cooldown: blocks same-direction trades within N minutes.
 *
 * Reads lastTradeTime and lastTradeDirection from parameters (not store directly),
 * keeping this a pure function for testability.
 */

export interface CooldownState {
  lastTradeTime:      number
  lastTradeDirection: 'LONG' | 'SHORT' | null
}

export interface CooldownCheckResult {
  blocked:     boolean
  remainMins:  number
}

/**
 * Returns whether a new signal should be blocked by the cooldown guard.
 * [FIX A-5] Prevents stacking same-direction positions within the configured window.
 */
export function checkCooldown(
  state:        CooldownState,
  signalDir:    'LONG' | 'SHORT',
  cooldownMins: number,
): CooldownCheckResult {
  if (cooldownMins <= 0 || !state.lastTradeTime || state.lastTradeDirection !== signalDir) {
    return { blocked: false, remainMins: 0 }
  }

  const cooldownMs = cooldownMins * 60 * 1000
  const elapsed    = Date.now() - state.lastTradeTime

  if (elapsed < cooldownMs) {
    return {
      blocked:    true,
      remainMins: Math.ceil((cooldownMs - elapsed) / 60_000),
    }
  }

  return { blocked: false, remainMins: 0 }
}
