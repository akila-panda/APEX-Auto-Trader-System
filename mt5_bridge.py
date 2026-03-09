import os
from flask import Flask, request, jsonify
import MetaTrader5 as mt5
from datetime import datetime, timedelta

app = Flask(__name__)

MT5_LOGIN = int(os.environ.get("MT5_LOGIN", "0")) if os.environ.get("MT5_LOGIN") else 0
MT5_PASSWORD = os.environ.get("MT5_PASSWORD", "")
MT5_SERVER = os.environ.get("MT5_SERVER", "")

connected = False

MIN_LOT = 0.01
MAX_LOT = 1.0
MAX_OPEN_TRADES = 20
SLIPPAGE_POINTS = 10
MAGIC_NUMBER = 10001

def normalize_symbol(s: str) -> str:
    return s.replace("/", "")

def ensure_connection() -> bool:
    global connected
    if connected and mt5.terminal_info() is not None:
        return True
    if not mt5.initialize():
        return False
    if MT5_LOGIN and MT5_PASSWORD and MT5_SERVER:
        if not mt5.login(MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER):
            return False
    else:
        return False
    connected = True
    return True

def get_order_type(action: str):
    if action.upper() == "BUY":
        return mt5.ORDER_TYPE_BUY
    if action.upper() == "SELL":
        return mt5.ORDER_TYPE_SELL
    return None

@app.route("/trade", methods=["POST"])
def trade():
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"ok": False, "error": "Invalid JSON"}), 400

    symbol = data.get("symbol")
    action = data.get("action")
    lot = data.get("lot")
    sl = data.get("sl")
    tp = data.get("tp")

    if not all([symbol, action, lot, sl, tp]):
        return jsonify({"ok": False, "error": "Missing required fields"}), 400

    try:
        lot_val = float(lot)
    except Exception:
        return jsonify({"ok": False, "error": "Invalid lot"}), 400
    if lot_val < MIN_LOT:
        return jsonify({"ok": False, "error": f"Lot below minimum {MIN_LOT}"}), 400
    if lot_val > MAX_LOT:
        return jsonify({"ok": False, "error": f"Lot above maximum {MAX_LOT}"}), 400

    if not ensure_connection():
        return jsonify({"ok": False, "error": "MT5 connection/login failed"}), 500

    positions = mt5.positions_get()
    if positions is None:
        return jsonify({"ok": False, "error": "Failed to query open positions"}), 500
    if len(positions) >= MAX_OPEN_TRADES:
        return jsonify({"ok": False, "error": f"Max open trades {MAX_OPEN_TRADES} reached"}), 400

    norm_symbol = normalize_symbol(str(symbol))
    si = mt5.symbol_info(norm_symbol)
    if si is None:
        if not mt5.symbol_select(norm_symbol, True):
            return jsonify({"ok": False, "error": f"Symbol {norm_symbol} not found"}), 400
        si = mt5.symbol_info(norm_symbol)
        if si is None:
            return jsonify({"ok": False, "error": f"Symbol {norm_symbol} unavailable"}), 400

    tick = mt5.symbol_info_tick(norm_symbol)
    if tick is None:
        return jsonify({"ok": False, "error": "Failed to fetch tick"}), 500

    otype = get_order_type(str(action))
    if otype is None:
        return jsonify({"ok": False, "error": "Invalid action"}), 400

    price = tick.ask if otype == mt5.ORDER_TYPE_BUY else tick.bid

    request_payload = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": norm_symbol,
        "volume": lot_val,
        "type": otype,
        "price": float(price),
        "sl": float(sl),
        "tp": float(tp),
        "deviation": SLIPPAGE_POINTS,
        "magic": MAGIC_NUMBER,
        "comment": "APEX2 bridge",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request_payload)
    if result is None:
        return jsonify({"ok": False, "error": "order_send returned None"}), 500

    res = {
        "ok": True,
        "retcode": result.retcode,
        "comment": result.comment,
        "order": result.order,
        "deal": getattr(result, "deal", 0),
        "request": request_payload,
    }

    if result.retcode != mt5.RES_OK:
        return jsonify(res), 400
    return jsonify(res), 200

@app.route("/positions", methods=["GET"])
def positions():
    if not ensure_connection():
        return jsonify({"ok": False, "error": "MT5 connection/login failed"}), 500
    pos = mt5.positions_get()
    if pos is None:
        return jsonify({"ok": False, "error": "Failed to query positions"}), 500
    payload = []
    for p in pos:
        payload.append({
            "ticket": p.ticket,
            "symbol": p.symbol,
            "type": p.type,
            "volume": p.volume,
            "price_open": p.price_open,
            "sl": p.sl,
            "tp": p.tp,
            "profit": p.profit,
            "time": getattr(p, "time", None),
        })
    return jsonify({"ok": True, "positions": payload}), 200

@app.route("/balance", methods=["GET"])
def balance():
    if not ensure_connection():
        return jsonify({"ok": False, "error": "MT5 connection/login failed"}), 500
    ai = mt5.account_info()
    if ai is None:
        return jsonify({"ok": False, "error": "Failed to query account info"}), 500
    return jsonify({"ok": True, "balance": ai.balance, "equity": ai.equity, "margin": ai.margin}), 200

@app.route("/history", methods=["GET"])
def history():
    if not ensure_connection():
        return jsonify({"ok": False, "error": "MT5 connection/login failed"}), 500
    end = datetime.now()
    start = end - timedelta(days=30)
    deals = mt5.history_deals_get(start, end)
    if deals is None:
        return jsonify({"ok": False, "error": "Failed to query deals"}), 500
    items = []
    for d in deals:
        items.append({
            "ticket": d.ticket,
            "order": d.order,
            "symbol": d.symbol,
            "type": d.type,
            "entry": d.entry,
            "volume": d.volume,
            "price": d.price,
            "profit": d.profit,
            "comment": d.comment,
            "time": getattr(d, "time", None),
        })
    items.sort(key=lambda x: x["time"] or 0, reverse=True)
    return jsonify({"ok": True, "deals": items[:10]}), 200

@app.route("/health", methods=["GET"])
def health():
    connected_ok = ensure_connection()
    ti = mt5.terminal_info() if connected_ok else None
    ai = mt5.account_info() if connected_ok else None
    return jsonify({
        "ok": True,
        "connected": bool(ti),
        "account": int(ai.login) if ai else 0,
        "balance": float(ai.balance) if ai else 0.0,
        "server": str(ai.server) if ai else "",
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
