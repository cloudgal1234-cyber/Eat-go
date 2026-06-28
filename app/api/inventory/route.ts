import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, inventoryItems } from '@/lib/db'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().optional(),
  supplier: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await db.select().from(inventoryItems)
    .where(eq(inventoryItems.restaurantId, session.restaurantId))
    .orderBy(asc(inventoryItems.name))
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
  await db.insert(inventoryItems).values({ id, restaurantId: session.restaurantId, ...parsed.data })
  const item = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get()
  return NextResponse.json(item, { status: 201 })
}
