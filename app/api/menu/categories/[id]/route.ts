import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, menuCategories } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cat = await db.select().from(menuCategories)
    .where(and(eq(menuCategories.id, params.id), eq(menuCategories.restaurantId, session.restaurantId))).get()
  if (!cat) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(menuCategories).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(menuCategories.id, params.id))
  const updated = await db.select().from(menuCategories).where(eq(menuCategories.id, params.id)).get()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cat = await db.select().from(menuCategories)
    .where(and(eq(menuCategories.id, params.id), eq(menuCategories.restaurantId, session.restaurantId))).get()
  if (!cat) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(menuCategories).where(eq(menuCategories.id, params.id))
  return NextResponse.json({ success: true })
}
