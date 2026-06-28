import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db, initDb, restaurants, loyaltyPrograms } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    initDb()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

    const { name, email, password, phone, address } = parsed.data

    const existing = await db.select().from(restaurants).where(eq(restaurants.email, email)).then(rows => rows[0])
    if (existing) return NextResponse.json({ error: 'כתובת אימייל כבר קיימת במערכת' }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const id = crypto.randomUUID()

    await db.insert(restaurants).values({ id, name, email, password: hashedPassword, phone, address })
    await db.insert(loyaltyPrograms).values({ id: crypto.randomUUID(), restaurantId: id })

    const token = await signToken({ restaurantId: id, email, name })
    const response = NextResponse.json({ success: true }, { status: 201 })
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
