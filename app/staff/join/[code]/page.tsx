import { db } from '@/lib/db'
import { staffInviteCodes, restaurants } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import JoinForm from './JoinForm'

const roleLabels: Record<string, { label: string; icon: string }> = {
  WAITER: { label: 'מלצר/ית', icon: '🧑‍🍽️' },
  CHEF: { label: 'טבח/ית', icon: '👨‍🍳' },
  COURIER: { label: 'שליח/ה', icon: '🚚' },
}

export default async function JoinPage({ params }: { params: { code: string } }) {
  const invite = await db.select().from(staffInviteCodes)
    .where(and(
      eq(staffInviteCodes.code, params.code.toUpperCase()),
      eq(staffInviteCodes.isActive, true)
    ))
    .then(rows => rows[0])

  if (!invite) notFound()

  const restaurant = await db.select({ name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, invite.restaurantId))
    .then(rows => rows[0])

  if (!restaurant) notFound()

  const role = roleLabels[invite.role] ?? { label: invite.role, icon: '👤' }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{role.icon}</div>
          <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 text-sm mt-1">הצטרפות כ{role.label}</p>
          {invite.label && <p className="text-gray-400 text-xs mt-0.5">{invite.label}</p>}
        </div>
        <JoinForm code={params.code.toUpperCase()} role={invite.role} />
      </div>
    </div>
  )
}
