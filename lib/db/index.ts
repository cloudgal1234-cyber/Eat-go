import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: NeonHttpDatabase<typeof schema> | undefined
let _sql: ReturnType<typeof neon> | undefined

function getConnection() {
  if (!_db || !_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    _sql = neon(url)
    _db = drizzle(_sql, { schema })
  }
  return { db: _db!, sql: _sql! }
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const { db } = getConnection()
    const value = (db as any)[prop]
    return typeof value === 'function' ? value.bind(db) : value
  }
})

export async function initDb() {
  const { sql } = getConnection()
  await sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      logo TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'WAITER',
      salary REAL,
      hire_date TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(email, restaurant_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES menu_categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      is_available BOOLEAN NOT NULL DEFAULT TRUE,
      allergens TEXT,
      preparation_time INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(email, restaurant_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT TRUE,
      location TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(number, restaurant_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id),
      table_id TEXT REFERENCES tables(id),
      status TEXT NOT NULL DEFAULT 'PENDING',
      type TEXT NOT NULL DEFAULT 'DINE_IN',
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      payment_method TEXT,
      delivery_address TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      notes TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS couriers (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT TRUE,
      vehicle_type TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
      courier_id TEXT REFERENCES couriers(id),
      address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      estimated_time INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id),
      table_id TEXT REFERENCES tables(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 90,
      party_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      min_quantity REAL NOT NULL DEFAULT 0,
      cost_per_unit REAL,
      supplier TEXT,
      category TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS loyalty_programs (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
      points_per_amount REAL NOT NULL DEFAULT 1,
      reward_threshold INTEGER NOT NULL DEFAULT 100,
      reward_value REAL NOT NULL DEFAULT 10,
      reward_type TEXT NOT NULL DEFAULT 'DISCOUNT',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      category TEXT,
      response TEXT,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
}

export * from './schema'
