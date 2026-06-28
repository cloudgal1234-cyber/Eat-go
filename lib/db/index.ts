import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

// no-op: schema managed via drizzle-kit push (npm run db:push)
export function initDb() {}

export * from './schema'
