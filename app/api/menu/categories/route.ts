import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, menuCategories, menuItems } from '@/lib/db'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cats = await db.select().from(menuCategories)
    .where(eq(menuCategories.restaurantId, session.restaurantId))
    .orderBy(asc(menuCategories.sortOrder))

  const items = await db.select().from(menuItems)
    .where(eq(menuItems.restaurantId, session.restaurantId))

  const result = cats.map(cat => ({
    ...cat,
    items: items.filter(i => i.categoryId === cat.id),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const id = crypto.randomUUID()
  await db.insert(menuCategories).values({ id, restaurantId: session.restaurantId, ...parsed.data })
  const cat = await db.select().from(menuCategories).where(eq(menuCategories.id, id)).then(rows => rows[0])
  return NextResponse.json({ ...cat, items: [] }, { status: 201 })
}
