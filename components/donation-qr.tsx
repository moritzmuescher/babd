"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function DonationQR() {
  const [copied, setCopied] = useState(false)
  const [npubCopied, setNpubCopied] = useState(false)
  const [qrType, setQrType] = useState("bolt11")

  const bolt11Url = "LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEEKZAR0WD5XJTNRDAKJ7TNHV4KXCTTTDEHHWM30D3H82UNVWQHKYCTZVSCX0SZD"
  const bolt12Url = "lno1zrxq8pjw7qjlm68mtp7e3yvxee4y5xrgjhhyf2fxhlphpckrvevh50u0qwvek6f5a0csxksx84erhkpejk8cw54qsdw6ntqu3vltl2temgw4wqsz0vdmcgk7drw7easeyh2xn3szcf9ahatkewelcgve8t6c8d6w8cxsqvap7kmauqgph47ve2sgvk9wu77kuukur4t77td6k6edl8kmtqzpvu4hlqmscmenckuxq8xsfdqk5wqqst03qdgff4g7dd74s0lzy6337836e76zcpkzz2s2j8spgxscdnx9cnn42qqstr20s3znchwexwy2mlyxt6wvg5"
  const onChainAddress = "bc1p3yaknvcfxkqp5mvp2kxk24qlr6zzfh537zwuf7s2fggyty7hcclqd2dz65"
  const npub = "npub1d3h6cxpz9y9f20c5rg08hgadjtns4stmyqw75q8spssdp46r635q33wvj0"

  const getUrl = () => {
    switch (qrType) {
      case "bolt11":
        return bolt11Url
      case "bolt12":
        return bolt12Url
      case "onchain":
        return onChainAddress
      default:
        return ""
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleNpubCopy = async () => {
    try {
      await navigator.clipboard.writeText(npub)
      setNpubCopied(true)
      setTimeout(() => setNpubCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy npub:", err)
    }
  }

  const getImageSrc = () => {
    switch (qrType) {
      case "bolt11":
        return "/images/LNURL2png.png"
      case "bolt12":
        return "/images/bolt12.jpeg"
      case "onchain":
        return "/images/onchain.jpeg"
      default:
        return ""
    }
  }

  return (
    <div className="absolute right-4 top-64 md:top-80 z-10 hidden md:block">
      <Card className="bg-black/30 border-orange-500/25 backdrop-blur-md p-2 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="flex items-center justify-center space-x-1 rounded-md bg-neutral-700 p-1">
            <Button
              onClick={() => setQrType("onchain")}
              className={`px-2 py-1 text-xs h-auto ${qrType === "onchain" ? "bg-orange-500 text-white hover:bg-orange-500" : "bg-transparent text-neutral-400 hover:bg-neutral-600"}`}
              variant="ghost"
            >
              On-Chain
            </Button>
            <Button
              onClick={() => setQrType("bolt11")}
              className={`px-2 py-1 text-xs h-auto ${qrType === "bolt11" ? "bg-orange-500 text-white hover:bg-orange-500" : "bg-transparent text-neutral-400 hover:bg-neutral-600"}`}
              variant="ghost"
            >
              Bolt11
            </Button>
            <Button
              onClick={() => setQrType("bolt12")}
              className={`px-2 py-1 text-xs h-auto ${qrType === "bolt12" ? "bg-orange-500 text-white hover:bg-orange-500" : "bg-transparent text-neutral-400 hover:bg-neutral-600"}`}
              variant="ghost"
            >
              Bolt12
            </Button>
          </div>
        </div>
        <div className="relative">
          <img
            src={getImageSrc()}
            alt="QR Code"
            className="w-48 h-48 rounded-lg mb-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleCopy}
          />
          {copied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
              <Copy className="w-16 h-16 text-white" />
              <div className="text-white text-sm mt-2">
                {qrType === "onchain" ? "Copied On-Chain address" : "Copied LN URL"}
              </div>
            </div>
          )}
        </div>
        <Separator className="my-4 bg-orange-500/25" />
        <div className="relative">
          <img
            src="/images/nostr-npub.png"
            alt="Nostr QR Code"
            className="w-48 h-48 rounded-lg mt-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleNpubCopy}
          />
          {npubCopied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
              <Copy className="w-16 h-16 text-white" />
              <div className="text-white text-sm mt-2">Copied npub</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
