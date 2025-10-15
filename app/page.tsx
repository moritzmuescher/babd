"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ThreeScene } from "@/components/three-scene"
import { StatsPanel } from "@/components/stats-panel"
import { BlockExplorer } from "@/components/block-explorer"
import { SearchModal } from "@/components/search-modal"
import { DonationQR } from "@/components/donation-qr"
import { SocialLink } from "@/components/social-link"
import { SearchBar } from "@/components/search-bar"
import { NetworkStats } from "@/components/network-stats"

export default function Home({ initialQuery }: { initialQuery?: string }) {
  const [isSearchOpen, setIsSearchOpen] = useState(!!initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery || "")
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery)
      setIsSearchOpen(true)
    } else {
      setSearchQuery("")
      setIsSearchOpen(false)
    }
  }, [initialQuery])

  const fetchCurrentBlockHeight = useCallback(async () => {
    try {
      const heightRes = await fetch("https://mempool.space/api/blocks/tip/height")
      const blockHeight = await heightRes.text()
      setCurrentBlockHeight(Number.parseInt(blockHeight, 10))
    } catch (error) {
      console.error("Error fetching current block height:", error)
    }
  }, [])

  useEffect(() => {
    fetchCurrentBlockHeight()
    const interval = setInterval(fetchCurrentBlockHeight, 60000)
    return () => clearInterval(interval)
  }, [fetchCurrentBlockHeight])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Background */}
      <ThreeScene />

      <NetworkStats />

      {/* Social Link - Now positioned below donation QR on the right */}
      <SocialLink />

      {/* Stats Panels - Pass currentBlockHeight */}
      <StatsPanel blockHeight={currentBlockHeight} />

      {/* Block Explorer - Pass currentBlockHeight */}
      <BlockExplorer currentHeight={currentBlockHeight} />

      {/* Search Bar */}
      <SearchBar />

      {/* Donation QR */}
      <DonationQR />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => router.push("/")} query={searchQuery} />
    </div>
  )
}
