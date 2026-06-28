import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, tables, orders } from '@/lib/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getStaffSessionFromRequest } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  await initDb()
  const session = await getStaffSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { restaurantId } = session

  const allTables = await db.select().from(tables)
    .where(eq(tables.restaurantId, restaurantId))

  const activeOrders = await db.select({
    id: orders.id,
    tableId: orders.tableId,
    status: orders.status,
  }).from(orders)
    .where(and(
      eq(orders.restaurantId, restaurantId),
      inArray(orders.status, ['PENDING', 'READY'])
    ))

  const result = allTables.map(t => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    location: t.location,
    activeOrders: activeOrders.filter(o => o.tableId === t.id),
  }))

  return NextResponse.json({ tables: result })
}
