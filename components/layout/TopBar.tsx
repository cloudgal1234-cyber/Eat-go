'use client'

import Link from 'next/link'

interface TopBarProps {
  restaurantName: string
  restaurantId: string
  onMenuToggle?: () => void
}

export default function TopBar({ restaurantName, restaurantId, onMenuToggle }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="פתח תפריט"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-gray-900 font-semibold text-base flex-1 truncate hidden md:block">
          ברוך הבא, {restaurantName}
        </h1>

        <div className="mr-auto md:mr-0">
          <Link
            href={`/customer/${restaurantId}`}
            target="_blank"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors whitespace-nowrap"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">דף לקוחות</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
