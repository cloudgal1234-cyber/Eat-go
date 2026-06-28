'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Table { id: string; number: number; capacity: number; isAvailable: boolean; location?: string }

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTable, setEditTable] = useState<Table | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ number: '', capacity: '', location: '' })

  const fetchTables = useCallback(async () => {
    const res = await fetch('/api/tables')
    if (res.ok) setTables(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  function openAdd() {
    setEditTable(null)
    setForm({ number: '', capacity: '', location: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(t: Table) {
    setEditTable(t)
    setForm({ number: t.number.toString(), capacity: t.capacity.toString(), location: t.location || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const payload = { number: parseInt(form.number), capacity: parseInt(form.capacity), location: form.location || undefined }
    const res = await fetch(editTable ? `/api/tables/${editTable.id}` : '/api/tables', {
      method: editTable ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'שגיאה'); setSaving(false); return }
    await fetchTables()
    setShowModal(false)
    setSaving(false)
  }

  async function toggleAvailable(t: Table) {
    await fetch(`/api/tables/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !t.isAvailable }),
    })
    fetchTables()
  }

  async function deleteTable(id: string) {
    if (!confirm('למחוק שולחן זה?')) return
    await fetch(`/api/tables/${id}`, { method: 'DELETE' })
    fetchTables()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  const available = tables.filter(t => t.isAvailable).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול שולחנות</h1>
          <p className="text-gray-500 mt-1">{available} פנויים מתוך {tables.length} שולחנות</p>
        </div>
        <Button onClick={openAdd}>+ הוסף שולחן</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <div key={table.id} className={cn(
            'rounded-xl border-2 p-4 text-center transition-all cursor-pointer',
            table.isAvailable
              ? 'bg-green-50 border-green-300 hover:border-green-400'
              : 'bg-red-50 border-red-300 hover:border-red-400'
          )}>
            <div className={cn('text-3xl font-bold mb-1', table.isAvailable ? 'text-green-700' : 'text-red-700')}>
              {table.number}
            </div>
            <p className="text-xs text-gray-500 mb-1">👥 {table.capacity} מקומות</p>
            {table.location && <p className="text-xs text-gray-400 mb-2">{table.location}</p>}
            <Badge variant={table.isAvailable ? 'success' : 'danger'} className="mb-3">
              {table.isAvailable ? 'פנוי' : 'תפוס'}
            </Badge>
            <div className="flex gap-1 justify-center">
              <Button size="sm" variant="ghost" onClick={() => openEdit(table)} className="text-xs px-2">✏️</Button>
              <Button size="sm" variant="ghost" onClick={() => toggleAvailable(table)} className="text-xs px-2">
                {table.isAvailable ? '🔒' : '🔓'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteTable(table.id)} className="text-xs px-2 text-red-500">🗑️</Button>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-6 text-center py-12">
            <p className="text-gray-400 text-lg">אין שולחנות עדיין</p>
            <Button onClick={openAdd} className="mt-4">הוסף שולחן ראשון</Button>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTable ? 'עריכת שולחן' : 'הוספת שולחן'}>
        <div className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <Input label="מספר שולחן" type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} required />
          <Input label="כושר קיבול (אנשים)" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
          <Input label="מיקום" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="חדר פנימי, גינה, מרפסת..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">שמור</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
