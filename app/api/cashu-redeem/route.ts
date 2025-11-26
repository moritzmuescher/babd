import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { Wallet, getDecodedToken, getEncodedTokenV4 } from "@cashu/cashu-ts"

const TOKENS_FILE = path.join(process.cwd(), "cashu-tokens.json")
const MINT_URL = "https://mint.minibits.cash/Bitcoin"

interface StoredToken {
  id?: string
  token: string
  amount: number
  timestamp: number
  redeemed: boolean
}

interface Proof {
  id: string
  amount: number
  secret: string
  C: string
}

// POST - Receive and immediately redeem a Cashu token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      )
    }

    // Validate token format
    const trimmedToken = token.trim()
    if (!trimmedToken.toLowerCase().startsWith("cashu")) {
      return NextResponse.json(
        { error: "Invalid Cashu token format" },
        { status: 400 }
      )
    }

    // Decode the token to get proofs and mint info
    let decoded
    try {
      decoded = getDecodedToken(trimmedToken)
    } catch (decodeErr) {
      console.error("[Cashu] Failed to decode token:", decodeErr)
      return NextResponse.json(
        { error: "Invalid token - could not decode" },
        { status: 400 }
      )
    }

    // Get the mint URL from the token
    const tokenMintUrl = decoded.mint

    // Calculate total amount from proofs
    const proofs = decoded.proofs || []
    const totalAmount = proofs.reduce((sum: number, p: Proof) => sum + p.amount, 0)

    if (totalAmount <= 0 || proofs.length === 0) {
      return NextResponse.json(
        { error: "Token has no value" },
        { status: 400 }
      )
    }

    // Initialize wallet for the token's mint
    const wallet = new Wallet(tokenMintUrl)
    await wallet.loadMint()

    // Swap the proofs for new ones that only we control
    // This invalidates the original token immediately
    let newProofs: Proof[]
    try {
      const swapResult = await wallet.swap(totalAmount, proofs)
      // swap() returns { keep: Proof[], send: Proof[] } or just Proof[]
      // We want all the proofs back
      if (Array.isArray(swapResult)) {
        newProofs = swapResult as Proof[]
      } else if (swapResult && typeof swapResult === 'object') {
        // Combine keep and send proofs
        const keep = (swapResult as { keep?: Proof[], send?: Proof[] }).keep || []
        const send = (swapResult as { keep?: Proof[], send?: Proof[] }).send || []
        newProofs = [...keep, ...send] as Proof[]
      } else {
        throw new Error("Unexpected swap result format")
      }
    } catch (swapErr) {
      console.error("[Cashu] Swap failed:", swapErr)
      // Token might already be spent or invalid
      return NextResponse.json(
        { error: "Token already spent or invalid" },
        { status: 400 }
      )
    }

    if (!newProofs || newProofs.length === 0) {
      return NextResponse.json(
        { error: "Swap returned no proofs" },
        { status: 400 }
      )
    }

    // Encode the new proofs as a token that only we have
    const newToken = getEncodedTokenV4({
      mint: tokenMintUrl,
      proofs: newProofs,
    })

    // Store the new token
    let tokens: StoredToken[] = []
    try {
      const data = await fs.readFile(TOKENS_FILE, "utf-8")
      tokens = JSON.parse(data)
    } catch {
      // File doesn't exist yet, start fresh
    }

    const storedToken: StoredToken = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      token: newToken,
      amount: totalAmount,
      timestamp: Date.now(),
      redeemed: false,
    }
    tokens.push(storedToken)

    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2))

    console.log(`[Cashu] Redeemed and stored ${totalAmount} sats from pasted token`)

    return NextResponse.json({
      success: true,
      amount: totalAmount,
      message: `Received ${totalAmount} sats`,
    })
  } catch (err) {
    console.error("[Cashu] Error processing token:", err)
    return NextResponse.json(
      { error: "Failed to process token" },
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
