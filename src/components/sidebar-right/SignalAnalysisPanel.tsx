// src/components/sidebar-right/SignalAnalysisPanel.tsx
import type { AnalysisResult } from '../../types/analysis.types'

interface Props { analysis: AnalysisResult | null }

export function SignalAnalysisPanel({ analysis: A }: Props) {
  const hasSignal = A?.signal !== 'WAIT' && A != null
  const signalColor = A?.signal === 'LONG' ? 'text-jade' : A?.signal === 'SHORT' ? 'text-ruby' : 'text-gold'

  return (
    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
      <div className="text-[9px] text-aqua font-bold tracking-[2px] mb-3 uppercase opacity-70 px-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-aqua shadow-[0_0_5px_rgba(0,212,255,0.5)]"></span>
        Signal Logic & Commentary
      </div>

      <div className="relative group overflow-hidden bg-black/40 rounded-md border border-white/[0.04] p-3 min-h-[100px] transition-all duration-300 hover:border-white/[0.1]">
        {/* Subtle background glow when signal is active */}
        {hasSignal && (
          <div className={`absolute inset-0 opacity-5 blur-2xl pointer-events-none ${A?.signal === 'LONG' ? 'bg-jade' : 'bg-ruby'}`}></div>
        )}

        <div className="relative z-10">
          {A ? (
            <>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
                <div className={`text-[10px] font-bold font-mono ${signalColor}`}>
                  [{A.signal}]
                </div>
                <div className="text-[9px] text-muted font-mono uppercase tracking-widest">
                  {A.dataSource} {A.tfId}
                </div>
                <div className="ml-auto text-[9px] font-bold font-mono text-aqua/60">
                  {A.effectiveScore.toFixed(1)}/5.5
                </div>
              </div>
              
              <div className="text-[10px] text-text leading-relaxed font-ui whitespace-pre-wrap">
                {A.analysisText}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-4 h-4 border-2 border-white/10 border-t-aqua/40 rounded-full animate-spin"></div>
              <span className="text-[10px] text-muted font-mono italic">Awaiting analysis scan...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta */}
      {A && (
        <div className="mt-2 px-1 flex justify-between items-center text-[8px] font-mono text-muted uppercase tracking-tighter opacity-50">
          <span>Processed via AI Engine v2.0</span>
          <span>{new Date(A.timestamp).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  )
}
