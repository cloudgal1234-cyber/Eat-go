import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, staffInviteCodes, staffMembers, restaurants } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { signStaffToken } from '@/lib/staff-auth'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1),
  staffName: z.string().min(2),
  staffPhone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  await initDb()
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const { code, staffName, staffPhone } = parsed.data

  const invite = await db.select().from(staffInviteCodes)
    .where(and(eq(staffInviteCodes.code, code.toUpperCase()), eq(staffInviteCodes.isActive, true)))
    .then(rows => rows[0])

  if (!invite) return NextResponse.json({ error: 'קוד הצטרפות לא תקין' }, { status: 404 })

  const restaurant = await db.select({ id: restaurants.id })
    .from(restaurants).where(eq(restaurants.id, invite.restaurantId)).then(rows => rows[0])
  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const id = crypto.randomUUID()
  await db.insert(staffMembers).values({
    id,
    restaurantId: invite.restaurantId,
    inviteCodeId: invite.id,
    name: staffName,
    phone: staffPhone,
    role: invite.role,
    status: 'PENDING',
  })

  const token = await signStaffToken({ staffMemberId: id, restaurantId: invite.restaurantId })

  const res = NextResponse.json({ success: true, status: 'PENDING' })
  res.cookies.set('eat-go-staff-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  })
  return res
}
