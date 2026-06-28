'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'לוח בקרה', icon: '📊' },
  { href: '/dashboard/orders', label: 'הזמנות', icon: '🛒' },
  { href: '/dashboard/menu', label: 'תפריט', icon: '🍽️' },
  { href: '/dashboard/employees', label: 'עובדים', icon: '👥' },
  { href: '/dashboard/deliveries', label: 'משלוחים', icon: '🚚' },
  { href: '/dashboard/tables', label: 'שולחנות', icon: '🪑' },
  { href: '/dashboard/reservations', label: 'הזמנת מקומות', icon: '📅' },
  { href: '/dashboard/inventory', label: 'מלאי', icon: '📦' },
  { href: '/dashboard/customers', label: 'לקוחות', icon: '🧑‍🤝‍🧑' },
  { href: '/dashboard/loyalty', label: 'תוכנית נאמנות', icon: '⭐' },
  { href: '/dashboard/feedback', label: 'משובים', icon: '💬' },
  { href: '/dashboard/settings', label: 'הגדרות', icon: '⚙️' },
]

export default function Sidebar({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            {restaurantName.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{restaurantName}</p>
            <p className="text-gray-400 text-xs">לוח ניהול</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>התנתק</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
