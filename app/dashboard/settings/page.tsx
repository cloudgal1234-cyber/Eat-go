'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface RestaurantSettings {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  description?: string
  logo?: string
  createdAt: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', description: '' })

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      setSettings(data)
      setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '', description: data.description || '' })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      fetchSettings()
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות מסעדה</h1>
        <p className="text-gray-500 mt-1">עדכן את פרטי המסעדה</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים בסיסיים</h2>
        <div className="space-y-4">
          <Input
            label="שם המסעדה"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="אימייל"
            value={settings?.email || ''}
            disabled
            helperText="לא ניתן לשנות את כתובת האימייל"
          />
          <Input
            label="טלפון"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="כתובת"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">תיאור</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="תאר את המסעדה שלך..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button onClick={handleSave} loading={saving}>
            {saved ? '✓ נשמר!' : 'שמור שינויים'}
          </Button>
        </div>
      </Card>

      {settings && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע על החשבון</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">מזהה מסעדה</span>
              <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{settings.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">תאריך הרשמה</span>
              <span className="text-gray-700">{new Date(settings.createdAt).toLocaleDateString('he-IL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">קישור לדף לקוחות</span>
              <a href={`/customer/${settings.id}`} target="_blank" className="text-primary-600 hover:underline text-xs font-mono">
                /customer/{settings.id.slice(-8)}...
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
