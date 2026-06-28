'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

interface Order {
  id: string
  type: string
  status: string
  paymentStatus: string
  paymentMethod?: string
  totalAmount: number
  notes?: string
  createdAt: string
  customer?: { name: string; phone?: string }
  table?: { number: number }
  delivery?: { status: string; courier?: { name: string } }
  items: { id: string; quantity: number; price: number; notes?: string; menuItem: { name: string } }[]
}

const statusOptions = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'PENDING', label: 'ממתין' },
  { value: 'CONFIRMED', label: 'אושר' },
  { value: 'PREPARING', label: 'בהכנה' },
  { value: 'READY', label: 'מוכן' },
  { value: 'DELIVERED', label: 'נמסר' },
  { value: 'CANCELLED', label: 'בוטל' },
]

const orderStatusOptions = [
  { value: 'CONFIRMED', label: 'אשר' },
  { value: 'PREPARING', label: 'בהכנה' },
  { value: 'READY', label: 'מוכן' },
  { value: 'DELIVERED', label: 'נמסר' },
  { value: 'CANCELLED', label: 'בטל' },
]

const paymentOptions = [
  { value: 'PAID', label: 'שולם' },
  { value: 'PENDING', label: 'ממתין לתשלום' },
  { value: 'REFUNDED', label: 'הוחזר' },
]

const paymentMethodOptions = [
  { value: 'CASH', label: 'מזומן' },
  { value: 'CARD', label: 'כרטיס' },
  { value: 'ONLINE', label: 'אונליין' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    const params = filterStatus ? `?status=${filterStatus}` : ''
    const res = await fetch(`/api/orders${params}`)
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrders()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status } : null)
    }
  }

  async function updatePayment(orderId: string, paymentStatus: string, paymentMethod?: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, paymentMethod }),
    })
    fetchOrders()
  }

  const typeLabel: Record<string, string> = { DINE_IN: '🪑 פנים', TAKEAWAY: '🥡 טייק אווי', DELIVERY: '🚚 משלוח' }

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול הזמנות</h1>
          <p className="text-gray-500 mt-1">{orders.length} הזמנות</p>
        </div>
        <div className="w-48">
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOptions} />
        </div>
      </div>

      <div className="space-y-3">
        {orders.length === 0 && <p className="text-center text-gray-400 py-12">אין הזמנות</p>}
        {orders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className="text-sm text-gray-600">{typeLabel[order.type]}</span>
                    {order.table && <span className="text-sm text-gray-500">שולחן {order.table.number}</span>}
                  </div>
                  <p className="text-sm text-gray-700">
                    {order.customer ? order.customer.name : 'לקוח אורח'}
                    {' · '}
                    {order.items.length} פריטים
                    {' · '}
                    <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
                <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                  {order.paymentStatus === 'PAID' ? '✓ שולם' : 'ממתין'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="פרטי הזמנה" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">מספר הזמנה</p>
                <p className="font-mono font-bold">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-gray-500">סוג</p>
                <p className="font-medium">{typeLabel[selectedOrder.type]}</p>
              </div>
              {selectedOrder.customer && (
                <div>
                  <p className="text-gray-500">לקוח</p>
                  <p className="font-medium">{selectedOrder.customer.name}</p>
                  {selectedOrder.customer.phone && <p className="text-gray-600">{selectedOrder.customer.phone}</p>}
                </div>
              )}
              {selectedOrder.table && (
                <div>
                  <p className="text-gray-500">שולחן</p>
                  <p className="font-medium">שולחן {selectedOrder.table.number}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">פריטים</h3>
              <div className="space-y-2">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    {item.notes && <span className="text-gray-400 text-xs">({item.notes})</span>}
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>סה"כ</span>
                  <span className="text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-yellow-800">הערות:</p>
                <p className="text-yellow-700">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">עדכון סטטוס</p>
                <div className="flex gap-2 flex-wrap">
                  {orderStatusOptions.map(opt => (
                    <Button key={opt.value} size="sm" variant={selectedOrder.status === opt.value ? 'primary' : 'outline'}
                      onClick={() => updateStatus(selectedOrder.id, opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">תשלום</p>
                <div className="flex gap-2 flex-wrap">
                  {paymentOptions.map(opt => (
                    <Button key={opt.value} size="sm" variant={selectedOrder.paymentStatus === opt.value ? 'primary' : 'outline'}
                      onClick={() => updatePayment(selectedOrder.id, opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {selectedOrder.paymentStatus !== 'PAID' && (
                  <div className="flex gap-2 mt-2">
                    {paymentMethodOptions.map(opt => (
                      <Button key={opt.value} size="sm" variant="ghost"
                        onClick={() => updatePayment(selectedOrder.id, 'PAID', opt.value)}>
                        שלם ב{opt.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
