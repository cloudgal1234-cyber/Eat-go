import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, orders, orderItems, menuItems, customers, tables, deliveries, couriers, loyaltyPrograms } from '@/lib/db'
import { z } from 'zod'
import { eq, and, sql } from 'drizzle-orm'

const schema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await db.select().from(orders)
    .where(and(eq(orders.id, params.id), eq(orders.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!order) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const items = await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    price: orderItems.price,
    notes: orderItems.notes,
    menuItemName: menuItems.name,
  }).from(orderItems).leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id)).where(eq(orderItems.orderId, params.id))

  const customer = order.customerId ? await db.select().from(customers).where(eq(customers.id, order.customerId)).then(rows => rows[0]) : null
  const table = order.tableId ? await db.select().from(tables).where(eq(tables.id, order.tableId)).then(rows => rows[0]) : null
  const delivery = await db.select().from(deliveries).where(eq(deliveries.orderId, params.id)).then(rows => rows[0])
  let courier = null
  if (delivery?.courierId) courier = await db.select().from(couriers).where(eq(couriers.id, delivery.courierId)).then(rows => rows[0])

  return NextResponse.json({
    ...order,
    items: items.map(i => ({ ...i, menuItem: { name: i.menuItemName || '' } })),
    customer, table,
    delivery: delivery ? { ...delivery, courier } : null,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await db.select().from(orders)
    .where(and(eq(orders.id, params.id), eq(orders.restaurantId, session.restaurantId))).then(rows => rows[0])
  if (!order) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  await db.update(orders).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(orders.id, params.id))

  if (parsed.data.paymentStatus === 'PAID' && order.paymentStatus !== 'PAID' && order.customerId) {
    const loyalty = await db.select().from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.restaurantId, session.restaurantId)).then(rows => rows[0])
    if (loyalty?.isActive) {
      const points = Math.floor(order.totalAmount * loyalty.pointsPerAmount)
      await db.update(customers).set({
        loyaltyPoints: sql`loyalty_points + ${points}`,
        totalSpent: sql`total_spent + ${order.totalAmount}`,
        updatedAt: new Date().toISOString(),
      }).where(eq(customers.id, order.customerId))
    }
  }

  const updated = await db.select().from(orders).where(eq(orders.id, params.id)).then(rows => rows[0])
  return NextResponse.json(updated)
}
