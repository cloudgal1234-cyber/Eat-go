import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { db, initDb, employees } from '@/lib/db'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await db.select().from(employees)
    .where(eq(employees.restaurantId, session.restaurantId))
    .orderBy(employees.createdAt)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  initDb()
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })

    const id = crypto.randomUUID()
    await db.insert(employees).values({
      id,
      restaurantId: session.restaurantId,
      ...parsed.data,
      hireDate: parsed.data.hireDate || new Date().toISOString(),
    })
    const emp = await db.select().from(employees).where(eq(employees.id, id)).then(rows => rows[0])
    return NextResponse.json(emp, { status: 201 })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'עובד עם אימייל זה כבר קיים' }, { status: 409 })
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
