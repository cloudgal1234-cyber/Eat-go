import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, inventoryItems } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0).optional(),
  minQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().optional(),
  supplier: z.string().optional(),
  category: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.select().from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.restaurantId, session.restaurantId))).get()
  if (!item) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(inventoryItems).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(inventoryItems.id, params.id))
  const updated = await db.select().from(inventoryItems).where(eq(inventoryItems.id, params.id)).get()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.select().from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.restaurantId, session.restaurantId))).get()
  if (!item) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(inventoryItems).where(eq(inventoryItems.id, params.id))
  return NextResponse.json({ success: true })
}
