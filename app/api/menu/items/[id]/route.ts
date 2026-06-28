import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, menuItems } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().nullable().optional(),
  image: z.string().optional(),
  isAvailable: z.boolean().optional(),
  allergens: z.string().optional(),
  preparationTime: z.number().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.select().from(menuItems)
    .where(and(eq(menuItems.id, params.id), eq(menuItems.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!item) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(menuItems).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(menuItems.id, params.id))
  const updated = await db.select().from(menuItems).where(eq(menuItems.id, params.id)).then(rows => rows[0])
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.select().from(menuItems)
    .where(and(eq(menuItems.id, params.id), eq(menuItems.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!item) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(menuItems).where(eq(menuItems.id, params.id))
  return NextResponse.json({ success: true })
}
