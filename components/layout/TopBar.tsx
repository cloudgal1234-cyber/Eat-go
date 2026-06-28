'use client'

import Link from 'next/link'

interface TopBarProps {
  restaurantName: string
  restaurantId: string
}

export default function TopBar({ restaurantName, restaurantId }: TopBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900 font-semibold text-lg hidden md:block">
          ברוך הבא, {restaurantName}
        </h1>
        <div className="flex items-center gap-3 mr-auto">
          <Link
            href={`/customer/${restaurantId}`}
            target="_blank"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors"
          >
            <span>🔗</span>
            <span>דף לקוחות</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
