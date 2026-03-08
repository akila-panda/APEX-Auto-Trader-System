// src/hooks/useSessionInfo.ts
/**
 * useSessionInfo.ts
 * Returns live session info: isKillZone, isLondon, isNY, sessionName.
 * Updates every second via a setInterval.
 */

import { useState, useEffect } from 'react'
import type { SessionInfo } from '../types/analysis.types'
import {
  LONDON_KZ_START, LONDON_KZ_END,
  NY_KZ_START, NY_KZ_END,
} from '../config/trading.config'

function computeSession(): SessionInfo {
  const d   = new Date()
  const h   = d.getUTCHours()
  const m   = d.getUTCMinutes()
  const total = h * 60 + m
  const dow   = d.getUTCDay()
  const isWeekend = dow === 0 || dow === 6

  const inLondonKZ = !isWeekend && total >= LONDON_KZ_START * 60 && total < LONDON_KZ_END * 60
  const inNYKZ     = !isWeekend && total >= NY_KZ_START * 60     && total < NY_KZ_END * 60
  const isLondon   = !isWeekend && total >= 7 * 60  && total < 17 * 60
  const isNY       = !isWeekend && total >= 12 * 60 && total < 21 * 60
  const isAsia     = !isWeekend && (total >= 22 * 60 || total < 7 * 60)
  const inKZ       = inLondonKZ || inNYKZ

  let sessionName = 'CLOSED'
  if (isWeekend)             sessionName = 'WEEKEND'
  else if (inNYKZ)           sessionName = 'NY KZ 🎯'
  else if (inLondonKZ)       sessionName = 'LONDON KZ 🎯'
  else if (isLondon && isNY) sessionName = 'LONDON/NY'
  else if (isLondon)         sessionName = 'LONDON'
  else if (isNY)             sessionName = 'NEW YORK'
  else if (isAsia)           sessionName = 'ASIA'

  return { h, m, total, isLondon, isNY, isAsia, isWeekend, inKZ, inLondonKZ, inNYKZ, sessionName }
}

export function useSessionInfo(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(computeSession)

  useEffect(() => {
    const id = setInterval(() => setSession(computeSession()), 1000)
    return () => clearInterval(id)
  }, [])

  return session
}
