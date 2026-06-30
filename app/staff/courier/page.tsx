import { getApprovedStaffMember } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import CourierView from './CourierView'

export default async function CourierPage() {
  const member = await getApprovedStaffMember()
  if (!member || member.role !== 'COURIER') redirect('/staff')
  return <CourierView staffName={member.name} restaurantName={member.restaurantName} />
}
