import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "stocksense.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.pragma("busy_timeout = 5000");
    runMigrations(_db);
  }
  return _db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'manager' CHECK(role IN ('manager', 'staff')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      consumed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(warehouse_id, code)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      unit TEXT NOT NULL DEFAULT 'pcs',
      reorder_point REAL NOT NULL DEFAULT 0,
      unit_cost REAL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_balances (
      product_id TEXT NOT NULL REFERENCES products(id),
      location_id TEXT NOT NULL REFERENCES locations(id),
      on_hand REAL NOT NULL DEFAULT 0 CHECK(on_hand >= 0),
      reserved REAL NOT NULL DEFAULT 0 CHECK(reserved >= 0),
      version INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (product_id, location_id)
    );

    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')),
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED')),
      source_location_id TEXT REFERENCES locations(id),
      destination_location_id TEXT REFERENCES locations(id),
      supplier TEXT,
      customer TEXT,
      scheduled_at TEXT,
      responsible_id TEXT REFERENCES users(id),
      creator_id TEXT NOT NULL REFERENCES users(id),
      posted_at TEXT,
      notes TEXT,
      pick_confirmed INTEGER NOT NULL DEFAULT 0,
      pack_confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operation_lines (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL REFERENCES operations(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL CHECK(quantity > 0),
      counted_quantity REAL,
      observed_on_hand REAL,
      observed_version INTEGER,
      reason TEXT,
      UNIQUE(operation_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      operation_line_id TEXT NOT NULL REFERENCES operation_lines(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      location_id TEXT NOT NULL REFERENCES locations(id),
      delta REAL NOT NULL CHECK(delta != 0),
      leg TEXT NOT NULL CHECK(leg IN ('IN', 'OUT', 'ADJUST', 'OPEN')),
      actor_id TEXT NOT NULL REFERENCES users(id),
      posted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(operation_line_id, leg)
    );

    CREATE TABLE IF NOT EXISTS reservation_lines (
      id TEXT PRIMARY KEY,
      operation_line_id TEXT NOT NULL REFERENCES operation_lines(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      location_id TEXT NOT NULL REFERENCES locations(id),
      quantity REAL NOT NULL CHECK(quantity > 0),
      UNIQUE(operation_line_id)
    );

    CREATE INDEX IF NOT EXISTS idx_operations_type_status ON operations(type, status);
    CREATE INDEX IF NOT EXISTS idx_operations_source ON operations(source_location_id, status);
    CREATE INDEX IF NOT EXISTS idx_operations_dest ON operations(destination_location_id, status);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, posted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_movements_location ON stock_movements(location_id, posted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_movements_line ON stock_movements(operation_line_id);
    CREATE INDEX IF NOT EXISTS idx_balances_location ON stock_balances(location_id, product_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

    CREATE TABLE IF NOT EXISTS ref_counters (
      prefix TEXT PRIMARY KEY,
      counter INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateReference(db: Database.Database, prefix: string): string {
  const stmt = db.prepare(`
    INSERT INTO ref_counters (prefix, counter) VALUES (?, 1)
    ON CONFLICT(prefix) DO UPDATE SET counter = counter + 1
    RETURNING counter
  `);
  const row = stmt.get(prefix) as { counter: number };
  return `${prefix}/${String(row.counter).padStart(5, "0")}`;
}
