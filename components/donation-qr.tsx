"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function DonationQR() {
  const [copied, setCopied] = useState(false)
  const [qrType, setQrType] = useState("bolt11")

  const bolt11Url = "LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEEKZAR0WD5XJTNRDAKJ7TNHV4KXCTTTDEHHWM30D3H82UNVWQHKYCTZVSCX0SZD"
  const bolt12Url = "lno1zrxq8pjw7qjlm68mtp7e3yvxee4y5xrgjhhyf2fxhlphpckrvevh50u0qwvek6f5a0csxksx84erhkpejk8cw54qsdw6ntqu3vltl2temgw4wqsz0vdmcgk7drw7easeyh2xn3szcf9ahatkewelcgve8t6c8d6w8cxsqvap7kmauqgph47ve2sgvk9wu77kuukur4t77td6k6edl8kmtqzpvu4hlqmscmenckuxq8xsfdqk5wqqst03qdgff4g7dd74s0lzy6337836e76zcpkzz2s2j8spgxscdnx9cnn42qqstr20s3znchwexwy2mlyxt6wvg5"

  const lightningUrl = qrType === "bolt11" ? bolt11Url : bolt12Url

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
    <div className="absolute right-4 top-64 md:top-80 z-10">
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-2 md:p-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Label htmlFor="qr-type-switch">Bolt11</Label>
          <Switch
            id="qr-type-switch"
            checked={qrType === "bolt12"}
            onCheckedChange={() => setQrType(qrType === "bolt11" ? "bolt12" : "bolt11")}
          />
          <Label htmlFor="qr-type-switch">Bolt12</Label>
        </div>
        <img
          src={qrType === "bolt11" ? "/images/LNURL2png.png" : "/images/bolt12.jpeg"}
          alt="Lightning QR Code"
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
