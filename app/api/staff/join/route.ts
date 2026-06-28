import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, staffInviteCodes, restaurants } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { signStaffToken } from '@/lib/staff-auth'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1),
  staffName: z.string().min(2),
})

export async function POST(req: NextRequest) {
  await initDb()
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const { code, staffName } = parsed.data

  const invite = await db.select().from(staffInviteCodes)
    .where(and(eq(staffInviteCodes.code, code.toUpperCase()), eq(staffInviteCodes.isActive, true)))
    .then(rows => rows[0])

  if (!invite) return NextResponse.json({ error: 'קוד הצטרפות לא תקין' }, { status: 404 })

  const restaurant = await db.select({ id: restaurants.id, name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, invite.restaurantId))
    .then(rows => rows[0])

  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const token = await signStaffToken({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    staffName,
    role: invite.role as 'WAITER' | 'CHEF' | 'COURIER',
  })

  const res = NextResponse.json({ success: true, role: invite.role })
  res.cookies.set('eat-go-staff-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
