"use client"

import React, { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { SearchBar } from "@/components/search-bar"

// Opt out of static pre-render to avoid build-time execution of client widgets
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const ThreeScene = dynamic(() => import("@/components/three-scene").then(m => m.ThreeScene), { ssr: false })
const StatsPanel = dynamic(() => import("@/components/stats-panel").then(m => m.StatsPanel), { ssr: false })
const BlockExplorer = dynamic(() => import("@/components/block-explorer").then(m => m.BlockExplorer), { ssr: false })
const DonationQR = dynamic(() => import("@/components/donation-qr").then(m => m.DonationQR), { ssr: false })
const SocialLink = dynamic(() => import("@/components/social-link").then(m => m.SocialLink), { ssr: false })
const NetworkStats = dynamic(() => import("@/components/network-stats").then(m => m.NetworkStats), { ssr: false })
const SearchModal = dynamic(() => import("@/components/search-modal").then(m => m.SearchModal), { ssr: false })

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
    if (typeof window !== "undefined") {
      const next = `/${encodeURIComponent(clean)}`
      if (window.location.pathname !== next) {
        window.history.pushState({}, "", next)
      }
    }
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsSearchOpen(false)
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

  // Pull the current block height (client-side only)
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
      <ThreeScene />
      <SocialLink />
      <StatsPanel />
      <NetworkStats />
      <BlockExplorer currentHeight={currentBlockHeight} />
      <SearchBar onSearch={openSearchFor} initialQuery={searchQuery} />
      <DonationQR />
      <SearchModal isOpen={isSearchOpen} onClose={handleCloseModal} query={searchQuery} />
    </div>
  )
}
