// src/engines/ote/oteZoneChecker.ts
/**
 * oteZoneChecker.ts
 * [FIX C-3] Checks if current price is inside the OTE zone — pure location check only.
 *
 * Previous bug: direction guard was duplicated here AND in mssConfluence.ts.
 * Fix: this function ONLY checks if price is in the 62–79% Fibonacci band.
 * Direction alignment is handled exclusively by mssConfluence.ts.
 */

/**
 * Returns true if price is within the OTE zone [ote79, ote62] (bullish)
 * or [ote62, ote79] (bearish).
 *
 * [FIX C-3] Pure location check — no direction guard here.
 */
export function isPriceInOTE(
  price:     number,
  ote62:     number,
  ote79:     number,
  direction: 'bullish' | 'bearish',
): boolean {
  if (direction === 'bullish') {
    // Retracement: ote79 < ote62 (deeper fib = lower price)
    return price >= ote79 && price <= ote62
  } else {
    // Retracement: ote79 > ote62 (deeper fib = higher price)
    return price <= ote79 && price >= ote62
  }
}
