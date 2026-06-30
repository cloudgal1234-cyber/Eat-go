import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { db, initDb, staffMembers, restaurants } from '@/lib/db'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'eat-go-secret-key'
)

export interface StaffTokenPayload {
  staffMemberId: string
  restaurantId: string
}

export interface StaffMemberSession {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  phone: string | null
  role: string
  status: string
}

export async function signStaffToken(payload: StaffTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(JWT_SECRET)
}

export async function verifyStaffToken(token: string): Promise<StaffTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as StaffTokenPayload
  } catch {
    return null
  }
}

async function getStaffTokenPayload(): Promise<StaffTokenPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('eat-go-staff-token')?.value
  if (!token) return null
  return verifyStaffToken(token)
}

async function getStaffTokenPayloadFromRequest(req: NextRequest): Promise<StaffTokenPayload | null> {
  const token = req.cookies.get('eat-go-staff-token')?.value
  if (!token) return null
  return verifyStaffToken(token)
}

async function loadStaffMember(staffMemberId: string): Promise<StaffMemberSession | null> {
  await initDb()
  const row = await db.select({
    id: staffMembers.id,
    restaurantId: staffMembers.restaurantId,
    name: staffMembers.name,
    phone: staffMembers.phone,
    role: staffMembers.role,
    status: staffMembers.status,
    restaurantName: restaurants.name,
  }).from(staffMembers)
    .innerJoin(restaurants, eq(staffMembers.restaurantId, restaurants.id))
    .where(eq(staffMembers.id, staffMemberId))
    .then(rows => rows[0])

  return row ?? null
}

// Looks up the staff member from the cookie, regardless of approval status.
export async function getStaffMember(): Promise<StaffMemberSession | null> {
  const payload = await getStaffTokenPayload()
  if (!payload) return null
  return loadStaffMember(payload.staffMemberId)
}

export async function getStaffMemberFromRequest(req: NextRequest): Promise<StaffMemberSession | null> {
  const payload = await getStaffTokenPayloadFromRequest(req)
  if (!payload) return null
  return loadStaffMember(payload.staffMemberId)
}

// Only returns a member if their join request has been approved by the manager.
export async function getApprovedStaffMember(): Promise<StaffMemberSession | null> {
  const member = await getStaffMember()
  return member && member.status === 'APPROVED' ? member : null
}

export async function getApprovedStaffMemberFromRequest(req: NextRequest): Promise<StaffMemberSession | null> {
  const member = await getStaffMemberFromRequest(req)
  return member && member.status === 'APPROVED' ? member : null
}
