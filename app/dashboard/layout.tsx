import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardLayoutClient restaurantName={session.name} restaurantId={session.restaurantId}>
      {children}
    </DashboardLayoutClient>
  )
}
