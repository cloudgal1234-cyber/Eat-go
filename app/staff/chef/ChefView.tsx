'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface OrderItem { menuItemName: string; quantity: number; notes?: string | null }
interface Order {
  id: string; status: string; type: string; notes?: string | null
  tableNumber?: number | null; customerName: string; createdAt: string
  items: OrderItem[]
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'עכשיו'
  if (diff === 1) return 'לפני דקה'
  return `לפני ${diff} דק׳`
}

function typeLabel(t: string) {
  return t === 'DINE_IN' ? 'במקום' : t === 'TAKEAWAY' ? 'טייק אווי' : 'משלוח'
}

export default function ChefView({ staffName, restaurantName }: { staffName: string; restaurantName: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const router = useRouter()

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/staff/orders')
    if (res.status === 401) { router.push('/staff'); return }
    if (!res.ok) return
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLastUpdate(new Date())
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(fetchOrders, 8000)
    return () => clearInterval(id)
  }, [fetchOrders])

  async function markReady(orderId: string) {
    setCompleting(orderId)
    const res = await fetch(`/api/staff/orders/${orderId}`, { method: 'PATCH' })
    if (res.ok) setOrders(prev => prev.filter(o => o.id !== orderId))
    setCompleting(null)
  }

  async function logout() {
    await fetch('/api/auth/staff-logout', { method: 'POST' })
    router.push('/staff')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍🍳</span>
            <div>
              <p className="font-bold text-sm leading-tight">{staffName}</p>
              <p className="text-gray-400 text-xs">{restaurantName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orders.length > 0 && (
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              {orders.length} להכנה
            </span>
          )}
          <button onClick={logout} className="text-gray-400 hover:text-white text-sm transition-colors">יציאה</button>
        </div>
      </header>

      <div className="p-4 pb-8 space-y-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-500">טוען...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">✅</div>
            <p className="text-gray-400 text-lg font-medium">אין הזמנות להכנה</p>
            <p className="text-gray-600 text-sm mt-2">מתרענן אוטומטית כל 8 שניות</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between bg-gray-750">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base">
                      {order.tableNumber ? `שולחן ${order.tableNumber}` : order.customerName}
                    </span>
                    <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {typeLabel(order.type)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{timeAgo(order.createdAt)}</p>
                </div>
                <button
                  onClick={() => markReady(order.id)}
                  disabled={completing === order.id}
                  className="bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors shrink-0"
                >
                  {completing === order.id ? '...' : '✓ מוכן'}
                </button>
              </div>

              <div className="px-4 py-3 space-y-2.5 border-t border-gray-700">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="bg-primary-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.menuItemName}</p>
                      {item.notes && (
                        <p className="text-yellow-300 text-xs mt-0.5">⚠️ {item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                  <p className="text-yellow-300 text-sm">📝 {order.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-gray-700 text-xs">
        עודכן {lastUpdate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
