'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'שגיאה בהרשמה')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">הרשמת מסעדה</h1>
          <p className="text-gray-500 mt-1">צור חשבון חדש למסעדתך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="שם המסעדה"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="מסעדת הים הכחול"
            required
          />

          <Input
            label="אימייל"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="restaurant@example.com"
            required
          />

          <Input
            label="טלפון"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="052-1234567"
          />

          <Input
            label="כתובת"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="רחוב הראשי 1, תל אביב"
          />

          <Input
            label="סיסמה"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="לפחות 8 תווים"
            required
          />

          <Input
            label="אימות סיסמה"
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="חזור על הסיסמה"
            required
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            הירשם
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          יש לך חשבון?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  )
}
