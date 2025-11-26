"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThreeScene } from "@/components/three-scene"
import { StatsPanel } from "@/components/stats-panel"
import { BlockExplorer } from "@/components/block-explorer"
import { SearchModal } from "@/components/search-modal"
import { CashuDonation } from "@/components/cashu-donation"

import { SearchBar } from "@/components/search-bar"
import { NetworkStats } from "@/components/network-stats"
import { useCurrentHeight } from "@/hooks/use-bitcoin-data"
import { useMempoolWebSocket } from "@/hooks/use-websocket"

export default function Home({ initialQuery }: { initialQuery?: string }) {
  const [isSearchOpen, setIsSearchOpen] = useState(!!initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery || "")
  const router = useRouter()

  // Get current block height from React Query (updated via WebSocket)
  const { data: currentBlockHeight = 0 } = useCurrentHeight()

  // Enable WebSocket for real-time updates
  const wsStatus = useMempoolWebSocket()

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery)
      setIsSearchOpen(true)
    } else {
      setSearchQuery("")
      setIsSearchOpen(false)
    }
  }, [initialQuery])

  // Log WebSocket status (optional, can be removed in production)
  useEffect(() => {
    if (wsStatus.isConnected) {
      console.log("🟢 WebSocket connected - receiving real-time updates")
    }
  }, [wsStatus.isConnected])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Background */}
      <ThreeScene />

      <NetworkStats />



      {/* Stats Panels - Pass currentBlockHeight */}
      <StatsPanel blockHeight={currentBlockHeight} />

      {/* Block Explorer - Pass currentBlockHeight */}
      <BlockExplorer currentHeight={currentBlockHeight} />

      {/* Search Bar */}
      <SearchBar />

      {/* Cashu Lightning Donation */}
      <CashuDonation />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => router.push("/")} query={searchQuery} />
    </div>
  )
}
