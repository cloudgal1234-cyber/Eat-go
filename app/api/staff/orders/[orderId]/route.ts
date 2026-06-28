import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, orders } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getStaffSessionFromRequest } from '@/lib/staff-auth'

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  await initDb()
  const session = await getStaffSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const order = await db.select().from(orders)
    .where(and(eq(orders.id, params.orderId), eq(orders.restaurantId, session.restaurantId)))
    .then(rows => rows[0])

  if (!order) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })

  const { role } = session
  let newStatus: string

  if (role === 'CHEF' && order.status === 'PENDING') {
    newStatus = 'READY'
  } else if (role === 'WAITER' && order.status === 'READY') {
    newStatus = 'DELIVERED'
  } else if (role === 'COURIER' && (order.status === 'PENDING' || order.status === 'READY')) {
    newStatus = 'DELIVERED'
  } else {
    return NextResponse.json({ error: 'פעולה לא מותרת' }, { status: 400 })
  }

  await db.update(orders)
    .set({ status: newStatus, updatedAt: new Date().toISOString() })
    .where(eq(orders.id, params.orderId))

  return NextResponse.json({ success: true, status: newStatus })
}
