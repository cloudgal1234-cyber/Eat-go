import { NextRequest, NextResponse } from 'next/server'
import { db, initDb, staffMembers } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const members = await db.select().from(staffMembers)
    .where(eq(staffMembers.restaurantId, session.restaurantId))
    .orderBy(desc(staffMembers.createdAt))

  return NextResponse.json({ members })
}
