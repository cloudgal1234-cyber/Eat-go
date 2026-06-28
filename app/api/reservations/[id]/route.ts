import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, reservations } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  tableId: z.string().optional().nullable(),
  notes: z.string().optional(),
  date: z.string().optional(),
  duration: z.number().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await db.select().from(reservations)
    .where(and(eq(reservations.id, params.id), eq(reservations.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!res) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(reservations).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(reservations.id, params.id))
  const updated = await db.select().from(reservations).where(eq(reservations.id, params.id)).then(rows => rows[0])
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await db.select().from(reservations)
    .where(and(eq(reservations.id, params.id), eq(reservations.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!res) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(reservations).where(eq(reservations.id, params.id))
  return NextResponse.json({ success: true })
}
