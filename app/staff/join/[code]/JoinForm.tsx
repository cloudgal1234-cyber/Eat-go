'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinForm({ code, role }: { code: string; role: string }) {
  const [name, setName] = useState('')
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
      body: JSON.stringify({ code, staffName: name }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'שגיאה')
      setLoading(false)
      return
    }
    router.push('/staff')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">השם שלך</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          placeholder="ישראל ישראלי"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading || name.trim().length < 2}
        className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50 transition-opacity"
      >
        {loading ? 'מצטרף...' : 'הצטרף לצוות ←'}
      </button>
    </form>
  )
}
