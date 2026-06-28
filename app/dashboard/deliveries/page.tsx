'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { formatCurrency, formatDateTime, DELIVERY_STATUS_LABELS } from '@/lib/utils'

interface Delivery {
  id: string
  address: string
  status: string
  estimatedTime?: number
  createdAt: string
  order: { id: string; totalAmount: number; customer?: { name: string; phone?: string }; items: { quantity: number; menuItem: { name: string } }[] }
  courier?: { id: string; name: string; phone: string }
}

interface Courier { id: string; name: string; phone: string; isAvailable: boolean; vehicleType?: string }

const deliveryStatusColors: Record<string, string> = {
  PENDING: 'warning',
  ASSIGNED: 'info',
  PICKED_UP: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)
  const [showCourierModal, setShowCourierModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [saving, setSaving] = useState(false)
  const [courierForm, setCourierForm] = useState({ name: '', phone: '', vehicleType: '' })
  const [assignCourierId, setAssignCourierId] = useState('')

  const fetchData = useCallback(async () => {
    const [dRes, cRes] = await Promise.all([fetch('/api/deliveries'), fetch('/api/couriers')])
    if (dRes.ok) setDeliveries(await dRes.json())
    if (cRes.ok) setCouriers(await cRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function updateDelivery(id: string, data: object) {
    await fetch(`/api/deliveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchData()
  }

  async function saveCourier() {
    setSaving(true)
    const res = await fetch('/api/couriers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courierForm),
    })
    if (res.ok) { await fetchData(); setShowCourierModal(false) }
    setSaving(false)
  }

  async function toggleCourier(courier: Courier) {
    await fetch(`/api/couriers/${courier.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !courier.isAvailable }),
    })
    fetchData()
  }

  const courierOptions = couriers.filter(c => c.isAvailable).map(c => ({ value: c.id, label: `${c.name} (${c.vehicleType || 'כלי רכב'})` }))

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול משלוחים</h1>
          <p className="text-gray-500 mt-1">{deliveries.length} משלוחים</p>
        </div>
        <Button onClick={() => { setCourierForm({ name: '', phone: '', vehicleType: '' }); setShowCourierModal(true) }}>+ שליח חדש</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'ממתינים', count: deliveries.filter(d => d.status === 'PENDING').length, color: 'bg-yellow-50 border-yellow-200' },
          { label: 'בדרך', count: deliveries.filter(d => ['ASSIGNED', 'PICKED_UP'].includes(d.status)).length, color: 'bg-blue-50 border-blue-200' },
          { label: 'נמסרו', count: deliveries.filter(d => d.status === 'DELIVERED').length, color: 'bg-green-50 border-green-200' },
          { label: 'שליחים זמינים', count: couriers.filter(c => c.isAvailable).length, color: 'bg-purple-50 border-purple-200' },
        ].map(s => (
          <Card key={s.label} className={`border-2 ${s.color}`}>
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.count}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">משלוחים</h2>
          <div className="space-y-3">
            {deliveries.map(delivery => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDelivery(delivery); setAssignCourierId(delivery.courier?.id || '') }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{delivery.order.customer?.name || 'לקוח'}</p>
                    <p className="text-sm text-gray-500 truncate max-w-48">{delivery.address}</p>
                  </div>
                  <Badge variant={deliveryStatusColors[delivery.status] as 'warning' | 'info' | 'success' | 'danger' | 'default'}>
                    {DELIVERY_STATUS_LABELS[delivery.status]}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{delivery.order.items.length} פריטים · {formatCurrency(delivery.order.totalAmount)}</p>
                  {delivery.courier && <p className="text-green-600">🚴 {delivery.courier.name}</p>}
                  {delivery.estimatedTime && <p className="text-gray-400">⏱ {delivery.estimatedTime} דקות</p>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(delivery.createdAt)}</p>
              </Card>
            ))}
            {deliveries.length === 0 && <p className="text-center text-gray-400 py-8">אין משלוחים</p>}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">שליחים</h2>
          <div className="space-y-3">
            {couriers.map(courier => (
              <Card key={courier.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{courier.name}</p>
                    <p className="text-sm text-gray-500">📱 {courier.phone}</p>
                    {courier.vehicleType && <p className="text-sm text-gray-500">🚗 {courier.vehicleType}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={courier.isAvailable ? 'success' : 'default'}>
                      {courier.isAvailable ? 'זמין' : 'לא זמין'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => toggleCourier(courier)}>
                      {courier.isAvailable ? 'השבת' : 'הפעל'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {couriers.length === 0 && <p className="text-center text-gray-400 py-8">אין שליחים</p>}
          </div>
        </div>
      </div>

      <Modal isOpen={!!selectedDelivery} onClose={() => setSelectedDelivery(null)} title="ניהול משלוח" size="md">
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{selectedDelivery.order.customer?.name || 'לקוח'}</p>
              <p className="text-gray-600">📍 {selectedDelivery.address}</p>
              {selectedDelivery.order.customer?.phone && <p className="text-gray-600">📱 {selectedDelivery.order.customer.phone}</p>}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">הקצה שליח</p>
              <Select
                value={assignCourierId}
                onChange={e => setAssignCourierId(e.target.value)}
                options={[{ value: '', label: 'בחר שליח' }, ...courierOptions]}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">עדכון סטטוס</p>
              <div className="flex gap-2 flex-wrap">
                {['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED'].map(status => (
                  <Button key={status} size="sm" variant={selectedDelivery.status === status ? 'primary' : 'outline'}
                    onClick={() => updateDelivery(selectedDelivery.id, { status, courierId: assignCourierId || undefined })}>
                    {DELIVERY_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => { updateDelivery(selectedDelivery.id, { courierId: assignCourierId || null }); setSelectedDelivery(null) }}>
              שמור שליח
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCourierModal} onClose={() => setShowCourierModal(false)} title="הוסף שליח">
        <div className="space-y-4">
          <Input label="שם" value={courierForm.name} onChange={e => setCourierForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="טלפון" value={courierForm.phone} onChange={e => setCourierForm(f => ({ ...f, phone: e.target.value }))} required />
          <Input label="סוג רכב" value={courierForm.vehicleType} onChange={e => setCourierForm(f => ({ ...f, vehicleType: e.target.value }))} placeholder="אופנוע, רכב, אופניים..." />
          <div className="flex gap-3">
            <Button onClick={saveCourier} loading={saving} className="flex-1">הוסף</Button>
            <Button variant="outline" onClick={() => setShowCourierModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
