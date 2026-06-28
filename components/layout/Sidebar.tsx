'use client'

import Link from 'next/link'
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
  { href: '/dashboard/staff-access', label: 'גישת צוות', icon: '🔑' },
  { href: '/dashboard/settings', label: 'הגדרות', icon: '⚙️' },
]

interface SidebarProps {
  restaurantName: string
  isOpen?: boolean
  onClose?: () => void
  currentPath: string
}

function SidebarContent({
  restaurantName,
  onClose,
  currentPath,
}: {
  restaurantName: string
  onClose?: () => void
  currentPath: string
}) {
  return (
    <>
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0">
            {restaurantName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">{restaurantName}</p>
            <p className="text-gray-400 text-xs">לוח ניהול</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.href === '/dashboard'
            ? currentPath === '/dashboard'
            : currentPath.startsWith(item.href)

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
              <span className="text-base shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
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
    </>
  )
}

export default function Sidebar({ restaurantName, isOpen, onClose, currentPath }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always in flow */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 min-h-screen shrink-0">
        <SidebarContent restaurantName={restaurantName} currentPath={currentPath} />
      </aside>

      {/* Mobile sidebar — slide-in overlay from the right (RTL) */}
      <aside
        className={cn(
          'md:hidden fixed top-0 right-0 h-full w-72 bg-gray-900 flex flex-col z-30 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <SidebarContent restaurantName={restaurantName} onClose={onClose} currentPath={currentPath} />
      </aside>
    </>
  )
}
