"use client"

import React, { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ThreeScene } from "@/components/three-scene"
import { StatsPanel } from "@/components/stats-panel"
import { BlockExplorer } from "@/components/block-explorer"
import { DonationQR } from "@/components/donation-qr"
import { SocialLink } from "@/components/social-link"
import { SearchBar } from "@/components/search-bar"
import { NetworkStats } from "@/components/network-stats"

const SearchModal = dynamic(
  () => import("@/components/search-modal").then((m) => m.SearchModal),
  { ssr: false }
)

type HomeProps = {
  /** When rendered via /[slug], we pass that slug in to auto-search & prefill the input. */
  initialQuery?: string
}

export default function Home({ initialQuery }: HomeProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "")
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)

  // Keep URL as /<query> when searching, for easy sharing.
  const openSearchFor = useCallback((q: string) => {
    const clean = (q || "").trim()
    if (!clean) return
    setSearchQuery(clean)
    setIsSearchOpen(true)
    // Update the URL without leaving the page. Dynamic route is also provided for hard reloads.
    if (typeof window !== "undefined") {
      const next = `/${encodeURIComponent(clean)}`
      if (window.location.pathname !== next) {
        window.history.pushState({}, "", next)
      }
    }
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsSearchOpen(false)
    // Restore the base URL
    if (typeof window !== "undefined") {
      if (window.location.pathname !== "/") {
        window.history.pushState({}, "", "/")
      }
    }
  }, [])

  // If we land directly on /<slug>, open the search automatically.
  useEffect(() => {
    const pathPart = typeof window !== "undefined"
      ? window.location.pathname.replace(/^\/+|\/+$/g, "")
      : ""
    const value = (initialQuery && initialQuery.trim().length > 0) ? initialQuery : pathPart
    if (value && value !== "favicon.ico" && !isSearchOpen) {
      setSearchQuery(value)
      setTimeout(() => openSearchFor(value), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch the current block height periodically so the explorer can align its cursor.
  useEffect(() => {
    let cancelled = false
    async function loadTip() {
      try {
        const res = await fetch("https://mempool.space/api/blocks/tip/height")
        if (!res.ok) return
        const txt = await res.text()
        const n = parseInt(txt, 10)
        if (!cancelled && Number.isFinite(n)) setCurrentBlockHeight(n)
      } catch {}
    }
    loadTip()
    const id = setInterval(loadTip, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* 3D Scene */}
      <ThreeScene />

      {/* Social Links */}
      <SocialLink />

      {/* Stats (price, mempool, etc.) */}
      <StatsPanel />

      {/* Difficulty & Halving */}
      <NetworkStats />

      {/* Block Explorer - Pass currentBlockHeight */}
      <BlockExplorer currentHeight={currentBlockHeight} />

      {/* Search Bar (prefilled when deep linking) */}
      <SearchBar onSearch={openSearchFor} initialQuery={searchQuery} />

      {/* Donation QR */}
      <DonationQR />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={handleCloseModal} query={searchQuery} />
    </div>
  )
}
