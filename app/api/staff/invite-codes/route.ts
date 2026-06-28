import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, staffInviteCodes } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const createSchema = z.object({
  role: z.enum(['WAITER', 'CHEF', 'COURIER']),
  label: z.string().optional(),
})

export async function GET(req: NextRequest) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const codes = await db.select().from(staffInviteCodes)
    .where(and(
      eq(staffInviteCodes.restaurantId, session.restaurantId),
      eq(staffInviteCodes.isActive, true)
    ))

  return NextResponse.json({ codes })
}

export async function POST(req: NextRequest) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const code = generateCode()
  const id = crypto.randomUUID()
  await db.insert(staffInviteCodes).values({
    id,
    restaurantId: session.restaurantId,
    code,
    role: parsed.data.role,
    label: parsed.data.label,
  })

  return NextResponse.json({ code, id }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const codeId = searchParams.get('id')
  if (!codeId) return NextResponse.json({ error: 'חסר מזהה' }, { status: 400 })

  await db.update(staffInviteCodes)
    .set({ isActive: false })
    .where(and(
      eq(staffInviteCodes.id, codeId),
      eq(staffInviteCodes.restaurantId, session.restaurantId)
    ))

  return NextResponse.json({ success: true })
}
