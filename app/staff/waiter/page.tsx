import { getStaffSession } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import WaiterView from './WaiterView'

export default async function WaiterPage() {
  const session = await getStaffSession()
  if (!session) redirect('/staff')
  if (session.role !== 'WAITER') redirect('/staff')
  return <WaiterView staffName={session.staffName} restaurantName={session.restaurantName} />
}
