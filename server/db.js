import pg from "pg";
import { randomBytes } from "crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL for cloud DBs (Supabase requires it) unless running locally without one
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost") 
    ? false 
    : { rejectUnauthorized: false }
});

export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set. Database will not initialize.");
    return;
  }
  await pool.query(`
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

export async function listAssets() {
  if (!process.env.DATABASE_URL) return [];
  const result = await pool.query("SELECT * FROM assets ORDER BY created_at DESC");
  return result.rows.map(rowToAsset);
}

export async function getAsset(id) {
  if (!process.env.DATABASE_URL) return null;
  const result = await pool.query("SELECT * FROM assets WHERE id = $1", [id]);
  return rowToAsset(result.rows[0]);
}

export async function getAssetByLabel(labelCode) {
  if (!process.env.DATABASE_URL) return null;
  const result = await pool.query("SELECT * FROM assets WHERE label_code = $1", [labelCode]);
  return rowToAsset(result.rows[0]);
}

export async function createAsset(fields) {
  if (!process.env.DATABASE_URL) throw new Error("Database not connected");
  const id = genId();
  const now = new Date().toISOString();
  const labelCode = buildLabelCode(fields.code1, fields.code2);

  await pool.query(
    `INSERT INTO assets (
      id, name, category, vendor, bill_date, warranty_expiry, location,
      code1, code2, label_code, remarks, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
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
    ]
  );

  return await getAsset(id);
}

export async function updateAsset(id, fields) {
  if (!process.env.DATABASE_URL) throw new Error("Database not connected");
  const now = new Date().toISOString();
  const labelCode = buildLabelCode(fields.code1, fields.code2);

  await pool.query(
    `UPDATE assets SET
      name = $1, category = $2, vendor = $3, bill_date = $4, warranty_expiry = $5,
      location = $6, code1 = $7, code2 = $8, label_code = $9, remarks = $10, updated_at = $11
    WHERE id = $12`,
    [
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
    ]
  );

  return await getAsset(id);
}

export async function deleteAsset(id) {
  if (!process.env.DATABASE_URL) throw new Error("Database not connected");
  const result = await pool.query("DELETE FROM assets WHERE id = $1", [id]);
  return result.rowCount > 0;
}
