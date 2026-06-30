import { getApprovedStaffMember } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import WaiterView from './WaiterView'

export default async function WaiterPage() {
  const member = await getApprovedStaffMember()
  if (!member || member.role !== 'WAITER') redirect('/staff')
  return <WaiterView staffName={member.name} restaurantName={member.restaurantName} />
}
