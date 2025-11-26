import { NextRequest, NextResponse } from "next/server"

// In-memory rate limit store (resets on server restart)
// For production, consider using Redis or a database
const rateLimitStore = new Map<string, number[]>()

const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_INVOICES_PER_WINDOW = 5 // 5 invoices per minute per IP

// Clean up old entries periodically
function cleanupOldEntries() {
  const now = Date.now()
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(ip)
    } else {
      rateLimitStore.set(ip, validTimestamps)
    }
  }
}

// Get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  return "unknown"
}

// POST - Check and record rate limit
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const now = Date.now()

  // Clean up old entries occasionally
  if (Math.random() < 0.1) {
    cleanupOldEntries()
  }

  // Get existing timestamps for this IP
  const timestamps = rateLimitStore.get(ip) || []
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

  // Check if rate limited
  if (recentTimestamps.length >= MAX_INVOICES_PER_WINDOW) {
    const oldestTimestamp = Math.min(...recentTimestamps)
    const retryAfter = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW - now) / 1000)

    return NextResponse.json(
      {
        allowed: false,
        retryAfter,
        message: `Rate limited. Try again in ${retryAfter} seconds.`
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter)
        }
      }
    )
  }

  // Record this request
  recentTimestamps.push(now)
  rateLimitStore.set(ip, recentTimestamps)

  const remaining = MAX_INVOICES_PER_WINDOW - recentTimestamps.length

  return NextResponse.json({
    allowed: true,
    remaining,
    message: `Request allowed. ${remaining} requests remaining in this window.`
  })
}

// GET - Check rate limit status without recording
export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const now = Date.now()

  const timestamps = rateLimitStore.get(ip) || []
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

  const remaining = Math.max(0, MAX_INVOICES_PER_WINDOW - recentTimestamps.length)

  return NextResponse.json({
    remaining,
    limit: MAX_INVOICES_PER_WINDOW,
    window: RATE_LIMIT_WINDOW / 1000
  })
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
