import { getStaffSession } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import CourierView from './CourierView'

export default async function CourierPage() {
  const session = await getStaffSession()
  if (!session) redirect('/staff')
  if (session.role !== 'COURIER') redirect('/staff')
  return <CourierView staffName={session.staffName} restaurantName={session.restaurantName} />
}
