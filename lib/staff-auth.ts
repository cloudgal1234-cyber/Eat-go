import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'eat-go-secret-key'
)

export interface StaffPayload {
  restaurantId: string
  restaurantName: string
  staffName: string
  role: 'WAITER' | 'CHEF' | 'COURIER'
}

export async function signStaffToken(payload: StaffPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export async function verifyStaffToken(token: string): Promise<StaffPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as StaffPayload
  } catch {
    return null
  }
}

export async function getStaffSession(): Promise<StaffPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('eat-go-staff-token')?.value
  if (!token) return null
  return verifyStaffToken(token)
}

export async function getStaffSessionFromRequest(req: NextRequest): Promise<StaffPayload | null> {
  const token = req.cookies.get('eat-go-staff-token')?.value
  if (!token) return null
  return verifyStaffToken(token)
}
