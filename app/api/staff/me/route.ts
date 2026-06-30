import { NextResponse } from 'next/server'
import { getStaffMember } from '@/lib/staff-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const member = await getStaffMember()
  if (!member) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  return NextResponse.json({
    name: member.name,
    role: member.role,
    status: member.status,
    restaurantName: member.restaurantName,
  })
}
