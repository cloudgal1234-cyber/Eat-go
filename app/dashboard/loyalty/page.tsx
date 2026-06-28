'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface LoyaltyProgram {
  id: string
  pointsPerAmount: number
  rewardThreshold: number
  rewardValue: number
  rewardType: string
  isActive: boolean
}

interface Customer {
  id: string
  name: string
  email: string
  loyaltyPoints: number
  totalSpent: number
}

const rewardTypeOptions = [
  { value: 'DISCOUNT', label: 'הנחה בשקלים' },
  { value: 'PERCENT', label: 'הנחה באחוזים' },
  { value: 'FREE_ITEM', label: 'פריט חינם' },
]

export default function LoyaltyPage() {
  const [loyalty, setLoyalty] = useState<LoyaltyProgram | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchData = useCallback(async () => {
    const [lRes, cRes] = await Promise.all([fetch('/api/loyalty'), fetch('/api/customers')])
    if (lRes.ok) setLoyalty(await lRes.json())
    if (cRes.ok) setCustomers(await cRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    if (!loyalty) return
    setSaving(true)
    const res = await fetch('/api/loyalty', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loyalty),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const topLoyalty = [...customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints).slice(0, 10)
  const eligibleForReward = loyalty ? customers.filter(c => c.loyaltyPoints >= loyalty.rewardThreshold).length : 0

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">תוכנית נאמנות</h1>
        <p className="text-gray-500 mt-1">הגדר ונהל את מועדון הלקוחות</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary-50 border-primary-200 border-2">
          <p className="text-sm text-gray-600">חברי מועדון</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
        </Card>
        <Card className="bg-green-50 border-green-200 border-2">
          <p className="text-sm text-gray-600">זכאים לפרס</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{eligibleForReward}</p>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200 border-2">
          <p className="text-sm text-gray-600">סה"כ נקודות</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">{customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString()}</p>
        </Card>
      </div>

      {loyalty && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הגדרות תוכנית</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={loyalty.isActive} onChange={e => setLoyalty(l => l ? { ...l, isActive: e.target.checked } : l)} className="rounded" />
                <span className="text-sm font-medium text-gray-700">תוכנית פעילה</span>
              </label>
              <div className="space-y-3">
                <Input
                  label="נקודות לכל ₪ שהוצא"
                  type="number"
                  step="0.1"
                  value={loyalty.pointsPerAmount}
                  onChange={e => setLoyalty(l => l ? { ...l, pointsPerAmount: parseFloat(e.target.value) } : l)}
                />
                <Input
                  label="נקודות לפרס"
                  type="number"
                  value={loyalty.rewardThreshold}
                  onChange={e => setLoyalty(l => l ? { ...l, rewardThreshold: parseInt(e.target.value) } : l)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Select
                label="סוג פרס"
                value={loyalty.rewardType}
                onChange={e => setLoyalty(l => l ? { ...l, rewardType: e.target.value } : l)}
                options={rewardTypeOptions}
              />
              <Input
                label={loyalty.rewardType === 'PERCENT' ? 'אחוז הנחה' : 'שווי פרס (₪)'}
                type="number"
                step="0.1"
                value={loyalty.rewardValue}
                onChange={e => setLoyalty(l => l ? { ...l, rewardValue: parseFloat(e.target.value) } : l)}
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mt-4 text-sm text-blue-700">
            <p className="font-medium mb-1">📢 תקציר התוכנית:</p>
            <p>לקוח מקבל <strong>{loyalty.pointsPerAmount}</strong> נקודות לכל ₪ שמוצא.</p>
            <p>כאשר צובר <strong>{loyalty.rewardThreshold}</strong> נקודות, מקבל {loyalty.rewardType === 'PERCENT' ? `הנחה של ${loyalty.rewardValue}%` : `₪${loyalty.rewardValue} הנחה`}.</p>
          </div>

          <Button onClick={handleSave} loading={saving} className="mt-4">
            {saved ? '✓ נשמר!' : 'שמור הגדרות'}
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוחות מובילים</h2>
        <div className="space-y-3">
          {topLoyalty.map((customer, i) => (
            <div key={customer.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary-600">⭐ {customer.loyaltyPoints} נקודות</p>
                {loyalty && customer.loyaltyPoints >= loyalty.rewardThreshold && (
                  <p className="text-xs text-green-600 font-medium">✓ זכאי לפרס</p>
                )}
              </div>
            </div>
          ))}
          {customers.length === 0 && <p className="text-center text-gray-400 py-4">אין לקוחות עדיין</p>}
        </div>
      </Card>
    </div>
  )
}
