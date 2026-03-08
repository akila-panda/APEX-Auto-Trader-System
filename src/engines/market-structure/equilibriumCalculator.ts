/**
 * equilibriumCalculator.ts
 * Computes the 50% equilibrium (midpoint) of the current swing range,
 * and classifies the current price as being in a premium or discount zone.
 *
 * ICT concept:
 * - Equilibrium (EQ) = 50% of the swing high to swing low range
 * - Price BELOW EQ → Discount zone (favourable for longs)
 * - Price ABOVE EQ → Premium zone (favourable for shorts)
 */

import { snap } from '../../utils/priceFormat'

export interface EquilibriumResult {
  equilibrium: number
  inDiscount:  boolean
  inPremium:   boolean
}

/**
 * Calculates the 50% equilibrium midpoint and zone classification.
 * Pure function — price passed as parameter, no global reads.
 */
export function calculateEquilibrium(
  swingHigh:    number,
  swingLow:     number,
  currentPrice: number,
): EquilibriumResult {
  const equilibrium = snap((swingHigh + swingLow) / 2)
  return {
    equilibrium,
    inDiscount: currentPrice < equilibrium,
    inPremium:  currentPrice > equilibrium,
  }
}
