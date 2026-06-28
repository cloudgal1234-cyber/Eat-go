import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, deliveries, couriers } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  courierId: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED']).optional(),
  estimatedTime: z.number().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const delivery = await db.select().from(deliveries)
    .where(and(eq(deliveries.id, params.id), eq(deliveries.restaurantId, session.restaurantId))).get()
  if (!delivery) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  if (parsed.data.courierId) {
    const courier = await db.select().from(couriers)
      .where(and(eq(couriers.id, parsed.data.courierId), eq(couriers.restaurantId, session.restaurantId))).get()
    if (!courier) return NextResponse.json({ error: 'שליח לא נמצא' }, { status: 404 })
  }

  await db.update(deliveries).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(deliveries.id, params.id))
  const updated = await db.select().from(deliveries).where(eq(deliveries.id, params.id)).get()
  return NextResponse.json(updated)
}
