import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, tables } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  isAvailable: z.boolean().optional(),
  location: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const table = await db.select().from(tables)
    .where(and(eq(tables.id, params.id), eq(tables.restaurantId, session.restaurantId))).get()
  if (!table) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(tables).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(tables.id, params.id))
  const updated = await db.select().from(tables).where(eq(tables.id, params.id)).get()
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const table = await db.select().from(tables)
    .where(and(eq(tables.id, params.id), eq(tables.restaurantId, session.restaurantId))).get()
  if (!table) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(tables).where(eq(tables.id, params.id))
  return NextResponse.json({ success: true })
}
