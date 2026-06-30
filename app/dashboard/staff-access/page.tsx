'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface InviteCode {
  id: string
  code: string
  role: string
  label?: string | null
  createdAt: string
}

interface StaffMember {
  id: string
  name: string
  phone: string | null
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  approvedAt: string | null
}

const roleLabels: Record<string, { label: string; icon: string; color: string }> = {
  WAITER: { label: 'מלצר/ית', icon: '🧑‍🍽️', color: 'bg-blue-100 text-blue-700' },
  CHEF: { label: 'טבח/ית', icon: '👨‍🍳', color: 'bg-orange-100 text-orange-700' },
  COURIER: { label: 'שליח/ה', icon: '🚚', color: 'bg-green-100 text-green-700' },
}

export default function StaffAccessPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [members, setMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newRole, setNewRole] = useState('WAITER')
  const [newLabel, setNewLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<InviteCode | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function fetchCodes() {
    const res = await fetch('/api/staff/invite-codes')
    if (!res.ok) return
    const data = await res.json()
    setCodes(data.codes ?? [])
  }

  async function fetchMembers() {
    const res = await fetch('/api/staff/members')
    if (!res.ok) return
    const data = await res.json()
    setMembers(data.members ?? [])
  }

  async function fetchAll() {
    await Promise.all([fetchCodes(), fetchMembers()])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchMembers, 8000)
    return () => clearInterval(interval)
  }, [])

  async function createCode() {
    setCreating(true)
    const res = await fetch('/api/staff/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, label: newLabel || undefined }),
    })
    if (res.ok) {
      setNewLabel('')
      await fetchCodes()
    }
    setCreating(false)
  }

  async function deleteCode(id: string) {
    const res = await fetch(`/api/staff/invite-codes?id=${id}`, { method: 'DELETE' })
    if (res.ok) setCodes(prev => prev.filter(c => c.id !== id))
  }

  function copyLink(code: string, id: string) {
    const url = `${window.location.origin}/staff/join/${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function shareLink(code: InviteCode) {
    const roleInfo = roleLabels[code.role]
    const url = `${window.location.origin}/staff/join/${code.code}`
    const text = `הצטרף לצוות כ${roleInfo?.label ?? code.role}${code.label ? ` (${code.label})` : ''}:\n${url}`
    if (navigator.share) {
      navigator.share({ title: 'הצטרפות לצוות', text, url })
    } else {
      copyLink(code.code, code.id)
    }
  }

  async function setMemberStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setBusyId(id)
    const res = await fetch(`/api/staff/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) await fetchMembers()
    setBusyId(null)
  }

  async function removeMember(id: string) {
    setBusyId(id)
    const res = await fetch(`/api/staff/members/${id}`, { method: 'DELETE' })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id))
    setBusyId(null)
  }

  const pendingMembers = members.filter(m => m.status === 'PENDING')
  const activeMembers = members.filter(m => m.status === 'APPROVED')

  return (
    <div className="max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">גישת צוות</h1>
        <p className="text-gray-500 mt-1 text-sm">צור קישורי הצטרפות לעובדים לפי תפקיד, ואשר בקשות הצטרפות</p>
      </div>

      {pendingMembers.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="font-semibold text-gray-900">בקשות הצטרפות ממתינות ({pendingMembers.length})</h2>
          {pendingMembers.map(m => {
            const role = roleLabels[m.role]
            return (
              <div key={m.id} className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{role?.icon ?? '👤'}</span>
                    <div>
                      <p className="font-bold text-gray-900">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role?.color}`}>
                          {role?.label ?? m.role}
                        </span>
                        {m.phone && <span className="text-gray-400 text-xs">{m.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setMemberStatus(m.id, 'APPROVED')}
                      disabled={busyId === m.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      ✓ אשר
                    </button>
                    <button
                      onClick={() => setMemberStatus(m.id, 'REJECTED')}
                      disabled={busyId === m.id}
                      className="border border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      ✕ דחה
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <h2 className="font-semibold text-gray-900">צוות פעיל ({activeMembers.length})</h2>
        {activeMembers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">אין עדיין עובדים מאושרים</p>
          </div>
        ) : (
          activeMembers.map(m => {
            const role = roleLabels[m.role]
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{role?.icon ?? '👤'}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role?.color}`}>
                        {role?.label ?? m.role}
                      </span>
                      {m.phone && <span className="text-gray-400 text-xs">{m.phone}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeMember(m.id)}
                  disabled={busyId === m.id}
                  className="text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  🗑️ הסר
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">יצירת קוד הצטרפות חדש</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <div className="flex gap-2">
              {Object.entries(roleLabels).map(([role, info]) => (
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    newRole === role ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{info.icon}</span>
                  <span className="text-xs">{info.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תווית (אופציונלי)</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="לדוגמה: משמרת בוקר"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={createCode}
            disabled={creating}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {creating ? 'יוצר...' : '+ צור קוד הצטרפות'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">קודות פעילים</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">טוען...</p>
        ) : codes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-4xl mb-2">🔑</p>
            <p className="text-gray-500 text-sm">אין קודות פעילים. צור קוד כדי להזמין עובדים.</p>
          </div>
        ) : (
          codes.map(code => {
            const role = roleLabels[code.role]
            return (
              <div key={code.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{role?.icon ?? '👤'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role?.color}`}>
                          {role?.label ?? code.role}
                        </span>
                        {code.label && <span className="text-gray-400 text-xs">{code.label}</span>}
                      </div>
                      <p className="font-mono text-xl font-black text-gray-900 tracking-widest mt-1">{code.code}</p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]">/staff/join/{code.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setQrCode(code)}
                      className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      📱 ברקוד
                    </button>
                    <button
                      onClick={() => shareLink(code)}
                      className="flex items-center gap-1.5 bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      {copiedId === code.id ? '✓ הועתק' : '📤 שתף'}
                    </button>
                    <button
                      onClick={() => copyLink(code.code, code.id)}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      🔗 העתק
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors"
                    >
                      🗑️ מחק
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-200">
        <p className="font-semibold mb-1">איך זה עובד?</p>
        <ol className="space-y-1 text-blue-600 list-decimal list-inside text-xs">
          <li>צור קוד הצטרפות לפי תפקיד</li>
          <li>שתף את הברקוד או הקישור עם העובד (WhatsApp, הדפסה וכו׳)</li>
          <li>העובד סורק את הברקוד וממלא את הפרטים שלו</li>
          <li>הבקשה מופיעה כאן וממתינה לאישורך</li>
          <li>לאחר אישור, העובד מקבל ממשק מותאם לתפקידו ומתחיל לקבל הזמנות</li>
        </ol>
      </div>

      {qrCode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setQrCode(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-900 mb-1">
              {roleLabels[qrCode.role]?.icon} {roleLabels[qrCode.role]?.label ?? qrCode.role}
            </p>
            {qrCode.label && <p className="text-gray-400 text-xs mb-3">{qrCode.label}</p>}
            <div className="flex justify-center bg-white p-4 rounded-xl border border-gray-200 my-3">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/staff/join/${qrCode.code}` : ''}
                size={200}
              />
            </div>
            <p className="font-mono text-lg font-black text-gray-900 tracking-widest">{qrCode.code}</p>
            <button
              onClick={() => setQrCode(null)}
              className="mt-4 w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
