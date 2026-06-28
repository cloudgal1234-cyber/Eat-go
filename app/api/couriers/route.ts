import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, couriers } from '@/lib/db'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  isAvailable: z.boolean().optional(),
  vehicleType: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await db.select().from(couriers)
    .where(eq(couriers.restaurantId, session.restaurantId))
    .orderBy(asc(couriers.name))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const id = crypto.randomUUID()
  await db.insert(couriers).values({ id, restaurantId: session.restaurantId, ...parsed.data })
  const courier = await db.select().from(couriers).where(eq(couriers.id, id)).then(rows => rows[0])
  return NextResponse.json(courier, { status: 201 })
}
