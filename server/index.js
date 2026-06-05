import express from "express";
import cors from "cors";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, listAssets, getAsset, createAsset, updateAsset, deleteAsset } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
/** Port phones use to open the web app (5173 = Vite dev, 3001 = production) */
const SCAN_PORT = process.env.SCAN_PORT || process.env.CLIENT_PORT || 5173;
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

function getLanIPv4() {
  const candidates = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const net of ifaces || []) {
      if (net.family === "IPv4" && !net.internal) candidates.push(net.address);
    }
  }
  return (
    candidates.find((a) => a.startsWith("192.168.")) ||
    candidates.find((a) => a.startsWith("10.")) ||
    candidates.find((a) => /^172\.(1[6-9]|2\d|3[01])\./.test(a)) ||
    candidates[0] ||
    null
  );
}

initDb().catch(console.error);

const app = express();
app.use(cors());
app.use(express.json());

function requirePin(req, res, next) {
  const pin = req.headers["x-admin-pin"];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid admin PIN" });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/** Base URL embedded in QR/barcodes — must be reachable from phones on the same network */
app.get("/api/scan-base", (_req, res) => {
  if (PUBLIC_BASE_URL) {
    return res.json({ scanBase: PUBLIC_BASE_URL.replace(/\/$/, "") });
  }
  const lan = getLanIPv4();
  if (!lan) {
    return res.status(503).json({
      error: "No Wi‑Fi/LAN IP found. Connect this PC to Wi‑Fi or set PUBLIC_BASE_URL.",
      scanBase: null,
    });
  }
  res.json({ scanBase: `http://${lan}:${SCAN_PORT}` });
});

app.get("/api/assets", requirePin, async (_req, res) => {
  try {
    const assets = await listAssets();
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/assets/:id", async (req, res) => {
  try {
    const asset = await getAsset(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/assets", requirePin, async (req, res) => {
  const { name, category, vendor, billDate, warrantyExpiry, location, code1, code2, remarks } =
    req.body || {};

  if (!name?.trim()) return res.status(400).json({ error: "Item name is required" });
  if (!code1?.trim() || !code2?.trim()) {
    return res.status(400).json({ error: "Both college code numbers are required" });
  }

  try {
    const asset = await createAsset({
      name: name.trim(),
      category: category || "Other",
      vendor: vendor?.trim() || "",
      billDate: billDate || "",
      warrantyExpiry: warrantyExpiry || "",
      location: location?.trim() || "",
      code1: code1.trim(),
      code2: code2.trim(),
      remarks: remarks?.trim() || "",
      publicBaseUrl: PUBLIC_BASE_URL,
    });
    res.status(201).json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/assets/:id", requirePin, async (req, res) => {
  try {
    const existing = await getAsset(req.params.id);
    if (!existing) return res.status(404).json({ error: "Asset not found" });

    const { name, category, vendor, billDate, warrantyExpiry, location, code1, code2, remarks } =
      req.body || {};

    if (!name?.trim()) return res.status(400).json({ error: "Item name is required" });
    if (!code1?.trim() || !code2?.trim()) {
      return res.status(400).json({ error: "Both college code numbers are required" });
    }

    const asset = await updateAsset(req.params.id, {
      name: name.trim(),
      category: category || "Other",
      vendor: vendor?.trim() || "",
      billDate: billDate || "",
      warrantyExpiry: warrantyExpiry || "",
      location: location?.trim() || "",
      code1: code1.trim(),
      code2: code2.trim(),
      remarks: remarks?.trim() || "",
    });

    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/assets/:id", requirePin, async (req, res) => {
  try {
    const ok = await deleteAsset(req.params.id);
    if (!ok) return res.status(404).json({ error: "Asset not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Asset server running on http://localhost:${PORT}`);
  if (!PUBLIC_BASE_URL) {
    console.log("Tip: set PUBLIC_BASE_URL for production barcode URLs (e.g. https://assets.nitk.edu.in)");
  }
  if (!process.env.DATABASE_URL) {
    console.log("WARNING: DATABASE_URL is not set. Data features will not work until connected to Postgres.");
  }
});
