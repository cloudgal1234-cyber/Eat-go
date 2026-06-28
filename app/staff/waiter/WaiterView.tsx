'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface OrderItem { menuItemName: string; quantity: number; notes?: string | null }
interface Order {
  id: string; status: string; type: string; notes?: string | null
  tableNumber?: number | null; customerName: string; createdAt: string
  totalAmount: number; items: OrderItem[]
}
interface TableData {
  id: string; number: number; capacity: number; location?: string | null
  activeOrders: { id: string; status: string }[]
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'עכשיו'
  if (diff === 1) return 'לפני דקה'
  return `לפני ${diff} דק׳`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    PENDING: { bg: 'bg-orange-100 text-orange-700', label: 'בהכנה' },
    READY: { bg: 'bg-green-100 text-green-700', label: 'מוכן' },
  }
  const s = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg}`}>{s.label}</span>
}

export default function WaiterView({ staffName, restaurantName }: { staffName: string; restaurantName: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<TableData[]>([])
  const [tab, setTab] = useState<'ready' | 'tables' | 'all'>('ready')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const [ordRes, tblRes] = await Promise.all([
      fetch('/api/staff/orders'),
      fetch('/api/staff/tables'),
    ])
    if (ordRes.status === 401 || tblRes.status === 401) { router.push('/staff'); return }
    const [ordData, tblData] = await Promise.all([ordRes.json(), tblRes.json()])
    setOrders(ordData.orders ?? [])
    setTables(tblData.tables ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 8000)
    return () => clearInterval(id)
  }, [fetchData])

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

  const readyOrders = orders.filter(o => o.status === 'READY')
  const allOrders = orders

  const tableOrders = selectedTable
    ? allOrders.filter(o => o.tableNumber === tables.find(t => t.id === selectedTable)?.number)
    : []

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧑‍🍽️</span>
            <div>
              <p className="font-bold text-sm leading-tight text-gray-900">{staffName}</p>
              <p className="text-gray-400 text-xs">{restaurantName}</p>
            </div>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">יציאה</button>
        </div>

        <div className="flex mt-3 max-w-lg mx-auto">
          {([
            { key: 'ready', label: `מוכן למסירה${readyOrders.length > 0 ? ` (${readyOrders.length})` : ''}`, icon: '🍽️' },
            { key: 'tables', label: 'שולחנות', icon: '🪑' },
            { key: 'all', label: 'כל ההזמנות', icon: '📋' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedTable(null) }}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 pb-8 max-w-lg mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : (
          <>
            {tab === 'ready' && (
              <>
                {readyOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-3">✅</div>
                    <p className="text-gray-400 font-medium">אין הזמנות מוכנות</p>
                    <p className="text-gray-300 text-sm mt-1">מתרענן אוטומטית</p>
                  </div>
                ) : (
                  readyOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
                      <div className="bg-green-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {order.tableNumber ? `שולחן ${order.tableNumber}` : order.customerName}
                            </span>
                            {order.type === 'TAKEAWAY' && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">טייק אווי</span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs">{timeAgo(order.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => markDelivered(order.id)}
                          disabled={completing === order.id}
                          className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
                        >
                          {completing === order.id ? '...' : '✓ נמסר'}
                        </button>
                      </div>
                      <div className="px-4 py-3 space-y-1.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-primary-600 w-5 text-center">{item.quantity}×</span>
                            <span className="text-gray-800">{item.menuItemName}</span>
                            {item.notes && <span className="text-orange-500 text-xs">({item.notes})</span>}
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="mx-4 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                          <p className="text-yellow-700 text-xs">📝 {order.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {tab === 'tables' && (
              <>
                {selectedTable ? (
                  <>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="flex items-center gap-1 text-primary-600 text-sm font-medium mb-2"
                    >
                      ← חזור לשולחנות
                    </button>
                    {tableOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">אין הזמנות פעילות לשולחן זה</div>
                    ) : (
                      tableOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <StatusBadge status={order.status} />
                            <span className="text-gray-400 text-xs">{timeAgo(order.createdAt)}</span>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-primary-600">{item.quantity}×</span>
                                <span>{item.menuItemName}</span>
                              </div>
                            ))}
                          </div>
                          {order.status === 'READY' && (
                            <button
                              onClick={() => markDelivered(order.id)}
                              disabled={completing === order.id}
                              className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {completing === order.id ? '...' : '✓ נמסר'}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {tables.length === 0 ? (
                      <p className="text-gray-400 text-sm col-span-3 text-center py-8">אין שולחנות מוגדרים</p>
                    ) : (
                      tables.map(t => {
                        const readyCount = t.activeOrders.filter(o => o.status === 'READY').length
                        const pendingCount = t.activeOrders.filter(o => o.status === 'PENDING').length
                        const hasOrders = t.activeOrders.length > 0

                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTable(t.id)}
                            className={`rounded-2xl p-4 flex flex-col items-center gap-1 border-2 transition-all ${
                              readyCount > 0
                                ? 'bg-green-50 border-green-400'
                                : pendingCount > 0
                                ? 'bg-orange-50 border-orange-300'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className="text-2xl font-black text-gray-900">{t.number}</span>
                            {hasOrders ? (
                              <span className={`text-xs font-medium ${readyCount > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                {readyCount > 0 ? `${readyCount} מוכן` : `${pendingCount} בהכנה`}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">פנוי</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </>
            )}

            {tab === 'all' && (
              <>
                {allOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-3">📋</div>
                    <p className="text-gray-400 font-medium">אין הזמנות פעילות</p>
                  </div>
                ) : (
                  allOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {order.tableNumber ? `שולחן ${order.tableNumber}` : order.customerName}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <span className="text-gray-400 text-xs">{timeAgo(order.createdAt)}</span>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-bold text-primary-600">{item.quantity}×</span>
                            <span>{item.menuItemName}</span>
                          </div>
                        ))}
                      </div>
                      {order.status === 'READY' && (
                        <button
                          onClick={() => markDelivered(order.id)}
                          disabled={completing === order.id}
                          className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {completing === order.id ? '...' : '✓ נמסר'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
