import { db } from '@/lib/db'
import { restaurants, menuCategories, menuItems } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import CustomerView from './CustomerView'

export const dynamic = 'force-dynamic'

export default async function CustomerPage({ params }: { params: { restaurantId: string } }) {
  const { restaurantId } = params

  const restaurant = await db.select({
    id: restaurants.id,
    name: restaurants.name,
    description: restaurants.description,
    address: restaurants.address,
    phone: restaurants.phone,
  }).from(restaurants).where(eq(restaurants.id, restaurantId)).then(rows => rows[0])

  if (!restaurant) notFound()

  const cats = await db.select().from(menuCategories)
    .where(eq(menuCategories.restaurantId, restaurantId))
    .orderBy(asc(menuCategories.sortOrder))

  const items = await db.select().from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId))

  const categories = cats.map(cat => ({
    ...cat,
    items: items.filter(i => i.categoryId === cat.id),
  }))

  return <CustomerView restaurant={restaurant} categories={categories} restaurantId={restaurantId} />
}
