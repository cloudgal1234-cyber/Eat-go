import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db, initDb, restaurants } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    initDb()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

    const { email, password } = parsed.data
    const restaurant = await db.select().from(restaurants).where(eq(restaurants.email, email)).then(rows => rows[0])
    if (!restaurant) return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })

    const match = await bcrypt.compare(password, restaurant.password)
    if (!match) return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })

    const token = await signToken({ restaurantId: restaurant.id, email: restaurant.email, name: restaurant.name })
    const response = NextResponse.json({ success: true })
    response.cookies.set('eat-go-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
