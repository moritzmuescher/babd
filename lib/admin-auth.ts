import { cookies } from "next/headers"

// Session configuration
const SESSION_COOKIE_NAME = "admin_session"
const SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

// In-memory session store (resets on server restart - this is intentional for security)
// For production with multiple instances, use Redis or a database
const sessions = new Map<string, { expiresAt: number }>()

// Login attempt tracking for rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// Generate a cryptographically secure random token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
}

// Hash password using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// Check if IP is rate limited
export function isRateLimited(ip: string): { limited: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(ip)
  if (!attempts) return { limited: false }

  const now = Date.now()

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip)
    return { limited: false }
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000)
    return { limited: true, remainingTime }
  }

  return { limited: false }
}

// Record a login attempt
export function recordLoginAttempt(ip: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(ip)
    return
  }

  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
  attempts.count++
  attempts.lastAttempt = Date.now()
  loginAttempts.set(ip, attempts)
}

// Verify password against stored hash
export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.CASHU_ADMIN_PASSWORD
  if (!adminPassword) {
    console.error("CASHU_ADMIN_PASSWORD not set in environment")
    return false
  }

  // Hash the provided password and compare
  const providedHash = await hashPassword(password)
  const storedHash = await hashPassword(adminPassword)

  return secureCompare(providedHash, storedHash)
}

// Create a new session
export async function createSession(): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = Date.now() + SESSION_DURATION

  sessions.set(token, { expiresAt })

  // Clean up expired sessions occasionally
  if (Math.random() < 0.1) {
    cleanupSessions()
  }

  return token
}

// Validate a session token
export function validateSession(token: string): boolean {
  const session = sessions.get(token)
  if (!session) return false

  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return false
  }

  return true
}

// Destroy a session
export function destroySession(token: string): void {
  sessions.delete(token)
}

// Clean up expired sessions
function cleanupSessions(): void {
  const now = Date.now()
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token)
    }
  }
}

// Get session token from cookies (for use in API routes)
export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

// Check if current request is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionFromCookies()
  if (!token) return false
  return validateSession(token)
}

// Session cookie name export for use in API routes
export { SESSION_COOKIE_NAME, SESSION_DURATION }
