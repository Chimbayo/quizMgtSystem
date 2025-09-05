import { cookies } from 'next/headers'
import { UserRole } from '@/types'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('user-session')
    
    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== role) {
    throw new Error(`Access denied. Required role: ${role}`)
  }
  return session
}
