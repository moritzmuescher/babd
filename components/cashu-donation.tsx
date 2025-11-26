"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Zap, Loader2, RefreshCw, X, Bitcoin, Clipboard, ArrowLeft } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { CyberBrackets } from "@/components/ui/cyber-brackets"
import { Wallet, MintQuoteState, getEncodedTokenV4 } from "@cashu/cashu-ts"
import { QRCodeSVG } from "qrcode.react"

const MINT_URL = "https://mint.minibits.cash/Bitcoin"
const PRESET_AMOUNTS = [21, 420, 2100]
const POLL_INTERVAL = 3000

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60000 // 1 minute window
const MAX_INVOICES_PER_WINDOW = 3 // Max 3 invoices per minute
const RATE_LIMIT_STORAGE_KEY = "cashu_invoice_timestamps"

// Static payment info
const LNURL = "LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEEKZAR0WD5XJTNRDAKJ7TNHV4KXCTTTDEHHWM30D3H82UNVWQHKYCTZVSCX0SZD"
const ONCHAIN_ADDRESS = "bc1p3yaknvcfxkqp5mvp2kxk24qlr6zzfh537zwuf7s2fggyty7hcclqd2dz65"

type PaymentMethod = "onchain" | "lightning" | "cashu"
type CashuMode = "select" | "invoice" | "paste"
type CashuState = "idle" | "pending" | "paid" | "error"

interface Proof {
  id: string
  amount: number
  secret: string
  C: string
}

export function CashuDonation() {
  // Main payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cashu")

  // Cashu-specific state
  const [cashuMode, setCashuMode] = useState<CashuMode>("select")
  const [cashuState, setCashuState] = useState<CashuState>("idle")
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [invoice, setInvoice] = useState("")
  const [pasteToken, setPasteToken] = useState("")
  const [pasteError, setPasteError] = useState("")
  const [pasteSuccess, setPasteSuccess] = useState(false)

  // General state
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)

  const walletRef = useRef<Wallet | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Cashu wallet
  useEffect(() => {
    const initWallet = async () => {
      try {
        const wallet = new Wallet(MINT_URL)
        await wallet.loadMint()
        walletRef.current = wallet
      } catch (err) {
        console.error("Failed to initialize Cashu wallet:", err)
      }
    }
    initWallet()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Rate limiting helpers
  const getStoredTimestamps = (): number[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as number[]
    } catch {
      return []
    }
  }

  const setStoredTimestamps = (timestamps: number[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(timestamps))
  }

  const checkRateLimit = (): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now()
    const timestamps = getStoredTimestamps()

    // Filter to only timestamps within the window
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

    if (recentTimestamps.length >= MAX_INVOICES_PER_WINDOW) {
      // Calculate when the oldest timestamp will expire
      const oldestTimestamp = Math.min(...recentTimestamps)
      const retryAfter = oldestTimestamp + RATE_LIMIT_WINDOW - now
      return { allowed: false, retryAfter }
    }

    return { allowed: true }
  }

  const recordInvoiceGeneration = () => {
    const now = Date.now()
    const timestamps = getStoredTimestamps()
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
    recentTimestamps.push(now)
    setStoredTimestamps(recentTimestamps)
  }

  // Send token to backend API
  const sendTokenToBackend = async (token: string, amount: number) => {
    try {
      const response = await fetch("/api/cashu-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount }),
      })
      return response.ok
    } catch (err) {
      console.error("Error sending token to backend:", err)
      return false
    }
  }

  // Generate Cashu invoice
  const generateInvoice = useCallback(async (amount: number) => {
    if (!walletRef.current) {
      setError("Wallet not initialized")
      setCashuState("error")
      return
    }

    // Check client-side rate limit first (fast check)
    const clientRateLimitCheck = checkRateLimit()
    if (!clientRateLimitCheck.allowed) {
      const seconds = Math.ceil((clientRateLimitCheck.retryAfter || 0) / 1000)
      setError(`Too many requests. Try again in ${seconds}s`)
      setRateLimitedUntil(Date.now() + (clientRateLimitCheck.retryAfter || 0))
      setCashuState("error")
      return
    }

    try {
      setCashuState("pending")
      setError("")
      setRateLimitedUntil(null)

      // Check server-side rate limit (more authoritative)
      const serverRateLimitResponse = await fetch("/api/cashu-rate-limit", {
        method: "POST"
      })

      if (!serverRateLimitResponse.ok) {
        const data = await serverRateLimitResponse.json()
        setError(data.message || "Too many requests")
        setRateLimitedUntil(Date.now() + (data.retryAfter || 30) * 1000)
        setCashuState("error")
        return
      }

      // Record this invoice generation for client-side rate limiting
      recordInvoiceGeneration()

      const mintQuote = await walletRef.current.createMintQuoteBolt11(amount)
      setInvoice(mintQuote.request)

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await walletRef.current!.checkMintQuoteBolt11(mintQuote.quote)

          if (status.state === MintQuoteState.PAID) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
            }

            try {
              const proofs = await walletRef.current!.mintProofsBolt11(amount, mintQuote.quote)
              const token = getEncodedTokenV4({
                mint: MINT_URL,
                proofs: proofs as Proof[]
              })
              await sendTokenToBackend(token, amount)
              setCashuState("paid")
            } catch (mintErr) {
              console.error("Failed to mint proofs:", mintErr)
              setCashuState("paid")
            }
          }
        } catch (pollErr) {
          console.error("Poll error:", pollErr)
        }
      }, POLL_INTERVAL)

    } catch (err) {
      console.error("Failed to generate invoice:", err)
      setError("Failed to generate invoice")
      setCashuState("error")
    }
  }, [])

  // Handle Cashu amount selection
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setShowCustomInput(false)
    setCashuMode("invoice")
    generateInvoice(amount)
  }

  // Handle custom amount
  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount, 10)
    if (amount && amount > 0 && amount <= 1000000) {
      setSelectedAmount(amount)
      setCashuMode("invoice")
      generateInvoice(amount)
    } else {
      setError("Amount must be between 1 and 1,000,000 sats")
    }
  }

  // Handle token paste submission
  const [pasteLoading, setPasteLoading] = useState(false)
  const [pasteAmount, setPasteAmount] = useState<number | null>(null)

  const submitToken = async (tokenToSubmit: string) => {
    if (!tokenToSubmit.trim()) {
      setPasteError("Please paste a Cashu token")
      return
    }

    // Basic validation - Cashu tokens start with "cashu"
    if (!tokenToSubmit.trim().toLowerCase().startsWith("cashu")) {
      setPasteError("Invalid Cashu token format")
      return
    }

    setPasteError("")
    setPasteLoading(true)

    try {
      // Send token to server for immediate redemption (swap)
      const response = await fetch("/api/cashu-redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToSubmit.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPasteSuccess(true)
        setPasteAmount(data.amount)
        setPasteToken("")
        setTimeout(() => {
          setPasteSuccess(false)
          setPasteAmount(null)
          setCashuMode("select")
        }, 3000)
      } else {
        setPasteError(data.error || "Failed to process token")
      }
    } catch (err) {
      console.error("Error redeeming token:", err)
      setPasteError("Network error - please try again")
    } finally {
      setPasteLoading(false)
    }
  }

  const handlePasteSubmit = async () => {
    await submitToken(pasteToken)
  }

  // Handle paste from clipboard - auto-submit if valid token
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setPasteToken(text)

      // Auto-submit if it looks like a Cashu token
      if (text.trim().toLowerCase().startsWith("cashu")) {
        await submitToken(text)
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err)
      setPasteError("Failed to read clipboard")
    }
  }

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Reset Cashu state
  const resetCashu = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    setCashuMode("select")
    setCashuState("idle")
    setSelectedAmount(null)
    setCustomAmount("")
    setShowCustomInput(false)
    setInvoice("")
    setError("")
    setPasteToken("")
    setPasteError("")
    setPasteSuccess(false)
    setPasteLoading(false)
    setPasteAmount(null)
  }

  // Get current copy text based on payment method
  const getCopyText = () => {
    switch (paymentMethod) {
      case "onchain": return ONCHAIN_ADDRESS
      case "lightning": return LNURL
      default: return ""
    }
  }

  // Get QR image source
  const getQRImage = () => {
    switch (paymentMethod) {
      case "onchain": return "/images/onchain.jpeg"
      case "lightning": return "/images/LNURL2png.png"
      default: return ""
    }
  }

  return (
    <div className="absolute right-4 bottom-[18rem] md:bottom-[18rem] @[@media(min-height:1000px)]:top-1/2 @[@media(min-height:1000px)]:-translate-y-1/2 @[@media(min-height:1000px)]:bottom-auto min-[2000px]:top-1/2 min-[2000px]:-translate-y-1/2 min-[2000px]:bottom-auto z-5 hidden md:block">
      <div className="hud-panel-right">
        <CyberBrackets>
          <Card className="bg-black/30 border-orange-500/25 backdrop-blur-md p-3 text-center w-[232px] h-[430px] flex flex-col">
            {/* Title */}
            <div className="text-orange-400 text-sm font-medium mb-2">Donations</div>

            {/* Payment Method Tabs */}
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  onClick={() => { setPaymentMethod("onchain"); resetCashu(); }}
                  size="sm"
                  variant="ghost"
                  className={`border border-orange-500/25 px-2 py-0.5 h-7 text-xs flex-1 ${paymentMethod === "onchain" ? "bg-orange-500/30 text-orange-200" : "bg-orange-500/10 text-orange-400"} hover:text-orange-200 hover:bg-orange-500/20`}
                >
                  <Bitcoin className="w-3 h-3 mr-1" />
                  On-Chain
                </Button>
                <Button
                  onClick={() => { setPaymentMethod("lightning"); resetCashu(); }}
                  size="sm"
                  variant="ghost"
                  className={`border border-orange-500/25 px-2 py-0.5 h-7 text-xs flex-1 ${paymentMethod === "lightning" ? "bg-orange-500/30 text-orange-200" : "bg-orange-500/10 text-orange-400"} hover:text-orange-200 hover:bg-orange-500/20`}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Lightning
                </Button>
              </div>
              <Button
                onClick={() => { setPaymentMethod("cashu"); resetCashu(); }}
                size="sm"
                variant="ghost"
                className={`border border-orange-500/25 px-2 py-0.5 h-7 text-xs w-full ${paymentMethod === "cashu" ? "bg-orange-500/30 text-orange-200" : "bg-orange-500/10 text-orange-400"} hover:text-orange-200 hover:bg-orange-500/20`}
              >
                <span className="mr-1">🥜</span>
                Cashu
              </Button>
            </div>

            {/* Content Area - Fixed Height */}
            <div className="flex-1 flex flex-col justify-center">

            {/* On-Chain Content */}
            {paymentMethod === "onchain" && (
              <>
                <div
                  className="relative cursor-pointer hover:opacity-90 transition-opacity mx-auto w-fit"
                  onClick={() => handleCopy(ONCHAIN_ADDRESS)}
                >
                  <img
                    src="/images/onchain.jpeg"
                    alt="On-Chain QR"
                    className="w-48 h-48 rounded-md"
                  />
                  {copied && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                      <Copy className="w-8 h-8 text-white" />
                      <div className="text-white text-xs mt-1">Copied!</div>
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-orange-400/50 mt-2 truncate px-2">
                  {ONCHAIN_ADDRESS.slice(0, 20)}...
                </div>
              </>
            )}

            {/* Lightning Content */}
            {paymentMethod === "lightning" && (
              <>
                <div
                  className="relative cursor-pointer hover:opacity-90 transition-opacity mx-auto w-fit"
                  onClick={() => handleCopy(LNURL)}
                >
                  <img
                    src="/images/LNURL2png.png"
                    alt="Lightning QR"
                    className="w-48 h-48 rounded-md"
                  />
                  {copied && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                      <Copy className="w-8 h-8 text-white" />
                      <div className="text-white text-xs mt-1">Copied!</div>
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-orange-400/50 mt-2">
                  LNURL (any amount)
                </div>
              </>
            )}

            {/* Cashu Content */}
            {paymentMethod === "cashu" && (
              <>
                {/* Cashu Mode Selection */}
                {cashuMode === "select" && cashuState === "idle" && (
                  <>
                    <div className="text-[10px] text-orange-400/70 mb-2">Choose option</div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => setCashuMode("invoice")}
                        size="sm"
                        variant="ghost"
                        className="w-full border border-orange-500/25 px-2 py-5 h-auto text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 flex flex-col items-center justify-center gap-1"
                      >
                        <Zap className="w-5 h-5" />
                        <span>Generate</span>
                        <span>Lightning Invoice</span>
                      </Button>
                      <Button
                        onClick={() => setCashuMode("paste")}
                        size="sm"
                        variant="ghost"
                        className="w-full border border-orange-500/25 px-2 py-5 h-auto text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 flex flex-col items-center justify-center gap-1"
                      >
                        <Clipboard className="w-5 h-5" />
                        <span>Paste</span>
                        <span>Cashu Token</span>
                      </Button>
                    </div>
                  </>
                )}

                {/* Cashu Invoice - Amount Selection */}
                {cashuMode === "invoice" && cashuState === "idle" && (
                  <>
                    <Button
                      onClick={() => setCashuMode("select")}
                      size="sm"
                      variant="ghost"
                      className="mb-2 border border-orange-500/25 px-2 py-0.5 h-6 text-[10px] bg-transparent text-orange-400/70 hover:text-orange-200 hover:bg-orange-500/10"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" />
                      Back
                    </Button>
                    <div className="text-[10px] text-orange-400/70 mb-2">Select amount (sats)</div>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {PRESET_AMOUNTS.map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => handleAmountSelect(amount)}
                          size="sm"
                          variant="ghost"
                          className="border border-orange-500/25 px-1.5 py-0.5 h-7 text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>

                    {!showCustomInput ? (
                      <Button
                        onClick={() => setShowCustomInput(true)}
                        size="sm"
                        variant="ghost"
                        className="w-full border border-orange-500/25 px-1.5 py-0.5 h-7 text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20"
                      >
                        Custom
                      </Button>
                    ) : (
                      <div className="flex gap-1.5">
                        <Input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="sats"
                          className="h-7 text-[11px] bg-black/50 border-orange-500/25 text-orange-200 placeholder:text-orange-400/50"
                          min={1}
                          max={1000000}
                          onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                        />
                        <Button
                          onClick={handleCustomSubmit}
                          size="sm"
                          variant="ghost"
                          className="border border-orange-500/25 px-1.5 h-7 text-[11px] bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {error && (
                      <div className="text-red-400 text-[10px] mt-1.5">{error}</div>
                    )}
                  </>
                )}

                {/* Cashu Invoice - Pending Payment */}
                {cashuMode === "invoice" && cashuState === "pending" && (
                  <>
                    <div className="text-[10px] text-orange-400/70 mb-1.5">
                      Pay {selectedAmount?.toLocaleString()} sats
                    </div>

                    <div
                      className="relative bg-white p-1.5 rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity mx-auto w-fit"
                      onClick={() => handleCopy(invoice)}
                    >
                      <QRCodeSVG
                        value={invoice}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                      {copied && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                          <Copy className="w-6 h-6 text-white" />
                          <div className="text-white text-[10px] mt-0.5">Copied!</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-orange-400/70 mb-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Waiting for payment...</span>
                    </div>

                    <Button
                      onClick={() => handleCopy(invoice)}
                      size="sm"
                      variant="ghost"
                      className="w-full border border-orange-500/25 px-1.5 py-0.5 h-6 text-[10px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20 mb-1.5"
                    >
                      <Copy className="w-2.5 h-2.5 mr-1" />
                      Copy Invoice
                    </Button>

                    <Button
                      onClick={resetCashu}
                      size="sm"
                      variant="ghost"
                      className="w-full border border-orange-500/25 px-1.5 py-0.5 h-6 text-[10px] bg-transparent text-orange-400/70 hover:text-orange-200 hover:bg-orange-500/10"
                    >
                      <X className="w-2.5 h-2.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}

                {/* Cashu Invoice - Payment Success */}
                {cashuState === "paid" && (
                  <>
                    <div className="flex flex-col items-center justify-center py-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 animate-pulse">
                        <Check className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="text-green-400 text-sm font-medium mb-0.5">Thank you!</div>
                      <div className="text-[10px] text-orange-400/70">
                        Received {selectedAmount?.toLocaleString()} sats
                      </div>
                    </div>

                    <Button
                      onClick={resetCashu}
                      size="sm"
                      variant="ghost"
                      className="w-full border border-orange-500/25 px-1.5 py-0.5 h-7 text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Donate Again
                    </Button>
                  </>
                )}

                {/* Cashu Invoice - Error */}
                {cashuState === "error" && (
                  <>
                    <div className="flex flex-col items-center justify-center py-3">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                        <X className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="text-red-400 text-xs mb-0.5">Error</div>
                      <div className="text-[10px] text-orange-400/70">{error}</div>
                    </div>

                    <Button
                      onClick={resetCashu}
                      size="sm"
                      variant="ghost"
                      className="w-full border border-orange-500/25 px-1.5 py-0.5 h-7 text-[11px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Try Again
                    </Button>
                  </>
                )}

                {/* Cashu Paste Token */}
                {cashuMode === "paste" && !pasteSuccess && !pasteLoading && (
                  <>
                    <Button
                      onClick={() => setCashuMode("select")}
                      size="sm"
                      variant="ghost"
                      className="mb-2 border border-orange-500/25 px-2 py-0.5 h-6 text-[10px] bg-transparent text-orange-400/70 hover:text-orange-200 hover:bg-orange-500/10"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" />
                      Back
                    </Button>
                    <div className="text-[10px] text-orange-400/70 mb-2">Paste Cashu token</div>

                    <textarea
                      value={pasteToken}
                      onChange={(e) => setPasteToken(e.target.value)}
                      placeholder="cashuA..."
                      className="w-full h-20 text-[10px] bg-black/50 border border-orange-500/25 text-orange-200 placeholder:text-orange-400/50 rounded-md p-2 resize-none mb-2"
                    />

                    <div className="flex gap-1.5 mb-2">
                      <Button
                        onClick={handlePasteFromClipboard}
                        size="sm"
                        variant="ghost"
                        className="flex-1 border border-orange-500/25 px-1.5 py-0.5 h-7 text-[10px] bg-orange-500/10 text-orange-400 hover:text-orange-200 hover:bg-orange-500/20"
                      >
                        <Clipboard className="w-3 h-3 mr-1" />
                        Paste
                      </Button>
                      <Button
                        onClick={handlePasteSubmit}
                        size="sm"
                        variant="ghost"
                        className="flex-1 border border-orange-500/25 px-1.5 py-0.5 h-7 text-[10px] bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Submit
                      </Button>
                    </div>

                    {pasteError && (
                      <div className="text-red-400 text-[10px]">{pasteError}</div>
                    )}
                  </>
                )}

                {/* Cashu Paste Loading */}
                {cashuMode === "paste" && pasteLoading && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-2" />
                    <div className="text-orange-400/70 text-[11px]">Redeeming token...</div>
                    <div className="text-orange-400/50 text-[9px] mt-1">This may take a moment</div>
                  </div>
                )}

                {/* Cashu Paste Success */}
                {cashuMode === "paste" && pasteSuccess && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 animate-pulse">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-green-400 text-sm font-medium">Thank you!</div>
                    {pasteAmount && (
                      <div className="text-[10px] text-orange-400/70 mt-1">
                        Received {pasteAmount.toLocaleString()} sats
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            </div>

            {/* Footer - Fixed at bottom, hidden during Cashu pending payment */}
            {!(paymentMethod === "cashu" && cashuState === "pending") && (
              <div className="mt-auto">
                <Separator className="my-3 bg-orange-500/25" />

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4">
                  <a
                    href="https://x.com/babdcs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img src="/images/twitter.png" alt="X logo" className="h-7 w-7" />
                  </a>
                  <a
                    href="https://njump.me/npub1d3h6cxpz9y9f20c5rg08hgadjtns4stmyqw75q8spssdp46r635q33wvj0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img src="/images/nostr-icon-grey.png" alt="Nostr" className="h-7 w-7" />
                  </a>
                  <a
                    href="https://github.com/babdbtc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </Card>
        </CyberBrackets>
      </div>
    </div>
  )
}
