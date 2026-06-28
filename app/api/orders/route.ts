import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, orders, orderItems, menuItems, customers, tables, deliveries } from '@/lib/db'
import { z } from 'zod'
import { eq, and, desc, inArray } from 'drizzle-orm'

const itemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

const schema = z.object({
  customerId: z.string().optional(),
  tableId: z.string().optional(),
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).default('DINE_IN'),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  const conditions = [eq(orders.restaurantId, session.restaurantId)]
  if (status) conditions.push(eq(orders.status, status))
  if (type) conditions.push(eq(orders.type, type))

  const orderList = await db.select().from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))

  const result = await Promise.all(orderList.map(async order => {
    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      notes: orderItems.notes,
      menuItemId: orderItems.menuItemId,
      menuItemName: menuItems.name,
    }).from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, order.id))

    const customer = order.customerId
      ? await db.select().from(customers).where(eq(customers.id, order.customerId)).then(rows => rows[0])
      : null

    const table = order.tableId
      ? await db.select().from(tables).where(eq(tables.id, order.tableId)).then(rows => rows[0])
      : null

    const delivery = await db.select({
      id: deliveries.id,
      status: deliveries.status,
      address: deliveries.address,
      estimatedTime: deliveries.estimatedTime,
      courierId: deliveries.courierId,
    }).from(deliveries).where(eq(deliveries.orderId, order.id)).then(rows => rows[0])

    return {
      ...order,
      items: items.map(i => ({ ...i, menuItem: { name: i.menuItemName || '' } })),
      customer,
      table,
      delivery,
    }
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

    const { items, customerId, tableId, type, notes, deliveryAddress, paymentMethod } = parsed.data

    const menuItemsList = await db.select().from(menuItems)
      .where(and(
        inArray(menuItems.id, items.map(i => i.menuItemId)),
        eq(menuItems.restaurantId, session.restaurantId)
      ))

    if (menuItemsList.length !== new Set(items.map(i => i.menuItemId)).size) {
      return NextResponse.json({ error: 'פריט תפריט לא תקין' }, { status: 400 })
    }

    const totalAmount = items.reduce((sum, item) => {
      const mi = menuItemsList.find(m => m.id === item.menuItemId)!
      return sum + mi.price * item.quantity
    }, 0)

    const orderId = crypto.randomUUID()
    await db.insert(orders).values({
      id: orderId,
      restaurantId: session.restaurantId,
      customerId,
      tableId,
      type,
      notes,
      deliveryAddress,
      paymentMethod,
      totalAmount,
    })

    for (const item of items) {
      const mi = menuItemsList.find(m => m.id === item.menuItemId)!
      await db.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: mi.price,
        notes: item.notes,
      })
    }

    if (type === 'DELIVERY' && deliveryAddress) {
      await db.insert(deliveries).values({
        id: crypto.randomUUID(),
        restaurantId: session.restaurantId,
        orderId,
        address: deliveryAddress,
      })
    }

    const order = await db.select().from(orders).where(eq(orders.id, orderId)).then(rows => rows[0])
    return NextResponse.json(order, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
