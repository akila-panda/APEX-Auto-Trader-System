#!/bin/bash
#
# start-apex2.sh
#
# USAGE:
#   Run this script from the APEX2 project root:
#     ./start-apex2.sh
#
# WHAT IT DOES:
#   1. Installs server dependencies (express, cors) if not already installed
#   2. Starts the MT5 listener on http://localhost:4001 in the background
#   3. Starts the Vite dev server (npm run dev) in the foreground
#   4. When you stop the Vite server (Ctrl+C), kills the listener automatically
#
# STARTUP ORDER — important:
#   - Both servers must be running BEFORE you attach the EA to a chart in MT5
#   - The listener must be on :4001 before MT5 makes its first WebRequest call
#   - After starting this script, open MT5 and attach APEX2_Bridge.mq5 to
#     any EURUSD M5 chart. The EA will push candles within 60 seconds.
#
# REVERTING TO TWELVE DATA:
#   In src/App.tsx, set:  const USE_MT5_BRIDGE = false
#   The Vite dev server does not need to be restarted — HMR will pick it up.
#   The listener can be left running; it will simply receive no traffic.

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  APEX2 — starting MT5 bridge + dev server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start listener from server directory
echo ""
echo "▶ Starting MT5 listener..."
cd server
npm install --silent
node mt5Listener.cjs &
LISTENER_PID=$!
cd ..

echo "✓ Listener running on :4001 (PID $LISTENER_PID)"
echo ""

# Kill listener when this script exits (Ctrl+C or dev server crash)
trap "echo ''; echo 'Stopping listener (PID $LISTENER_PID)...'; kill $LISTENER_PID 2>/dev/null; echo 'Done.'" EXIT

# Start Vite dev server in foreground
echo "▶ Starting APEX2 dev server..."
echo ""
npm run dev