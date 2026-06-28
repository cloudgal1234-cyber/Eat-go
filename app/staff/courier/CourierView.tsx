'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface OrderItem { menuItemName: string; quantity: number }
interface Order {
  id: string; status: string; totalAmount: number; notes?: string | null
  deliveryAddress?: string | null; customerName: string; customerPhone?: string | null
  createdAt: string; items: OrderItem[]
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'עכשיו'
  if (diff === 1) return 'לפני דקה'
  return `לפני ${diff} דק׳`
}

function mapsUrl(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}

function formatCurrency(n: number) {
  return `₪${n.toFixed(0)}`
}

export default function CourierView({ staffName, restaurantName }: { staffName: string; restaurantName: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const router = useRouter()

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/staff/orders')
    if (res.status === 401) { router.push('/staff'); return }
    if (!res.ok) return
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(fetchOrders, 8000)
    return () => clearInterval(id)
  }, [fetchOrders])

  async function markDelivered(orderId: string) {
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <div>
              <p className="font-bold text-sm leading-tight text-gray-900">{staffName}</p>
              <p className="text-gray-400 text-xs">{restaurantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {orders.length > 0 && (
              <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {orders.length} משלוחים
              </span>
            )}
            <button onClick={logout} className="text-gray-400 hover:text-gray-600 text-sm">יציאה</button>
          </div>
        </div>
      </header>

      <div className="p-4 pb-8 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">✅</div>
            <p className="text-gray-500 font-medium">אין משלוחים ממתינים</p>
            <p className="text-gray-400 text-sm mt-2">מתרענן אוטומטית כל 8 שניות</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{order.customerName}</p>
                  <p className="text-gray-500 text-xs">{timeAgo(order.createdAt)} · {formatCurrency(order.totalAmount)}</p>
                </div>
                {order.status === 'READY' ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">מוכן לאיסוף</span>
                ) : (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">בהכנה</span>
                )}
              </div>

              <div className="p-4 space-y-3">
                {order.deliveryAddress && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">כתובת למשלוח</p>
                    <p className="font-semibold text-gray-900 text-sm">{order.deliveryAddress}</p>
                    <a
                      href={mapsUrl(order.deliveryAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      🗺️ נווט עכשיו
                    </a>
                  </div>
                )}

                {order.customerPhone && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">טלפון</p>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="flex items-center gap-2 text-primary-600 font-medium text-sm"
                    >
                      📞 {order.customerPhone}
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">פריטים</p>
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="font-bold text-primary-600">{item.quantity}×</span>
                        <span>{item.menuItemName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-yellow-700 text-sm">📝 {order.notes}</p>
                  </div>
                )}

                <button
                  onClick={() => markDelivered(order.id)}
                  disabled={completing === order.id}
                  className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
                >
                  {completing === order.id ? '...' : '✓ נמסר ללקוח'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
