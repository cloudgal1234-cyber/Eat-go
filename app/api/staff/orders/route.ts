import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, orders, orderItems, menuItems, tables, customers } from '@/lib/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getStaffSessionFromRequest } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  await initDb()
  const session = await getStaffSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { restaurantId, role } = session

  const statusFilter =
    role === 'CHEF' ? ['PENDING'] :
    role === 'WAITER' ? ['PENDING', 'READY'] :
    ['PENDING', 'READY'] // COURIER

  const allOrders = await db.select().from(orders)
    .where(and(eq(orders.restaurantId, restaurantId), inArray(orders.status, statusFilter)))

  const filteredOrders =
    role === 'CHEF' ? allOrders :
    role === 'WAITER' ? allOrders.filter(o => o.type !== 'DELIVERY') :
    allOrders.filter(o => o.type === 'DELIVERY') // COURIER

  if (filteredOrders.length === 0) return NextResponse.json({ orders: [] })

  const orderIds = filteredOrders.map(o => o.id)

  const items = await db.select({
    orderId: orderItems.orderId,
    quantity: orderItems.quantity,
    notes: orderItems.notes,
    menuItemName: menuItems.name,
  }).from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds))

  const tableIds = filteredOrders.map(o => o.tableId).filter(Boolean) as string[]
  const tableMap: Record<string, number> = {}
  if (tableIds.length > 0) {
    const ts = await db.select({ id: tables.id, number: tables.number })
      .from(tables).where(inArray(tables.id, tableIds))
    for (const t of ts) tableMap[t.id] = t.number
  }

  const customerIds = filteredOrders.map(o => o.customerId).filter(Boolean) as string[]
  const customerMap: Record<string, { name: string; phone: string | null }> = {}
  if (customerIds.length > 0) {
    const cs = await db.select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers).where(inArray(customers.id, customerIds))
    for (const c of cs) customerMap[c.id] = { name: c.name, phone: c.phone }
  }

  const result = filteredOrders.map(o => ({
    id: o.id,
    status: o.status,
    type: o.type,
    totalAmount: o.totalAmount,
    notes: o.notes,
    deliveryAddress: o.deliveryAddress,
    createdAt: o.createdAt,
    tableNumber: o.tableId ? tableMap[o.tableId] : null,
    customerName: (o.customerId ? customerMap[o.customerId]?.name : null) ?? 'לקוח',
    customerPhone: (o.customerId ? customerMap[o.customerId]?.phone : null) ?? null,
    items: items.filter(i => i.orderId === o.id),
  }))

  return NextResponse.json({ orders: result })
}
