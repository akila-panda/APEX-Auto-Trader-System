// src/engines/human-thinking/index.ts
/**
 * engines/human-thinking/index.ts
 * Module contract:
 *   buildHumanThinking(analysis) → { narrative, lesson, patterns[] }
 */

import type { AnalysisResult } from '../../types/analysis.types'
import { detectPatterns, type DetectedPattern } from './patternRecognizer'
import { buildNarrative }  from './narrativeBuilder'
import { generateLesson }  from './lessonGenerator'
import { buildReasonings, type ConfluenceReasoning } from './biasReasoningEngine'

export interface HumanThinkingResult {
  narrative:  string
  lesson:     string
  patterns:   DetectedPattern[]
  reasonings: ConfluenceReasoning[]
}

export function buildHumanThinking(analysis: AnalysisResult): HumanThinkingResult {
  const patterns   = detectPatterns(analysis)
  const narrative  = buildNarrative(analysis, patterns)
  const lesson     = generateLesson(analysis)
  const reasonings = buildReasonings(analysis)
  return { narrative, lesson, patterns, reasonings }
}
