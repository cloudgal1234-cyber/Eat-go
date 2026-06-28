import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, tables } from '@/lib/db'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'

const schema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive(),
  isAvailable: z.boolean().optional(),
  location: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await db.select().from(tables)
    .where(eq(tables.restaurantId, session.restaurantId))
    .orderBy(asc(tables.number))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  try {
    const id = crypto.randomUUID()
    await db.insert(tables).values({ id, restaurantId: session.restaurantId, ...parsed.data })
    const table = await db.select().from(tables).where(eq(tables.id, id)).then(rows => rows[0])
    return NextResponse.json(table, { status: 201 })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'שולחן עם מספר זה כבר קיים' }, { status: 409 })
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
