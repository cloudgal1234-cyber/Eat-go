'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  unit: string
  quantity: number
  minQuantity: number
  costPerUnit?: number
  supplier?: string
  category?: string
}

const UNITS = [
  { value: 'ק"ג', label: 'ק"ג' },
  { value: 'ליטר', label: 'ליטר' },
  { value: 'יחידות', label: 'יחידות' },
  { value: 'גרם', label: 'גרם' },
  { value: 'מ"ל', label: 'מ"ל' },
  { value: 'קופסאות', label: 'קופסאות' },
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', unit: 'ק"ג', quantity: '', minQuantity: '', costPerUnit: '', supplier: '', category: '',
  })

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/inventory')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function openAdd() {
    setEditItem(null)
    setForm({ name: '', unit: 'ק"ג', quantity: '', minQuantity: '', costPerUnit: '', supplier: '', category: '' })
    setShowModal(true)
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(),
      costPerUnit: item.costPerUnit?.toString() || '',
      supplier: item.supplier || '',
      category: item.category || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      quantity: parseFloat(form.quantity),
      minQuantity: parseFloat(form.minQuantity) || 0,
      costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : undefined,
    }
    const res = await fetch(editItem ? `/api/inventory/${editItem.id}` : '/api/inventory', {
      method: editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { await fetchItems(); setShowModal(false) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק פריט זה?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  async function adjustQuantity(item: InventoryItem, delta: number) {
    const newQty = Math.max(0, item.quantity + delta)
    await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    fetchItems()
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = items.filter(i => i.quantity <= i.minQuantity && i.minQuantity > 0)

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול מלאי</h1>
          <p className="text-gray-500 mt-1">{items.length} פריטים</p>
        </div>
        <Button onClick={openAdd}>+ פריט חדש</Button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ מלאי נמוך ({lowStock.length} פריטים)</h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <Badge key={item.id} variant="danger">
                {item.name}: {item.quantity} {item.unit}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 bg-blue-50 border-blue-200 border-2">
          <p className="text-sm text-gray-600">סה"כ פריטים</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{items.length}</p>
        </Card>
        <Card className="col-span-1 bg-red-50 border-red-200 border-2">
          <p className="text-sm text-gray-600">מלאי נמוך</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{lowStock.length}</p>
        </Card>
        <Card className="col-span-1 bg-green-50 border-green-200 border-2">
          <p className="text-sm text-gray-600">שווי מלאי מוערך</p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {formatCurrency(items.reduce((sum, i) => sum + (i.costPerUnit || 0) * i.quantity, 0))}
          </p>
        </Card>
      </div>

      <Input
        placeholder="חיפוש לפי שם או קטגוריה..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">שם</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">כמות</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">יחידה</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מינימום</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">עלות ליח'</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ספק</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סטטוס</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(item => {
              const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {item.name}
                    {item.category && <span className="text-xs text-gray-400 block">{item.category}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustQuantity(item, -1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold">-</button>
                      <span className={`font-semibold min-w-8 text-center ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</span>
                      <button onClick={() => adjustQuantity(item, 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold">+</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                  <td className="py-3 px-4 text-gray-600">{item.minQuantity}</td>
                  <td className="py-3 px-4 text-gray-600">{item.costPerUnit ? formatCurrency(item.costPerUnit) : '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{item.supplier || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'מלאי נמוך' : 'תקין'}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>✏️</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-red-500">🗑️</Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">אין פריטים</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'עריכת פריט מלאי' : 'הוספת פריט מלאי'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="שם הפריט" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">יחידת מידה</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="כמות נוכחית" type="number" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            <Input label="כמות מינימום (להתראה)" type="number" step="0.01" value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="עלות ליחידה (₪)" type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} />
            <Input label="ספק" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
          </div>
          <Input label="קטגוריה" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ירקות, בשר, מוצרי חלב..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">שמור</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
