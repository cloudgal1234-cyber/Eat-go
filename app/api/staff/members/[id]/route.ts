import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, staffMembers } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const member = await db.select().from(staffMembers)
    .where(and(eq(staffMembers.id, params.id), eq(staffMembers.restaurantId, session.restaurantId)))
    .then(rows => rows[0])
  if (!member) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.update(staffMembers)
    .set({
      status: parsed.data.status,
      approvedAt: parsed.data.status === 'APPROVED' ? new Date().toISOString() : null,
    })
    .where(eq(staffMembers.id, params.id))

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  await db.delete(staffMembers)
    .where(and(eq(staffMembers.id, params.id), eq(staffMembers.restaurantId, session.restaurantId)))

  return NextResponse.json({ success: true })
}
