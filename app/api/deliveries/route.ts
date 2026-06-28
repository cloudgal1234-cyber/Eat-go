import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, deliveries, orders, customers, orderItems, menuItems, couriers } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deliveryList = await db.select().from(deliveries)
    .where(eq(deliveries.restaurantId, session.restaurantId))
    .orderBy(desc(deliveries.createdAt))

  const result = await Promise.all(deliveryList.map(async d => {
    const order = await db.select().from(orders).where(eq(orders.id, d.orderId)).get()
    const customer = order?.customerId ? await db.select().from(customers).where(eq(customers.id, order.customerId)).get() : null
    const items = await db.select({ qty: orderItems.quantity, menuItemName: menuItems.name })
      .from(orderItems).leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, d.orderId))
    const courier = d.courierId ? await db.select().from(couriers).where(eq(couriers.id, d.courierId)).get() : null

    return {
      ...d,
      order: {
        id: d.orderId,
        totalAmount: order?.totalAmount || 0,
        customer: customer || null,
        items: items.map(i => ({ quantity: i.qty, menuItem: { name: i.menuItemName || '' } })),
      },
      courier,
    }
  }))

  return NextResponse.json(result)
}
