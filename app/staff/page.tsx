import { getStaffSession } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import StaffLogin from './StaffLogin'

export default async function StaffPage() {
  const session = await getStaffSession()

  if (session) {
    if (session.role === 'CHEF') redirect('/staff/chef')
    if (session.role === 'WAITER') redirect('/staff/waiter')
    if (session.role === 'COURIER') redirect('/staff/courier')
  }

  return <StaffLogin />
}
