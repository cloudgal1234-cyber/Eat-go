import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EatGo - פלטפורמת ניהול מסעדות',
  description: 'מערכת ניהול מסעדות מקצועית',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
