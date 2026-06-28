'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime, RESERVATION_STATUS_LABELS } from '@/lib/utils'

interface Reservation {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  date: string
  duration: number
  partySize: number
  status: string
  notes?: string
  table?: { number: number; capacity: number }
  customer?: { name: string }
}

interface Table { id: string; number: number; capacity: number; isAvailable: boolean }

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'default',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    date: new Date().toISOString().slice(0, 16),
    partySize: '2', tableId: '', notes: '', duration: '90',
  })

  const fetchData = useCallback(async () => {
    const params = filterDate ? `?date=${filterDate}` : ''
    const [rRes, tRes] = await Promise.all([fetch(`/api/reservations${params}`), fetch('/api/tables')])
    if (rRes.ok) setReservations(await rRes.json())
    if (tRes.ok) setTables(await tRes.json())
    setLoading(false)
  }, [filterDate])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        partySize: parseInt(form.partySize),
        duration: parseInt(form.duration),
        tableId: form.tableId || undefined,
      }),
    })
    if (res.ok) { await fetchData(); setShowModal(false) }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchData()
  }

  async function deleteReservation(id: string) {
    if (!confirm('למחוק הזמנה זו?')) return
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const tableOptions = [
    { value: '', label: 'בלי שולחן ספציפי' },
    ...tables.filter(t => t.isAvailable).map(t => ({ value: t.id, label: `שולחן ${t.number} (${t.capacity} אנשים)` }))
  ]

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הזמנת מקומות</h1>
          <p className="text-gray-500 mt-1">{reservations.length} הזמנות</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <Button onClick={() => { setForm({ customerName: '', customerEmail: '', customerPhone: '', date: new Date().toISOString().slice(0, 16), partySize: '2', tableId: '', notes: '', duration: '90' }); setShowModal(true) }}>
            + הזמנה חדשה
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {reservations.length === 0 && <p className="text-center text-gray-400 py-12">אין הזמנות לתאריך זה</p>}
        {reservations.map(res => (
          <Card key={res.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{res.customerName}</h3>
                  <Badge variant={statusVariants[res.status] || 'default'}>
                    {RESERVATION_STATUS_LABELS[res.status]}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>📅 {formatDateTime(res.date)}</p>
                  <p>👥 {res.partySize} אנשים · ⏱ {res.duration} דקות</p>
                  {res.table && <p>🪑 שולחן {res.table.number}</p>}
                  {res.customerPhone && <p>📱 {res.customerPhone}</p>}
                  {res.customerEmail && <p>📧 {res.customerEmail}</p>}
                  {res.notes && <p className="text-orange-600">📝 {res.notes}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-col items-end">
                {res.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(res.id, 'CONFIRMED')}>אשר</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(res.id, 'CANCELLED')}>בטל</Button>
                  </>
                )}
                {res.status === 'CONFIRMED' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(res.id, 'COMPLETED')}>הושלם</Button>
                )}
                <Button size="sm" variant="danger" onClick={() => deleteReservation(res.id)}>מחק</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="הזמנת מקום חדשה" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="שם לקוח" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
            <Input label="טלפון" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
          </div>
          <Input label="אימייל" type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="תאריך ושעה" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            <Input label="מספר סועדים" type="number" min="1" value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="משך (דקות)" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            <Select label="שולחן" value={form.tableId} onChange={e => setForm(f => ({ ...f, tableId: e.target.value }))} options={tableOptions} />
          </div>
          <Input label="הערות" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">שמור</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
