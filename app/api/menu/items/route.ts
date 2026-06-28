import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, menuItems, menuCategories } from '@/lib/db'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.string().optional(),
  image: z.string().optional(),
  isAvailable: z.boolean().optional(),
  allergens: z.string().optional(),
  preparationTime: z.number().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await db.select({
    id: menuItems.id,
    restaurantId: menuItems.restaurantId,
    categoryId: menuItems.categoryId,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    image: menuItems.image,
    isAvailable: menuItems.isAvailable,
    allergens: menuItems.allergens,
    preparationTime: menuItems.preparationTime,
    createdAt: menuItems.createdAt,
    categoryName: menuCategories.name,
  }).from(menuItems)
    .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(eq(menuItems.restaurantId, session.restaurantId))
    .orderBy(desc(menuItems.createdAt))

  return NextResponse.json(items.map(i => ({
    ...i,
    category: i.categoryName ? { name: i.categoryName } : null,
  })))
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  if (parsed.data.categoryId) {
    const cat = await db.select().from(menuCategories)
      .where(and(eq(menuCategories.id, parsed.data.categoryId), eq(menuCategories.restaurantId, session.restaurantId))).then(rows => rows[0])
    if (!cat) return NextResponse.json({ error: 'קטגוריה לא נמצאה' }, { status: 404 })
  }

  const id = crypto.randomUUID()
  await db.insert(menuItems).values({ id, restaurantId: session.restaurantId, ...parsed.data })
  const item = await db.select().from(menuItems).where(eq(menuItems.id, id)).then(rows => rows[0])
  return NextResponse.json(item, { status: 201 })
}
