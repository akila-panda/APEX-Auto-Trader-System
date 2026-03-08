/**
 * rateLimit.ts
 * [FIX R-2] Implements a sliding-window rate limiter for the Twelve Data API.
 * Free tier limit: 8 calls per 60-second rolling window.
 * 
 * This version uses a timestamp-based sliding window to ensure that no more than 
 * 8 requests are made within ANY 60-second period, eliminating race conditions
 * and correctly handling the Twelve Data free tier constraints.
 */

import { RATE_LIMITS } from '../config/api.config'

// Tracks timestamps of the last 8 successful (or attempted) API calls
const callTimestamps: number[] = []

export const RATE = {
  callsToday:   0,
  callsThisMin: 0, // Legacy support for UI, updated by sliding window
  pendingCalls: 0, // Calls currently waiting in the limiter
}

/**
 * Returns true if a call can be made within the DAILY limit.
 */
export function canMakeAPICall(): boolean {
  return RATE.callsToday < RATE_LIMITS.DAILY_LIMIT
}

/**
 * Robustly wait until a slot is available in the 8-calls-per-minute sliding window.
 * This function will block and only return once it has "reserved" a slot.
 */
export async function waitIfRateLimited(): Promise<void> {
  RATE.pendingCalls++
  
  try {
    while (true) {
      const now = Date.now()

      // 1. Clean up timestamps older than 60 seconds
      while (callTimestamps.length > 0 && now - callTimestamps[0] > 60000) {
        callTimestamps.shift()
      }

      // 2. Update UI counters for legacy support
      RATE.callsThisMin = callTimestamps.length

      // 3. Check if we have a slot (limit is 8 per 60s)
      if (callTimestamps.length < RATE_LIMITS.PER_MIN_LIMIT) {
        // Slot found! Reserve it immediately with current timestamp
        callTimestamps.push(now)
        RATE.callsToday++
        RATE.callsThisMin = callTimestamps.length
        return
      }

      // 4. No slots available. Calculate wait time based on the oldest timestamp.
      // We wait until the oldest call is at least 60.5 seconds old.
      const oldestCallAge = now - callTimestamps[0]
      const waitTime = Math.max(0, 60000 - oldestCallAge + 500) // 500ms safety buffer
      
      await new Promise(r => setTimeout(r, waitTime))
    }
  } finally {
    RATE.pendingCalls--
  }
}

/** 
 * Legacy trackAPICall is now a no-op as waitIfRateLimited handles the counting.
 * Keeping it for compatibility if needed, but fetchCandles should no longer call it.
 */
export function trackAPICall(): void {
  // No-op. Slotted by waitIfRateLimited.
}
