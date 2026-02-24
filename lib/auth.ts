import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { SESSION_CONFIG } from "@/lib/config"

export interface Session {
  adminId: string
  email: string
}

interface AdminCredentials {
  id: string
  email: string
  passwordHash?: string
  password?: string
}

function getConfiguredAdmin(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    return null
  }

  return {
    id: process.env.ADMIN_ID || "admin",
    email,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    password: process.env.ADMIN_PASSWORD,
  }
}

export async function createSession(adminId: string, email: string): Promise<void> {
  const cookieStore = await cookies()
  const session: Session = { adminId, email }

  cookieStore.set(SESSION_CONFIG.COOKIE_NAME, JSON.stringify(session), {
    httpOnly: SESSION_CONFIG.HTTP_ONLY,
    secure: process.env.NODE_ENV === "production",
    sameSite: SESSION_CONFIG.SAME_SITE,
    maxAge: SESSION_CONFIG.MAX_AGE_SECONDS,
  })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_CONFIG.COOKIE_NAME)
}

export async function verifyAdmin(email: string, password: string): Promise<{ id: string; email: string } | null> {
  const admin = getConfiguredAdmin()
  if (!admin || admin.email !== email) {
    return null
  }

  if (admin.passwordHash) {
    const isValid = await bcrypt.compare(password, admin.passwordHash)
    return isValid ? { id: admin.id, email: admin.email } : null
  }

  if (admin.password) {
    return password === admin.password ? { id: admin.id, email: admin.email } : null
  }

  return null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}
