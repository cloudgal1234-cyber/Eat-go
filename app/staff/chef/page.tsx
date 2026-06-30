import { getApprovedStaffMember } from '@/lib/staff-auth'
import { redirect } from 'next/navigation'
import ChefView from './ChefView'

export default async function ChefPage() {
  const member = await getApprovedStaffMember()
  if (!member || member.role !== 'CHEF') redirect('/staff')
  return <ChefView staffName={member.name} restaurantName={member.restaurantName} />
}
