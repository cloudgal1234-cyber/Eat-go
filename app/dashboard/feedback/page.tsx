'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Feedback {
  id: string
  customerName: string
  rating: number
  comment?: string
  category?: string
  response?: string
  isPublic: boolean
  createdAt: string
  customer?: { name: string; email: string }
}

const CATEGORIES: Record<string, string> = {
  FOOD: '🍽️ אוכל',
  SERVICE: '👤 שירות',
  AMBIANCE: '🌿 אווירה',
  DELIVERY: '🚚 משלוח',
  PRICE: '💰 מחיר',
  OTHER: '💬 אחר',
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterRating, setFilterRating] = useState(0)

  const fetchFeedback = useCallback(async () => {
    const res = await fetch('/api/feedback')
    if (res.ok) setFeedback(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  async function handleResponse(id: string) {
    setSaving(true)
    const res = await fetch('/api/feedback', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, response: responseText }),
    })
    if (res.ok) {
      await fetchFeedback()
      setRespondingId(null)
      setResponseText('')
    }
    setSaving(false)
  }

  const filtered = filterRating > 0 ? feedback.filter(f => f.rating === filterRating) : feedback
  const avgRating = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: feedback.filter(f => f.rating === r).length }))

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול משובים</h1>
        <p className="text-gray-500 mt-1">{feedback.length} משובים סה"כ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">סיכום דירוגים</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
            <div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-2xl ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              <p className="text-sm text-gray-500">{feedback.length} משובים</p>
            </div>
          </div>
          <div className="space-y-2">
            {ratingCounts.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm w-8 text-gray-600">{rating}★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: feedback.length ? `${(count / feedback.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-6">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">לפי קטגוריה</h2>
          <div className="space-y-2">
            {Object.entries(CATEGORIES).map(([key, label]) => {
              const count = feedback.filter(f => f.category === key).length
              const avg = feedback.filter(f => f.category === key).reduce((s, f) => s + f.rating, 0) / (count || 1)
              if (count === 0) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-600">{avg.toFixed(1)}★</span>
                    <Badge variant="default">{count} משובים</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilterRating(0)} className={`px-3 py-1.5 rounded-lg text-sm ${filterRating === 0 ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>הכל</button>
        {[5, 4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setFilterRating(r)} className={`px-3 py-1.5 rounded-lg text-sm ${filterRating === r ? 'bg-yellow-100 text-yellow-800 font-medium' : 'bg-gray-100 text-gray-600'}`}>
            {r}★
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">אין משובים</p>}
        {filtered.map(fb => (
          <Card key={fb.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                  {fb.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{fb.customerName}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < fb.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    {fb.category && <Badge variant="info">{CATEGORIES[fb.category] || fb.category}</Badge>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">{formatDate(fb.createdAt)}</p>
            </div>

            {fb.comment && (
              <p className="text-gray-700 text-sm mb-3">{fb.comment}</p>
            )}

            {fb.response && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-600 font-medium mb-1">תגובת המסעדה:</p>
                <p className="text-sm text-blue-800">{fb.response}</p>
              </div>
            )}

            {respondingId === fb.id ? (
              <div className="space-y-2">
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="כתוב תגובה ללקוח..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResponse(fb.id)} loading={saving}>שלח תגובה</Button>
                  <Button size="sm" variant="outline" onClick={() => { setRespondingId(null); setResponseText('') }}>ביטול</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { setRespondingId(fb.id); setResponseText(fb.response || '') }}>
                {fb.response ? 'ערוך תגובה' : 'הגב'}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
