import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, customers, orders } from '@/lib/db'
import { z } from 'zod'
import { eq, desc, sql } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customerList = await db.select().from(customers)
    .where(eq(customers.restaurantId, session.restaurantId))
    .orderBy(desc(customers.createdAt))

  const result = await Promise.all(customerList.map(async c => {
    const orderCount = await db.select({ count: sql<number>`count(*)` })
      .from(orders).where(eq(orders.customerId, c.id)).then(rows => rows[0])
    return { ...c, _count: { orders: orderCount?.count || 0 } }
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

  try {
    const id = crypto.randomUUID()
    await db.insert(customers).values({ id, restaurantId: session.restaurantId, ...parsed.data })
    const customer = await db.select().from(customers).where(eq(customers.id, id)).then(rows => rows[0])
    return NextResponse.json(customer, { status: 201 })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'לקוח עם אימייל זה כבר קיים' }, { status: 409 })
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
