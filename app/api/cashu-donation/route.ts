import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const TOKENS_FILE = path.join(process.cwd(), "cashu-tokens.json")

interface StoredToken {
  token: string
  amount: number
  timestamp: number
  redeemed: boolean
}

// GET - Retrieve all stored tokens (for you to redeem)
export async function GET(request: NextRequest) {
  // Simple auth check - you can make this more secure
  const authHeader = request.headers.get("authorization")
  const expectedKey = process.env.CASHU_ADMIN_KEY

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8")
    const tokens: StoredToken[] = JSON.parse(data)
    return NextResponse.json({ tokens })
  } catch {
    // File doesn't exist yet
    return NextResponse.json({ tokens: [] })
  }
}

// POST - Store a new Cashu token after payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, amount } = body

    if (!token || !amount) {
      return NextResponse.json(
        { error: "Missing token or amount" },
        { status: 400 }
      )
    }

    // Load existing tokens
    let tokens: StoredToken[] = []
    try {
      const data = await fs.readFile(TOKENS_FILE, "utf-8")
      tokens = JSON.parse(data)
    } catch {
      // File doesn't exist yet, start fresh
    }

    // Add new token
    const newToken: StoredToken = {
      token,
      amount,
      timestamp: Date.now(),
      redeemed: false,
    }
    tokens.push(newToken)

    // Save back to file
    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2))

    console.log(`[Cashu] Received ${amount} sats donation`)

    return NextResponse.json({ success: true, message: "Token stored" })
  } catch (err) {
    console.error("[Cashu] Error storing token:", err)
    return NextResponse.json(
      { error: "Failed to store token" },
      { status: 500 }
    )
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
