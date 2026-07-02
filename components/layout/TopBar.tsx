'use client'

interface TopBarProps {
  restaurantName: string
  restaurantId: string
  onMenuToggle?: () => void
}

export default function TopBar({ restaurantName, restaurantId, onMenuToggle }: TopBarProps) {
  function openCustomerPage() {
    window.open(`/customer/${restaurantId}?t=${Date.now()}`, '_blank')
  }

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
          <button
            onClick={openCustomerPage}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>דף לקוחות</span>
          </button>
        </div>
      </div>
    </header>
  )
}
