'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLogin() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/staff/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase(), staffName: name }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'קוד לא תקין')
      setLoading(false)
      return
    }
    router.refresh()
    router.push('/staff')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-xl font-bold text-gray-900">כניסת צוות</h1>
          <p className="text-gray-500 text-sm mt-1">הכנס קוד הצטרפות שקיבלת מהמנהל</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              placeholder="ישראל ישראלי"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קוד הצטרפות</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              required
              minLength={6}
              maxLength={6}
              placeholder="XXXXXX"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-mono tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || name.trim().length < 2 || code.length < 6}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50 transition-opacity"
          >
            {loading ? 'נכנס...' : 'כניסה ←'}
          </button>
        </form>
      </div>
    </div>
  )
}
