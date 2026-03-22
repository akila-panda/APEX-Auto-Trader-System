'use strict'

/**
 * server/mt5Listener.cjs
 *
 * Standalone Express server that receives candle data pushed by the MT5 EA
 * and serves it back to APEX2's mt5Bridge.ts adapter.
 *
 * Endpoints:
 *   POST /mt5/candles  — receives { symbol, timeframe, candles[] } from MT5 EA
 *   GET  /mt5/read     — serves stored candles back to APEX2 frontend
 *
 * Storage: server/candle_store/<SYMBOL>_<timeframe>.json (one file per TF)
 * Port: 4001
 */

const express = require('express')
const cors    = require('cors')
const fs      = require('fs')
const path    = require('path')

const app  = express()
const PORT = 4001

// ── Storage directory ────────────────────────────────────────────────────────

const STORE_DIR = path.join(__dirname, 'candle_store')
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  console.log('[MT5 Listener] Created candle_store directory:', STORE_DIR)
}

// ── Valid values ─────────────────────────────────────────────────────────────

const VALID_SYMBOLS    = new Set(['EURUSD', 'GBPUSD'])
const VALID_TIMEFRAMES = new Set(['1day', '4h', '1h', '30min', '15min', '5min'])

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(cors())                          // Access-Control-Allow-Origin: *
app.use(express.json({ limit: '2mb' })) // candle JSON payloads can be sizeable

// ── POST /mt5/candles ────────────────────────────────────────────────────────
//
// Body: { symbol: string, timeframe: string, candles: Array<{datetime, open, high, low, close}> }
// Writes to candle_store/<SYMBOL>_<timeframe>.json, overwrites every time.

app.post('/mt5/candles', (req, res) => {
  const { symbol, timeframe, candles } = req.body

  // Validation
  if (!symbol || !VALID_SYMBOLS.has(symbol)) {
    return res.status(400).json({ error: `Invalid symbol "${symbol}". Must be EURUSD or GBPUSD.` })
  }
  if (!timeframe || !VALID_TIMEFRAMES.has(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe "${timeframe}". Must be one of: ${[...VALID_TIMEFRAMES].join(', ')}.` })
  }
  if (!Array.isArray(candles) || candles.length === 0) {
    return res.status(400).json({ error: 'candles must be a non-empty array.' })
  }

  const filename = `${symbol}_${timeframe}.json`
  const filepath = path.join(STORE_DIR, filename)

  try {
    fs.writeFileSync(filepath, JSON.stringify(candles, null, 0))
  } catch (err) {
    console.error('[MT5 Listener] Write error:', err)
    return res.status(500).json({ error: 'Failed to write candle data.' })
  }

  console.log(`[MT5] ${symbol} ${timeframe} — ${candles.length} candles stored`)

  return res.json({ ok: true, count: candles.length, symbol, timeframe })
})

// ── GET /mt5/read ────────────────────────────────────────────────────────────
//
// Query params: symbol=EURUSD&timeframe=5min
// Returns the stored candle array, or 404 if no data has been pushed yet.

app.get('/mt5/read', (req, res) => {
  const symbol    = (req.query.symbol    || '').toString().toUpperCase()
  const timeframe = (req.query.timeframe || '').toString()

  if (!VALID_SYMBOLS.has(symbol)) {
    return res.status(400).json({ error: `Invalid symbol "${symbol}".` })
  }
  if (!VALID_TIMEFRAMES.has(timeframe)) {
    return res.status(400).json({ error: `Invalid timeframe "${timeframe}".` })
  }

  const filepath = path.join(STORE_DIR, `${symbol}_${timeframe}.json`)

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: `No data yet for this symbol/timeframe` })
  }

  try {
    const raw  = fs.readFileSync(filepath, 'utf8')
    const data = JSON.parse(raw)
    return res.json(data)
  } catch (err) {
    console.error('[MT5 Listener] Read error:', err)
    return res.status(500).json({ error: 'Failed to read candle data.' })
  }
})

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[MT5 Listener] Running on http://localhost:${PORT}`)
  console.log(`[MT5 Listener] POST http://localhost:${PORT}/mt5/candles  — receive from EA`)
  console.log(`[MT5 Listener] GET  http://localhost:${PORT}/mt5/read     — serve to APEX2`)
  console.log(`[MT5 Listener] Store: ${STORE_DIR}`)
})
