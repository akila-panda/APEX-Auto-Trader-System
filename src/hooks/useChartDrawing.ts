/**
 * useChartDrawing.ts
 * Canvas drawing orchestration with rAF throttling.
 * [FIX B-3] Y-axis labels use .toFixed(5)
 * [FIX B-4] Right-edge price badges for all SMC levels
 */

import { useRef, useCallback, useEffect } from 'react'
import { useMarketStore } from '../store/useMarketStore'
import { CHART_THROTTLE_MS } from '../config/api.config'
import type { AnalysisResult } from '../types/analysis.types'

export function useChartDrawing(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const rafRef      = useRef<number | null>(null)
  const lastDrawRef = useRef<number>(0)

  const draw = useCallback((analysis?: AnalysisResult) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (parent) {
      canvas.width  = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const store = useMarketStore.getState()

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#060a10'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(28,44,66,0.6)'
    ctx.lineWidth = 1
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 6); ctx.lineTo(W, H * i / 6); ctx.stroke() }
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(W * i / 8, 0); ctx.lineTo(W * i / 8, H); ctx.stroke() }

    const candles = store.candles[store.activeTF]
    const isSimulated = candles?.[0]?.simulated

    if (candles && candles.length > 1) {
      drawCandlesticks(ctx, candles, W, H, store.currentPrice, analysis)
    } else if (store.priceHistory.length > 1) {
      drawLineChart(ctx, store.priceHistory, W, H, store.currentPrice)
    }

    if (isSimulated) {
      ctx.fillStyle = 'rgba(255,140,0,0.25)'
      ctx.font = 'bold 11px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ SIMULATED DATA — API UNAVAILABLE', W / 2, 24)
    }
  }, [canvasRef])

  const scheduleDraw = useCallback((analysis?: AnalysisResult) => {
    const now = Date.now()
    if (now - lastDrawRef.current < CHART_THROTTLE_MS) {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          draw(analysis)
          lastDrawRef.current = Date.now()
        })
      }
      return
    }
    draw(analysis)
    lastDrawRef.current = now
  }, [draw])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return { scheduleDraw }
}

// ── Pure canvas drawing functions ──────────────────────────────────

function drawCandlesticks(
  ctx:     CanvasRenderingContext2D,
  candles: Array<{ open: number; high: number; low: number; close: number }>,
  W: number, H: number,
  currentPrice: number,
  analysis?: AnalysisResult,
) {
  const vis   = candles.slice(-Math.floor(W / 10))
  const highs = vis.map(c => c.high)
  const lows  = vis.map(c => c.low)
  const min   = Math.min(...lows) - 0.0003
  const max   = Math.max(...highs) + 0.0003
  const range = max - min || 0.001

  const toY = (p: number) => H - ((p - min) / range) * (H * 0.85) - H * 0.075
  const cW  = Math.max(2, Math.floor((W - 90) / vis.length) - 1)
  const toX = (i: number) => 20 + i * ((W - 90) / vis.length) + cW / 2

  // [FIX B-4] SMC level overlays with right-edge price badges
  if (analysis) {
    const levels = [
      { p: analysis.bullOB?.top,    lbl: 'Bull OB',  c: 'rgba(0,232,154,0.7)'  },
      { p: analysis.bearOB?.bot,    lbl: 'Bear OB',  c: 'rgba(255,51,102,0.7)' },
      { p: analysis.equilibrium,    lbl: 'EQ 50%',   c: 'rgba(232,184,75,0.6)' },
      { p: analysis.fvgBull?.low,   lbl: 'FVG ↑',   c: 'rgba(0,212,255,0.6)'  },
      { p: analysis.fvgBear?.high,  lbl: 'FVG ↓',   c: 'rgba(255,51,102,0.5)' },
      { p: analysis.ote.ote62,      lbl: 'OTE 62%',  c: 'rgba(232,184,75,0.4)' },
      { p: analysis.ote.ote79,      lbl: 'OTE 79%',  c: 'rgba(232,184,75,0.4)' },
    ]

    for (const lv of levels) {
      if (!lv.p || isNaN(lv.p)) continue
      const ly = toY(lv.p)
      if (ly < 4 || ly > H - 4) continue

      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.moveTo(20, ly)
      ctx.lineTo(W - 76, ly)
      ctx.strokeStyle = lv.c
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = lv.c
      ctx.font = '7px JetBrains Mono,monospace'
      ctx.textAlign = 'left'
      ctx.fillText(lv.lbl, 22, ly - 3)

      // [FIX B-4] Right-edge filled price badge
      const priceStr = lv.p.toFixed(5)  // [FIX B-3] 5 decimal places
      const bW = 70, bH = 14, bx = W - bW - 2, by = ly - bH / 2
      ctx.fillStyle = lv.c
      if (ctx.roundRect) ctx.roundRect(bx, by, bW, bH, 2)
      else ctx.rect(bx, by, bW, bH)
      ctx.fill()
      ctx.fillStyle = '#060a10'
      ctx.font = 'bold 8px JetBrains Mono,monospace'
      ctx.textAlign = 'center'
      ctx.fillText(priceStr, bx + bW / 2, by + 10)
    }
  }

  // Candles
  vis.forEach((c, i) => {
    const bull = c.close >= c.open
    const col  = bull ? '#00e89a' : '#ff3366'
    const x = toX(i), oY = toY(c.open), cY = toY(c.close)
    ctx.beginPath(); ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, toY(c.low))
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = col
    ctx.fillRect(x - cW / 2, Math.min(oY, cY), cW, Math.max(1, Math.abs(oY - cY)))
  })

  // Current price line
  if (currentPrice) {
    const cy = toY(currentPrice)
    ctx.beginPath(); ctx.setLineDash([4, 4])
    ctx.moveTo(20, cy); ctx.lineTo(W - 74, cy)
    ctx.strokeStyle = 'rgba(232,184,75,0.6)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(232,184,75,0.95)'
    ctx.fillRect(W - 72, cy - 10, 70, 20)
    ctx.fillStyle = '#060a10'; ctx.font = 'bold 9px JetBrains Mono,monospace'
    ctx.textAlign = 'center'
    ctx.fillText(currentPrice.toFixed(5), W - 37, cy + 3)  // [FIX B-3]
  }

  // [FIX B-3] Y-axis labels at 5 decimal places
  ctx.fillStyle = 'rgba(140,168,200,0.5)'
  ctx.font = '9px JetBrains Mono,monospace'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const p = min + (range * i / 5)
    ctx.fillText(p.toFixed(5), W - 2, toY(p) + 4)
  }
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  hist: number[], W: number, H: number,
  currentPrice: number,
) {
  const vis   = hist.slice(-Math.floor(W / 4))
  const min   = Math.min(...vis) - 0.0005
  const max   = Math.max(...vis) + 0.0005
  const range = max - min || 0.001
  const toY   = (p: number) => H - ((p - min) / range) * (H * 0.85) - H * 0.075
  const toX   = (i: number) => (i / (vis.length - 1)) * (W - 60) + 20
  const bull  = currentPrice >= (vis[0] ?? currentPrice)

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, bull ? 'rgba(0,232,154,0.15)' : 'rgba(255,51,102,0.15)')
  grad.addColorStop(1, 'rgba(0,0,0,0.01)')

  ctx.beginPath(); ctx.moveTo(toX(0), toY(vis[0]))
  vis.forEach((p, i) => { if (i > 0) ctx.lineTo(toX(i), toY(p)) })
  ctx.lineTo(toX(vis.length - 1), H); ctx.lineTo(toX(0), H); ctx.closePath()
  ctx.fillStyle = grad; ctx.fill()

  ctx.beginPath(); ctx.moveTo(toX(0), toY(vis[0]))
  vis.forEach((p, i) => { if (i > 0) ctx.lineTo(toX(i), toY(p)) })
  ctx.strokeStyle = bull ? '#00e89a' : '#ff3366'; ctx.lineWidth = 1.5; ctx.stroke()
}
