const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const MT5_FILES = path.join(
  process.env.HOME,
  "Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/user/AppData/Roaming/MetaQuotes/Terminal/Common/Files"
);

if (!fs.existsSync(MT5_FILES)) fs.mkdirSync(MT5_FILES, { recursive: true });

app.use(express.json());

app.post("/trade", (req, res) => {
    const { action, symbol, lot, sl, tp } = req.body;
    if (!action) return res.status(400).json({ status: "error", message: "Missing action" });

    // Write CSV: ACTION,LOT,SL,TP
    const content = `${action.toUpperCase()},${lot || 0.01},${sl || 0},${tp || 0}`;
    const filePath = path.join(MT5_FILES, "apex_signal.txt");

    try {
        fs.writeFileSync(filePath, content);
        console.log(`[${new Date().toISOString()}] Signal written: ${content}`);
        res.json({ status: "ok", signal: content });
    } catch (err) {
        console.error("Failed to write signal file:", err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "running", path_exists: fs.existsSync(MT5_FILES) });
});

app.listen(3001, () => {
    console.log("APEX signal server running on port 3001");
    console.log("Path exists:", fs.existsSync(MT5_FILES));
});
