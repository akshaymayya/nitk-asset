import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "assets.db");

let db;

export function initDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      vendor TEXT DEFAULT '',
      bill_date TEXT DEFAULT '',
      warranty_expiry TEXT DEFAULT '',
      location TEXT DEFAULT '',
      code1 TEXT NOT NULL,
      code2 TEXT NOT NULL,
      label_code TEXT NOT NULL,
      remarks TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assets_label ON assets(label_code);
    CREATE INDEX IF NOT EXISTS idx_assets_codes ON assets(code1, code2);
  `);
}

function genId() {
  return randomBytes(5).toString("hex").toUpperCase();
}

function rowToAsset(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    vendor: row.vendor,
    billDate: row.bill_date,
    warrantyExpiry: row.warranty_expiry,
    location: row.location,
    code1: row.code1,
    code2: row.code2,
    labelCode: row.label_code,
    remarks: row.remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildLabelCode(code1, code2) {
  const primary = (code1 || "").trim();
  const secondary = (code2 || "").trim();
  if (secondary && secondary !== primary) {
    return `${primary} · ${secondary}`;
  }
  return primary;
}

export function listAssets() {
  const rows = db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all();
  return rows.map(rowToAsset);
}

export function getAsset(id) {
  const row = db.prepare("SELECT * FROM assets WHERE id = ?").get(id);
  return rowToAsset(row);
}

export function getAssetByLabel(labelCode) {
  const row = db.prepare("SELECT * FROM assets WHERE label_code = ?").get(labelCode);
  return rowToAsset(row);
}

export function createAsset(fields) {
  const id = genId();
  const now = new Date().toISOString();
  const labelCode = buildLabelCode(fields.code1, fields.code2);

  db.prepare(
    `INSERT INTO assets (
      id, name, category, vendor, bill_date, warranty_expiry, location,
      code1, code2, label_code, remarks, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    fields.name,
    fields.category,
    fields.vendor,
    fields.billDate,
    fields.warrantyExpiry,
    fields.location,
    fields.code1,
    fields.code2,
    labelCode,
    fields.remarks,
    now,
    now
  );

  return getAsset(id);
}

export function updateAsset(id, fields) {
  const now = new Date().toISOString();
  const labelCode = buildLabelCode(fields.code1, fields.code2);

  db.prepare(
    `UPDATE assets SET
      name = ?, category = ?, vendor = ?, bill_date = ?, warranty_expiry = ?,
      location = ?, code1 = ?, code2 = ?, label_code = ?, remarks = ?, updated_at = ?
    WHERE id = ?`
  ).run(
    fields.name,
    fields.category,
    fields.vendor,
    fields.billDate,
    fields.warrantyExpiry,
    fields.location,
    fields.code1,
    fields.code2,
    labelCode,
    fields.remarks,
    now,
    id
  );

  return getAsset(id);
}

export function deleteAsset(id) {
  const result = db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  return result.changes > 0;
}
