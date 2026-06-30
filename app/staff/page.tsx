import { getStaffMember } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import StaffLogin from './StaffLogin'
import PendingView from './PendingView'

export default async function StaffPage() {
  const member = await getStaffMember()

  if (!member) return <StaffLogin />

  if (member.status === 'APPROVED') {
    if (member.role === 'CHEF') redirect('/staff/chef')
    if (member.role === 'WAITER') redirect('/staff/waiter')
    if (member.role === 'COURIER') redirect('/staff/courier')
  }

  return (
    <PendingView
      status={member.status as 'PENDING' | 'REJECTED'}
      name={member.name}
      restaurantName={member.restaurantName}
    />
  )
}
