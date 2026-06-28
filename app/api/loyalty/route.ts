import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, loyaltyPrograms } from '@/lib/db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  pointsPerAmount: z.number().positive().optional(),
  rewardThreshold: z.number().int().positive().optional(),
  rewardValue: z.number().positive().optional(),
  rewardType: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const loyalty = await db.select().from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.restaurantId, session.restaurantId)).then(rows => rows[0])
  return NextResponse.json(loyalty)
}

export async function PUT(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const existing = await db.select().from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.restaurantId, session.restaurantId)).then(rows => rows[0])

  if (existing) {
    await db.update(loyaltyPrograms)
      .set({ ...parsed.data, updatedAt: new Date().toISOString() })
      .where(eq(loyaltyPrograms.restaurantId, session.restaurantId))
  } else {
    await db.insert(loyaltyPrograms).values({
      id: crypto.randomUUID(),
      restaurantId: session.restaurantId,
      ...parsed.data,
    })
  }

  const updated = await db.select().from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.restaurantId, session.restaurantId)).then(rows => rows[0])
  return NextResponse.json(updated)
}
