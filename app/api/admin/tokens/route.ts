import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { isAuthenticated } from "@/lib/admin-auth"

const TOKENS_FILE = path.join(process.cwd(), "cashu-tokens.json")

interface StoredToken {
  id?: string
  token: string
  amount: number
  timestamp: number
  redeemed: boolean
}

// Ensure all tokens have IDs
function ensureTokenIds(tokens: StoredToken[]): StoredToken[] {
  return tokens.map((token, index) => ({
    ...token,
    id: token.id || `token_${token.timestamp}_${index}`,
  }))
}

// GET - Retrieve all tokens (requires auth)
export async function GET() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8")
    let tokens: StoredToken[] = JSON.parse(data)
    tokens = ensureTokenIds(tokens)

    // Calculate stats
    const totalReceived = tokens.reduce((sum, t) => sum + t.amount, 0)
    const unredeemedAmount = tokens
      .filter((t) => !t.redeemed)
      .reduce((sum, t) => sum + t.amount, 0)
    const redeemedAmount = tokens
      .filter((t) => t.redeemed)
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      tokens: tokens.sort((a, b) => b.timestamp - a.timestamp), // Most recent first
      stats: {
        totalReceived,
        unredeemedAmount,
        redeemedAmount,
        totalTokens: tokens.length,
        unredeemedTokens: tokens.filter((t) => !t.redeemed).length,
      },
    })
  } catch {
    // File doesn't exist yet
    return NextResponse.json({
      tokens: [],
      stats: {
        totalReceived: 0,
        unredeemedAmount: 0,
        redeemedAmount: 0,
        totalTokens: 0,
        unredeemedTokens: 0,
      },
    })
  }
}

// PATCH - Mark token(s) as redeemed (requires auth)
export async function PATCH(request: NextRequest) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tokenIds, redeemed } = body

    if (!tokenIds || !Array.isArray(tokenIds)) {
      return NextResponse.json(
        { error: "tokenIds array required" },
        { status: 400 }
      )
    }

    // Load tokens
    let tokens: StoredToken[] = []
    try {
      const data = await fs.readFile(TOKENS_FILE, "utf-8")
      tokens = JSON.parse(data)
      tokens = ensureTokenIds(tokens)
    } catch {
      return NextResponse.json({ error: "No tokens found" }, { status: 404 })
    }

    // Update tokens
    let updatedCount = 0
    tokens = tokens.map((token) => {
      if (tokenIds.includes(token.id)) {
        updatedCount++
        return { ...token, redeemed: redeemed !== false }
      }
      return token
    })

    // Save back
    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2))

    return NextResponse.json({
      success: true,
      updatedCount,
    })
  } catch (error) {
    console.error("Error updating tokens:", error)
    return NextResponse.json(
      { error: "Failed to update tokens" },
      { status: 500 }
    )
  }
}

// DELETE - Delete redeemed tokens (cleanup, requires auth)
export async function DELETE() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let tokens: StoredToken[] = []
    try {
      const data = await fs.readFile(TOKENS_FILE, "utf-8")
      tokens = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: "No tokens found" }, { status: 404 })
    }

    const originalCount = tokens.length
    tokens = tokens.filter((t) => !t.redeemed)
    const deletedCount = originalCount - tokens.length

    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2))

    return NextResponse.json({
      success: true,
      deletedCount,
      remainingCount: tokens.length,
    })
  } catch (error) {
    console.error("Error deleting tokens:", error)
    return NextResponse.json(
      { error: "Failed to delete tokens" },
      { status: 500 }
    )
  }
}
