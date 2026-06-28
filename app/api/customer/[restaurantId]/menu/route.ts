import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, restaurants, menuCategories, menuItems } from '@/lib/db'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  initDb()

  const restaurant = await db.select({
    id: restaurants.id,
    name: restaurants.name,
    description: restaurants.description,
    address: restaurants.address,
    phone: restaurants.phone,
    logo: restaurants.logo,
  }).from(restaurants).where(eq(restaurants.id, params.restaurantId)).then(rows => rows[0])

  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const cats = await db.select().from(menuCategories)
    .where(and(eq(menuCategories.restaurantId, params.restaurantId), eq(menuCategories.isActive, true)))
    .orderBy(asc(menuCategories.sortOrder))

  const items = await db.select().from(menuItems)
    .where(and(eq(menuItems.restaurantId, params.restaurantId), eq(menuItems.isAvailable, true)))

  const categories = cats.map(cat => ({
    ...cat,
    items: items.filter(i => i.categoryId === cat.id),
  }))

  return NextResponse.json({ restaurant, categories })
}
