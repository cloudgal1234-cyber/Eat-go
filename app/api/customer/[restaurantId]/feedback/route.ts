import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, restaurants, feedback, customers } from '@/lib/db'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'

const schema = z.object({
  customerName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  category: z.string().optional(),
  customerEmail: z.string().email().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  initDb()
  const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, params.restaurantId)).then(rows => rows[0])
  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  let customerId: string | undefined
  if (parsed.data.customerEmail) {
    const customer = await db.select().from(customers)
      .where(and(eq(customers.email, parsed.data.customerEmail), eq(customers.restaurantId, params.restaurantId))).then(rows => rows[0])
    customerId = customer?.id
  }

  const id = crypto.randomUUID()
  await db.insert(feedback).values({
    id, restaurantId: params.restaurantId, customerId,
    customerName: parsed.data.customerName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    category: parsed.data.category,
  })

  return NextResponse.json({ success: true, id }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  initDb()
  const result = await db.select({
    id: feedback.id,
    customerName: feedback.customerName,
    rating: feedback.rating,
    comment: feedback.comment,
    category: feedback.category,
    response: feedback.response,
    createdAt: feedback.createdAt,
  }).from(feedback)
    .where(and(eq(feedback.restaurantId, params.restaurantId), eq(feedback.isPublic, true)))
    .orderBy(desc(feedback.createdAt))
    .limit(20)

  return NextResponse.json(result)
}
