import { getSession } from '@/lib/auth'
import { db, initDb, orders, employees, reservations, feedback as feedbackTable, customers } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { eq, and, gte, not, desc, sql } from 'drizzle-orm'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  initDb()
  const rid = session.restaurantId
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    ordersToday,
    pendingOrdersCount,
    totalRevenueData,
    revenueTodayData,
    employeesCount,
    pendingReservations,
    recentFeedback,
    activeCustomers,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(and(eq(orders.restaurantId, rid), gte(orders.createdAt, todayStart.toISOString()), not(eq(orders.status, 'CANCELLED')))).get(),
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(and(eq(orders.restaurantId, rid), sql`status IN ('PENDING','CONFIRMED','PREPARING')`)).get(),
    db.select({ total: sql<number>`sum(total_amount)` }).from(orders)
      .where(and(eq(orders.restaurantId, rid), eq(orders.paymentStatus, 'PAID'))).get(),
    db.select({ total: sql<number>`sum(total_amount)` }).from(orders)
      .where(and(eq(orders.restaurantId, rid), eq(orders.paymentStatus, 'PAID'), gte(orders.createdAt, todayStart.toISOString()))).get(),
    db.select({ count: sql<number>`count(*)` }).from(employees)
      .where(and(eq(employees.restaurantId, rid), eq(employees.isActive, true))).get(),
    db.select({ count: sql<number>`count(*)` }).from(reservations)
      .where(and(eq(reservations.restaurantId, rid), eq(reservations.status, 'PENDING'))).get(),
    db.select().from(feedbackTable)
      .where(eq(feedbackTable.restaurantId, rid))
      .orderBy(desc(feedbackTable.createdAt)).limit(5),
    db.select({ count: sql<number>`count(*)` }).from(customers)
      .where(eq(customers.restaurantId, rid)).get(),
  ])

  const avgRating = recentFeedback.length > 0
    ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
    : 0

  const stats = [
    { label: 'הזמנות היום', value: (ordersToday?.count || 0).toString(), icon: '🛒', color: 'bg-blue-50 border-blue-200', href: '/dashboard/orders' },
    { label: 'הכנסות היום', value: formatCurrency(revenueTodayData?.total || 0), icon: '💰', color: 'bg-green-50 border-green-200', href: '/dashboard/orders' },
    { label: 'הזמנות פתוחות', value: (pendingOrdersCount?.count || 0).toString(), icon: '⏳', color: 'bg-yellow-50 border-yellow-200', href: '/dashboard/orders' },
    { label: 'סה"כ הכנסות', value: formatCurrency(totalRevenueData?.total || 0), icon: '📈', color: 'bg-purple-50 border-purple-200', href: '/dashboard/orders' },
    { label: 'עובדים פעילים', value: (employeesCount?.count || 0).toString(), icon: '👥', color: 'bg-orange-50 border-orange-200', href: '/dashboard/employees' },
    { label: 'לקוחות', value: (activeCustomers?.count || 0).toString(), icon: '🧑‍🤝‍🧑', color: 'bg-pink-50 border-pink-200', href: '/dashboard/customers' },
    { label: 'הזמנות ממתינות', value: (pendingReservations?.count || 0).toString(), icon: '📅', color: 'bg-teal-50 border-teal-200', href: '/dashboard/reservations' },
    { label: 'דירוג ממוצע', value: avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : 'אין', icon: '💬', color: 'bg-indigo-50 border-indigo-200', href: '/dashboard/feedback' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-500 mt-1">סקירה כללית של המסעדה</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`border-2 hover:shadow-md transition-shadow cursor-pointer ${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">משובים אחרונים</h2>
          {recentFeedback.length === 0 ? (
            <p className="text-gray-400 text-sm">אין משובים עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map(f => (
                <div key={f.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {f.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{f.customerName}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-xs ${i < f.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {f.comment && <p className="text-xs text-gray-500 mt-0.5 truncate">{f.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/feedback" className="text-sm text-primary-600 hover:text-primary-700 mt-3 inline-block">
            צפה בכל המשובים →
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">קישורים מהירים</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/orders', label: 'הזמנה חדשה', icon: '➕' },
              { href: '/dashboard/menu', label: 'עדכן תפריט', icon: '✏️' },
              { href: '/dashboard/reservations', label: 'הזמנת מקום', icon: '📅' },
              { href: '/dashboard/inventory', label: 'בדוק מלאי', icon: '📦' },
              { href: '/dashboard/employees', label: 'ניהול עובדים', icon: '👥' },
              { href: '/dashboard/loyalty', label: 'נאמנות', icon: '⭐' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary-300 transition-colors"
              >
                <span>{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
