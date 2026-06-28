'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  allergens?: string | null
  preparationTime?: number | null
}

interface Restaurant {
  id: string
  name: string
  description?: string | null
  address?: string | null
  phone?: string | null
}

interface CartItem { menuItem: MenuItem; quantity: number; notes: string }

type ActiveView = 'menu' | 'cart' | 'reservation' | 'feedback' | 'success'

const typeOptions = [
  { value: 'DINE_IN', label: 'אכילה במקום' },
  { value: 'TAKEAWAY', label: 'טייק אווי' },
  { value: 'DELIVERY', label: 'משלוח לבית' },
]

const paymentOptions = [
  { value: 'CASH', label: 'מזומן' },
  { value: 'CARD', label: 'כרטיס אשראי' },
  { value: 'ONLINE', label: 'תשלום אונליין' },
]

interface Props {
  restaurant: Restaurant
  categories: MenuCategory[]
  restaurantId: string
}

export default function CustomerView({ restaurant, categories, restaurantId }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeView, setActiveView] = useState<ActiveView>('menu')
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? '')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [itemNotes, setItemNotes] = useState('')

  const [orderForm, setOrderForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    type: 'DINE_IN', deliveryAddress: '', paymentMethod: 'CASH', notes: '',
  })

  const [reservationForm, setReservationForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    date: '', partySize: '2', notes: '',
  })

  const [feedbackForm, setFeedbackForm] = useState({
    customerName: '', customerEmail: '', rating: 5, comment: '', category: 'FOOD',
  })

  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function addToCart(item: MenuItem, notes: string) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItem: item, quantity: 1, notes }]
    })
    setSelectedItem(null)
    setItemNotes('')
  }

  function removeFromCart(id: string) { setCart(prev => prev.filter(c => c.menuItem.id !== id)) }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, quantity: qty } : c))
  }

  const total = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)

  async function submitOrder() {
    setSubmitting(true)
    const res = await fetch(`/api/customer/${restaurantId}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderForm,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, notes: c.notes })),
      }),
    })
    if (res.ok) {
      setCart([])
      setSuccessMessage('ההזמנה נקלטה בהצלחה! אנחנו מכינים את האוכל שלך.')
      setActiveView('success')
    }
    setSubmitting(false)
  }

  async function submitReservation() {
    setSubmitting(true)
    const res = await fetch(`/api/customer/${restaurantId}/reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reservationForm, partySize: parseInt(reservationForm.partySize) }),
    })
    if (res.ok) {
      setSuccessMessage('הזמנת המקום נקלטה! נאשר אותה בהקדם.')
      setActiveView('success')
    }
    setSubmitting(false)
  }

  async function submitFeedback() {
    setSubmitting(true)
    const res = await fetch(`/api/customer/${restaurantId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackForm),
    })
    if (res.ok) {
      setSuccessMessage('תודה על המשוב! אנחנו מעריכים את חוות דעתך.')
      setActiveView('success')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.address && <p className="text-xs text-gray-500">{restaurant.address}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveView('menu')} className={`text-2xl p-1 ${activeView === 'menu' ? 'opacity-100' : 'opacity-40'}`}>🍽️</button>
              <button onClick={() => setActiveView('reservation')} className={`text-2xl p-1 ${activeView === 'reservation' ? 'opacity-100' : 'opacity-40'}`}>📅</button>
              <button onClick={() => setActiveView('feedback')} className={`text-2xl p-1 ${activeView === 'feedback' ? 'opacity-100' : 'opacity-40'}`}>⭐</button>
              <button onClick={() => setActiveView('cart')} className="relative text-2xl p-1">
                🛒
                {cart.length > 0 && (
                  <span className="absolute -top-1 -left-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {activeView === 'success' && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">הצלחה!</h2>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <Button onClick={() => setActiveView('menu')}>חזור לתפריט</Button>
          </div>
        )}

        {activeView === 'menu' && (
          <div>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">התפריט יעלה בקרוב</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {categories.filter(c => c.id === activeCategory || !activeCategory).map(cat => (
                  <div key={cat.id} className="mb-8">
                    <div className="space-y-3">
                      {cat.items.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{item.name}</h3>
                              {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                              {item.allergens && <p className="text-xs text-orange-600 mt-1">⚠️ {item.allergens}</p>}
                              {item.preparationTime && <p className="text-xs text-gray-400 mt-1">⏱ {item.preparationTime} דקות</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-lg font-bold text-primary-600">{formatCurrency(item.price)}</span>
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                הוסף
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {cart.length > 0 && (
                  <div className="fixed bottom-4 right-4 left-4 max-w-2xl mx-auto">
                    <button
                      onClick={() => setActiveView('cart')}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg flex items-center justify-between"
                    >
                      <span>🛒 {cart.reduce((s, c) => s + c.quantity, 0)} פריטים</span>
                      <span>להזמנה ← {formatCurrency(total)}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeView === 'cart' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">הסל שלי</h2>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-gray-400">הסל ריק</p>
                <Button onClick={() => setActiveView('menu')} className="mt-4">עבור לתפריט</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                        {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                        <p className="text-sm text-primary-600 font-medium">{formatCurrency(item.menuItem.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.menuItem.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">-</button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.menuItem.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between font-bold text-lg">
                    <span>סה"כ</span>
                    <span className="text-primary-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">פרטים אישיים</h3>
                  <Input label="שם" value={orderForm.customerName} onChange={e => setOrderForm(f => ({ ...f, customerName: e.target.value }))} required />
                  <Input label="אימייל" type="email" value={orderForm.customerEmail} onChange={e => setOrderForm(f => ({ ...f, customerEmail: e.target.value }))} helperText="להיסטוריית הזמנות ונקודות נאמנות" />
                  <Input label="טלפון" value={orderForm.customerPhone} onChange={e => setOrderForm(f => ({ ...f, customerPhone: e.target.value }))} />
                  <Select label="סוג הזמנה" value={orderForm.type} onChange={e => setOrderForm(f => ({ ...f, type: e.target.value }))} options={typeOptions} />
                  {orderForm.type === 'DELIVERY' && (
                    <Input label="כתובת למשלוח" value={orderForm.deliveryAddress} onChange={e => setOrderForm(f => ({ ...f, deliveryAddress: e.target.value }))} required />
                  )}
                  <Select label="אמצעי תשלום" value={orderForm.paymentMethod} onChange={e => setOrderForm(f => ({ ...f, paymentMethod: e.target.value }))} options={paymentOptions} />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">הערות להזמנה</label>
                    <textarea value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} placeholder="אלרגיות, העדפות..." className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} />
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={submitOrder} loading={submitting}
                  disabled={!orderForm.customerName || (orderForm.type === 'DELIVERY' && !orderForm.deliveryAddress)}>
                  שלח הזמנה · {formatCurrency(total)}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeView === 'reservation' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">הזמנת מקום</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <Input label="שם" value={reservationForm.customerName} onChange={e => setReservationForm(f => ({ ...f, customerName: e.target.value }))} required />
              <Input label="אימייל" type="email" value={reservationForm.customerEmail} onChange={e => setReservationForm(f => ({ ...f, customerEmail: e.target.value }))} />
              <Input label="טלפון" value={reservationForm.customerPhone} onChange={e => setReservationForm(f => ({ ...f, customerPhone: e.target.value }))} />
              <Input label="תאריך ושעה" type="datetime-local" value={reservationForm.date} onChange={e => setReservationForm(f => ({ ...f, date: e.target.value }))} required />
              <Input label="מספר סועדים" type="number" min="1" max="20" value={reservationForm.partySize} onChange={e => setReservationForm(f => ({ ...f, partySize: e.target.value }))} required />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">הערות מיוחדות</label>
                <textarea value={reservationForm.notes} onChange={e => setReservationForm(f => ({ ...f, notes: e.target.value }))} placeholder="בקשות מיוחדות..." className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} />
              </div>
              <Button className="w-full" size="lg" onClick={submitReservation} loading={submitting}
                disabled={!reservationForm.customerName || !reservationForm.date}>
                שלח בקשת הזמנה
              </Button>
            </div>
          </div>
        )}

        {activeView === 'feedback' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">שתף חוות דעת</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <Input label="שם" value={feedbackForm.customerName} onChange={e => setFeedbackForm(f => ({ ...f, customerName: e.target.value }))} required />
              <Input label="אימייל" type="email" value={feedbackForm.customerEmail} onChange={e => setFeedbackForm(f => ({ ...f, customerEmail: e.target.value }))} />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">דירוג</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => setFeedbackForm(f => ({ ...f, rating: r }))}
                      className={`text-3xl transition-transform hover:scale-110 ${r <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">קטגוריה</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries({ FOOD: '🍽️ אוכל', SERVICE: '👤 שירות', AMBIANCE: '🌿 אווירה', DELIVERY: '🚚 משלוח', PRICE: '💰 מחיר' }).map(([key, label]) => (
                    <button key={key} onClick={() => setFeedbackForm(f => ({ ...f, category: key }))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${feedbackForm.category === key ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">תגובה</label>
                <textarea value={feedbackForm.comment} onChange={e => setFeedbackForm(f => ({ ...f, comment: e.target.value }))} placeholder="שתף אותנו בחוויה שלך..." className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} />
              </div>
              <Button className="w-full" size="lg" onClick={submitFeedback} loading={submitting} disabled={!feedbackForm.customerName}>
                שלח משוב
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => { setSelectedItem(null); setItemNotes('') }} title={selectedItem?.name || ''}>
        {selectedItem && (
          <div className="space-y-4">
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(selectedItem.price)}</p>
            {selectedItem.description && <p className="text-gray-600 text-sm">{selectedItem.description}</p>}
            {selectedItem.allergens && <p className="text-sm text-orange-600">⚠️ אלרגנים: {selectedItem.allergens}</p>}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">הערות מיוחדות</label>
              <textarea value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="ללא חסה, בצל בצד..." className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} />
            </div>
            <Button className="w-full" onClick={() => addToCart(selectedItem, itemNotes)}>הוסף לסל</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
