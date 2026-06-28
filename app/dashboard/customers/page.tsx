'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  loyaltyPoints: number
  totalSpent: number
  createdAt: string
  _count: { orders: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const fetchCustomers = useCallback(async () => {
    const res = await fetch('/api/customers')
    if (res.ok) setCustomers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'שגיאה'); setSaving(false); return }
    await fetchCustomers()
    setShowModal(false)
    setSaving(false)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3)

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-gray-500 mt-1">{customers.length} לקוחות רשומים</p>
        </div>
        <Button onClick={() => { setForm({ name: '', email: '', phone: '' }); setError(''); setShowModal(true) }}>
          + לקוח חדש
        </Button>
      </div>

      {topCustomers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {topCustomers.map((c, i) => (
            <Card key={c.id} className={i === 0 ? 'bg-yellow-50 border-yellow-300 border-2' : 'bg-gray-50'}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(c.totalSpent)} הוצאות</p>
                  <p className="text-sm text-primary-600">⭐ {c.loyaltyPoints} נקודות</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Input placeholder="חיפוש לפי שם, אימייל או טלפון..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">לקוח</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">טלפון</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הוצאות</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">נקודות</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">תאריך הצטרפות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{customer.phone || '-'}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{customer._count.orders}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(customer.totalSpent)}</td>
                <td className="py-3 px-4">
                  <span className="text-primary-600 font-medium">⭐ {customer.loyaltyPoints}</span>
                </td>
                <td className="py-3 px-4 text-gray-500">{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">אין לקוחות</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="הוספת לקוח">
        <div className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <Input label="שם" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="אימייל" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="טלפון" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">הוסף</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
