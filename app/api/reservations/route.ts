import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, reservations, customers, tables } from '@/lib/db'
import { z } from 'zod'
import { eq, and, gte, lte, asc } from 'drizzle-orm'

const schema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  date: z.string(),
  duration: z.number().optional(),
  partySize: z.number().int().positive(),
  tableId: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const conditions = [eq(reservations.restaurantId, session.restaurantId)]
  if (status) conditions.push(eq(reservations.status, status))
  if (date) {
    conditions.push(gte(reservations.date, date + 'T00:00:00'))
    conditions.push(lte(reservations.date, date + 'T23:59:59'))
  }

  const resList = await db.select().from(reservations)
    .where(and(...conditions))
    .orderBy(asc(reservations.date))

  const result = await Promise.all(resList.map(async r => {
    const customer = r.customerId ? await db.select().from(customers).where(eq(customers.id, r.customerId)).then(rows => rows[0]) : null
    const table = r.tableId ? await db.select().from(tables).where(eq(tables.id, r.tableId)).then(rows => rows[0]) : null
    return { ...r, customer, table }
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  if (parsed.data.tableId) {
    const table = await db.select().from(tables)
      .where(and(eq(tables.id, parsed.data.tableId), eq(tables.restaurantId, session.restaurantId))).then(rows => rows[0])
    if (!table) return NextResponse.json({ error: 'שולחן לא נמצא' }, { status: 404 })
  }

  const id = crypto.randomUUID()
  await db.insert(reservations).values({ id, restaurantId: session.restaurantId, ...parsed.data })
  const res = await db.select().from(reservations).where(eq(reservations.id, id)).then(rows => rows[0])
  return NextResponse.json(res, { status: 201 })
}
