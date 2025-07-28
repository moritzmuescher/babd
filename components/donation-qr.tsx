"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export function DonationQR() {
  const [copied, setCopied] = useState(false)
  const lightningUrl = "LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEEKZAR0WD5XJTNRDAKJ7TNHV4KXCTTTDEHHWM30D3H82UNVWQHKYCTZVSCX0SZD"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lightningUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="absolute right-4 bottom-32 md:top-1/2 md:bottom-auto md:transform md:-translate-y-1/2 z-10">
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-2 md:p-4 text-center">
        <img
          src="/images/ln_qr.jpeg"
          alt="Wallet of Satoshi Lightning Network QR Code"
          className="w-48 h-48 rounded-lg mb-3 cursor-pointer hover:opacity-80 transition-opacity hidden md:block"
          onClick={handleCopy}
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 bg-transparent"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy LN URL
            </>
          )}
        </Button>
      </Card>
    </div>
  )
}

