"use client"

import { useState } from "react"
import { ThreeScene } from "@/components/three-scene"
import { StatsPanel } from "@/components/stats-panel"
import { BlockExplorer } from "@/components/block-explorer"
import { SearchModal } from "@/components/search-modal"
import { DonationQR } from "@/components/donation-qr"
import { SocialLink } from "@/components/social-link"
import { SearchBar } from "@/components/search-bar"

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearchOpen(true)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Background */}
      <ThreeScene />

      {/* Social Link */}
      <SocialLink />

      {/* Stats Panels */}
      <StatsPanel />

      {/* Block Explorer */}
      <BlockExplorer />

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Donation QR */}
      <DonationQR />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} query={searchQuery} />
    </div>
  )
}
