// src/engines/confluence/oteConfluence.ts
/**
 * oteConfluence.ts
 * [FIX C-3] cf_ote: Price is in the OTE zone — PURE location check only.
 * Direction alignment is handled by mssConfluence.ts, NOT here.
 *
 * Previous bug: duplicated direction guard (bosR.direction === macro.bias) here.
 * Fix: only checks ote.inOTE boolean.
 */
export function evaluateOTEConfluence(inOTE: boolean): boolean {
  return inOTE
}
