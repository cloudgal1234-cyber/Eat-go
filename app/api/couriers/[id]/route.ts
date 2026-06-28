import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, couriers } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  isAvailable: z.boolean().optional(),
  vehicleType: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courier = await db.select().from(couriers)
    .where(and(eq(couriers.id, params.id), eq(couriers.restaurantId, session.restaurantId))).get()
  if (!courier) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(couriers).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(couriers.id, params.id))
  const updated = await db.select().from(couriers).where(eq(couriers.id, params.id)).get()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courier = await db.select().from(couriers)
    .where(and(eq(couriers.id, params.id), eq(couriers.restaurantId, session.restaurantId))).get()
  if (!courier) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(couriers).where(eq(couriers.id, params.id))
  return NextResponse.json({ success: true })
}
