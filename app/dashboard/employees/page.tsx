'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EMPLOYEE_ROLES, formatCurrency, formatDate } from '@/lib/utils'

interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  salary?: number
  hireDate: string
  isActive: boolean
}

const roleOptions = Object.entries(EMPLOYEE_ROLES).map(([value, label]) => ({ value, label }))

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'WAITER', salary: '', isActive: true,
  })

  const fetchEmployees = useCallback(async () => {
    const res = await fetch('/api/employees')
    if (res.ok) {
      const data = await res.json()
      setEmployees(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  function openAdd() {
    setEditEmployee(null)
    setForm({ name: '', email: '', phone: '', role: 'WAITER', salary: '', isActive: true })
    setError('')
    setShowModal(true)
  }

  function openEdit(emp: Employee) {
    setEditEmployee(emp)
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      role: emp.role,
      salary: emp.salary?.toString() || '',
      isActive: emp.isActive,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      salary: form.salary ? parseFloat(form.salary) : undefined,
    }

    const res = await fetch(editEmployee ? `/api/employees/${editEmployee.id}` : '/api/employees', {
      method: editEmployee ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'שגיאה')
      setSaving(false)
      return
    }

    await fetchEmployees()
    setShowModal(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('האם למחוק עובד זה?')) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    fetchEmployees()
  }

  async function toggleActive(emp: Employee) {
    await fetch(`/api/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !emp.isActive }),
    })
    fetchEmployees()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">טוען...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול עובדים</h1>
          <p className="text-gray-500 mt-1">{employees.length} עובדים סה"כ</p>
        </div>
        <Button onClick={openAdd}>+ הוסף עובד</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <Card key={emp.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-500">{EMPLOYEE_ROLES[emp.role] || emp.role}</p>
                </div>
              </div>
              <Badge variant={emp.isActive ? 'success' : 'default'}>
                {emp.isActive ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>📧 {emp.email}</p>
              {emp.phone && <p>📱 {emp.phone}</p>}
              {emp.salary && <p>💰 {formatCurrency(emp.salary)} / חודש</p>}
              <p>📅 הצטרף: {formatDate(emp.hireDate)}</p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>עריכה</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(emp)}
                className={emp.isActive ? 'text-red-600' : 'text-green-600'}
              >
                {emp.isActive ? 'השבת' : 'הפעל'}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(emp.id)}>מחק</Button>
            </div>
          </Card>
        ))}

        {employees.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-400 text-lg">אין עובדים עדיין</p>
            <Button onClick={openAdd} className="mt-4">הוסף עובד ראשון</Button>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editEmployee ? 'עריכת עובד' : 'הוספת עובד'} size="md">
        <div className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <Input label="שם מלא" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="אימייל" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="טלפון" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Select label="תפקיד" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} options={roleOptions} />
          <Input label="משכורת (₪/חודש)" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">{editEmployee ? 'שמור' : 'הוסף'}</Button>
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
