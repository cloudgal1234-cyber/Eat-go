import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, employees } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  salary: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const emp = await db.select().from(employees)
    .where(and(eq(employees.id, params.id), eq(employees.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!emp) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(employees).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(employees.id, params.id))
  const updated = await db.select().from(employees).where(eq(employees.id, params.id)).then(rows => rows[0])
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const emp = await db.select().from(employees)
    .where(and(eq(employees.id, params.id), eq(employees.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!emp) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.delete(employees).where(eq(employees.id, params.id))
  return NextResponse.json({ success: true })
}
