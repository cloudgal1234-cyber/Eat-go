import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, feedback, customers } from '@/lib/db'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'

const responseSchema = z.object({
  id: z.string(),
  response: z.string(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fbList = await db.select().from(feedback)
    .where(eq(feedback.restaurantId, session.restaurantId))
    .orderBy(desc(feedback.createdAt))

  const result = await Promise.all(fbList.map(async fb => {
    const customer = fb.customerId ? await db.select().from(customers).where(eq(customers.id, fb.customerId)).then(rows => rows[0]) : null
    return { ...fb, customer }
  }))

  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const fb = await db.select().from(feedback)
    .where(and(eq(feedback.id, parsed.data.id), eq(feedback.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!fb) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  await db.update(feedback)
    .set({ response: parsed.data.response, updatedAt: new Date().toISOString() })
    .where(eq(feedback.id, parsed.data.id))
  const updated = await db.select().from(feedback).where(eq(feedback.id, parsed.data.id)).then(rows => rows[0])
  return NextResponse.json(updated)
}
