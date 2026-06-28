import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, restaurants } from '@/lib/db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurant = await db.select({
    id: restaurants.id,
    name: restaurants.name,
    email: restaurants.email,
    phone: restaurants.phone,
    address: restaurants.address,
    description: restaurants.description,
    logo: restaurants.logo,
    createdAt: restaurants.createdAt,
  }).from(restaurants).where(eq(restaurants.id, session.restaurantId)).then(rows => rows[0])

  return NextResponse.json(restaurant)
}

export async function PUT(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(restaurants)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(restaurants.id, session.restaurantId))

  const updated = await db.select({
    id: restaurants.id, name: restaurants.name, email: restaurants.email,
    phone: restaurants.phone, address: restaurants.address, description: restaurants.description, logo: restaurants.logo,
  }).from(restaurants).where(eq(restaurants.id, session.restaurantId)).then(rows => rows[0])

  return NextResponse.json(updated)
}
