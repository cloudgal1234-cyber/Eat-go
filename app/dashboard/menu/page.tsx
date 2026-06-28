'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface Category { id: string; name: string; description?: string; sortOrder: number; isActive: boolean; items: MenuItem[] }
interface MenuItem { id: string; name: string; description?: string; price: number; categoryId?: string; isAvailable: boolean; allergens?: string; preparationTime?: number; category?: { name: string } }

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('items')
  const [showCatModal, setShowCatModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '', sortOrder: '0' })
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', categoryId: '', isAvailable: true, allergens: '', preparationTime: '' })

  const fetchMenu = useCallback(async () => {
    const res = await fetch('/api/menu/categories')
    if (res.ok) setCategories(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  const allItems = categories.flatMap(c => c.items.map(i => ({ ...i, category: { name: c.name } })))

  async function saveCat() {
    setSaving(true)
    const res = await fetch(editCat ? `/api/menu/categories/${editCat.id}` : '/api/menu/categories', {
      method: editCat ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...catForm, sortOrder: parseInt(catForm.sortOrder) }),
    })
    if (res.ok) { await fetchMenu(); setShowCatModal(false) }
    setSaving(false)
  }

  async function saveItem() {
    setSaving(true)
    const res = await fetch(editItem ? `/api/menu/items/${editItem.id}` : '/api/menu/items', {
      method: editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...itemForm,
        price: parseFloat(itemForm.price),
        preparationTime: itemForm.preparationTime ? parseInt(itemForm.preparationTime) : undefined,
        categoryId: itemForm.categoryId || undefined,
      }),
    })
    if (res.ok) { await fetchMenu(); setShowItemModal(false) }
    setSaving(false)
  }

  async function deleteCat(id: string) {
    if (!confirm('למחוק קטגוריה זו?')) return
    await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
    fetchMenu()
  }

  async function deleteItem(id: string) {
    if (!confirm('למחוק פריט זה?')) return
    await fetch(`/api/menu/items/${id}`, { method: 'DELETE' })
    fetchMenu()
  }

  async function toggleItemAvailability(item: MenuItem) {
    await fetch(`/api/menu/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    })
    fetchMenu()
  }

  const catOptions = [{ value: '', label: 'ללא קטגוריה' }, ...categories.map(c => ({ value: c.id, label: c.name }))]

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול תפריט</h1>
          <p className="text-gray-500 mt-1">{allItems.length} פריטים ב-{categories.length} קטגוריות</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditCat(null); setCatForm({ name: '', description: '', sortOrder: '0' }); setShowCatModal(true) }}>+ קטגוריה</Button>
          <Button onClick={() => { setEditItem(null); setItemForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true, allergens: '', preparationTime: '' }); setShowItemModal(true) }}>+ פריט</Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['items', 'categories'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'items' ? `פריטים (${allItems.length})` : `קטגוריות (${categories.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Card key={cat.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <Badge variant={cat.isActive ? 'success' : 'default'}>{cat.isActive ? 'פעיל' : 'לא פעיל'}</Badge>
              </div>
              {cat.description && <p className="text-sm text-gray-500 mb-2">{cat.description}</p>}
              <p className="text-sm text-gray-500">{cat.items.length} פריטים</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder.toString() }); setShowCatModal(true) }}>עריכה</Button>
                <Button variant="danger" size="sm" onClick={() => deleteCat(cat.id)}>מחק</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-3">
          {allItems.length === 0 && <p className="text-center text-gray-400 py-12">אין פריטים עדיין</p>}
          {categories.map(cat => cat.items.length > 0 && (
            <div key={cat.id}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>{cat.name}</span>
                <span className="text-sm font-normal text-gray-400">({cat.items.length} פריטים)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.items.map(item => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.isAvailable ? 'success' : 'warning'}>{item.isAvailable ? 'זמין' : 'לא זמין'}</Badge>
                      </div>
                    </div>
                    {item.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(item.price)}</span>
                      {item.preparationTime && <span className="text-xs text-gray-400">⏱ {item.preparationTime} דק'</span>}
                    </div>
                    {item.allergens && <p className="text-xs text-orange-600 mt-1">⚠️ {item.allergens}</p>}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => { setEditItem(item); setItemForm({ name: item.name, description: item.description || '', price: item.price.toString(), categoryId: item.categoryId || '', isAvailable: item.isAvailable, allergens: item.allergens || '', preparationTime: item.preparationTime?.toString() || '' }); setShowItemModal(true) }}>עריכה</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleItemAvailability(item)} className={item.isAvailable ? 'text-red-600' : 'text-green-600'}>{item.isAvailable ? 'הסתר' : 'הצג'}</Button>
                      <Button variant="danger" size="sm" onClick={() => deleteItem(item.id)}>מחק</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title={editCat ? 'עריכת קטגוריה' : 'הוספת קטגוריה'}>
        <div className="space-y-4">
          <Input label="שם הקטגוריה" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="תיאור" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="סדר תצוגה" type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={saveCat} loading={saving} className="flex-1">שמור</Button>
            <Button variant="outline" onClick={() => setShowCatModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={editItem ? 'עריכת פריט' : 'הוספת פריט'} size="lg">
        <div className="space-y-4">
          <Input label="שם הפריט" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="תיאור" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="מחיר (₪)" type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} required />
            <Input label="זמן הכנה (דקות)" type="number" value={itemForm.preparationTime} onChange={e => setItemForm(f => ({ ...f, preparationTime: e.target.value }))} />
          </div>
          <Select label="קטגוריה" value={itemForm.categoryId} onChange={e => setItemForm(f => ({ ...f, categoryId: e.target.value }))} options={catOptions} />
          <Input label="אלרגנים" value={itemForm.allergens} onChange={e => setItemForm(f => ({ ...f, allergens: e.target.value }))} placeholder="גלוטן, חלב, ביצים..." />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={itemForm.isAvailable} onChange={e => setItemForm(f => ({ ...f, isAvailable: e.target.checked }))} className="rounded" />
            <span className="text-sm text-gray-700">זמין להזמנה</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={saveItem} loading={saving} className="flex-1">שמור</Button>
            <Button variant="outline" onClick={() => setShowItemModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
