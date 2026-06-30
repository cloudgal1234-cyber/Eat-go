'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PendingView({
  status,
  name,
  restaurantName,
}: {
  status: 'PENDING' | 'REJECTED'
  name: string
  restaurantName: string
}) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const router = useRouter()

  useEffect(() => {
    if (currentStatus !== 'PENDING') return
    const interval = setInterval(async () => {
      const res = await fetch('/api/staff/me')
      if (!res.ok) return
      const data = await res.json()
      if (data.status && data.status !== currentStatus) {
        setCurrentStatus(data.status)
        if (data.status === 'APPROVED') {
          router.refresh()
        }
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [currentStatus, router])

  async function logout() {
    await fetch('/api/auth/staff-logout', { method: 'POST' })
    router.push('/staff')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
        {currentStatus === 'PENDING' ? (
          <>
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <h1 className="text-xl font-bold text-gray-900">ממתין לאישור</h1>
            <p className="text-gray-500 text-sm mt-2">
              שלום {name}, הבקשה שלך להצטרף ל{restaurantName} נשלחה למנהל.
            </p>
            <p className="text-gray-400 text-xs mt-1">ברגע שהמנהל יאשר אותך, תועבר אוטומטית לממשק שלך.</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">🚫</div>
            <h1 className="text-xl font-bold text-gray-900">הבקשה נדחתה</h1>
            <p className="text-gray-500 text-sm mt-2">
              הבקשה שלך להצטרף ל{restaurantName} נדחתה על ידי המנהל.
            </p>
          </>
        )}
        <button
          onClick={logout}
          className="mt-6 w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          התנתק
        </button>
      </div>
    </div>
  )
}
