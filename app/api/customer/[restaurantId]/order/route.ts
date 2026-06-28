import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, restaurants, menuItems, customers, orders, orderItems, deliveries, loyaltyPrograms } from '@/lib/db'
import { z } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'

const schema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).default('DINE_IN'),
  tableId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE']).optional(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
})

export async function POST(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  initDb()
  const restaurant = await db.select().from(restaurants).where(eq(restaurants.id, params.restaurantId)).get()
  if (!restaurant) return NextResponse.json({ error: 'מסעדה לא נמצאה' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

  const { customerName, customerEmail, customerPhone, type, tableId, deliveryAddress, notes, paymentMethod, items } = parsed.data

  const menuItemsList = await db.select().from(menuItems)
    .where(and(
      inArray(menuItems.id, items.map(i => i.menuItemId)),
      eq(menuItems.restaurantId, params.restaurantId),
      eq(menuItems.isAvailable, true)
    ))

  if (menuItemsList.length !== new Set(items.map(i => i.menuItemId)).size) {
    return NextResponse.json({ error: 'פריט תפריט לא זמין' }, { status: 400 })
  }

  const totalAmount = items.reduce((sum, item) => {
    const mi = menuItemsList.find(m => m.id === item.menuItemId)!
    return sum + mi.price * item.quantity
  }, 0)

  let customerId: string | undefined
  if (customerEmail) {
    const existing = await db.select().from(customers)
      .where(and(eq(customers.email, customerEmail), eq(customers.restaurantId, params.restaurantId))).get()

    if (existing) {
      await db.update(customers).set({ name: customerName, phone: customerPhone, updatedAt: new Date().toISOString() })
        .where(eq(customers.id, existing.id))
      customerId = existing.id
    } else {
      const cid = crypto.randomUUID()
      await db.insert(customers).values({
        id: cid, restaurantId: params.restaurantId, name: customerName, email: customerEmail, phone: customerPhone,
      })
      customerId = cid
    }
  }

  const orderId = crypto.randomUUID()
  await db.insert(orders).values({
    id: orderId, restaurantId: params.restaurantId, customerId, tableId, type, notes,
    deliveryAddress, paymentMethod: paymentMethod as string | undefined, totalAmount,
  })

  for (const item of items) {
    const mi = menuItemsList.find(m => m.id === item.menuItemId)!
    await db.insert(orderItems).values({
      id: crypto.randomUUID(), orderId,
      menuItemId: item.menuItemId, quantity: item.quantity, price: mi.price, notes: item.notes,
    })
  }

  if (type === 'DELIVERY' && deliveryAddress) {
    await db.insert(deliveries).values({
      id: crypto.randomUUID(), restaurantId: params.restaurantId, orderId, address: deliveryAddress,
    })
  }

  return NextResponse.json({ orderId, totalAmount, status: 'PENDING' }, { status: 201 })
}
