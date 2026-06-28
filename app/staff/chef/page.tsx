import { getStaffSession } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import ChefView from './ChefView'

export default async function ChefPage() {
  const session = await getStaffSession()
  if (!session) redirect('/staff')
  if (session.role !== 'CHEF') redirect('/staff')
  return <ChefView staffName={session.staffName} restaurantName={session.restaurantName} />
}
