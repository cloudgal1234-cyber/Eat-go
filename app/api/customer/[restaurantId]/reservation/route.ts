import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, restaurants, reservations, customers } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  date: z.string(),
  partySize: z.number().int().positive(),
  duration: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  initDb()
  const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, params.restaurantId)).get()
  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  let customerId: string | undefined
  if (parsed.data.customerEmail) {
    const existing = await db.select().from(customers)
      .where(and(eq(customers.email, parsed.data.customerEmail), eq(customers.restaurantId, params.restaurantId))).get()

    if (existing) {
      customerId = existing.id
    } else {
      const cid = crypto.randomUUID()
      await db.insert(customers).values({
        id: cid, restaurantId: params.restaurantId,
        name: parsed.data.customerName, email: parsed.data.customerEmail, phone: parsed.data.customerPhone,
      })
      customerId = cid
    }
  }

  const id = crypto.randomUUID()
  await db.insert(reservations).values({
    id, restaurantId: params.restaurantId, customerId,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    date: parsed.data.date,
    partySize: parsed.data.partySize,
    duration: parsed.data.duration,
    notes: parsed.data.notes,
  })

  return NextResponse.json({ success: true, reservationId: id }, { status: 201 })
}
