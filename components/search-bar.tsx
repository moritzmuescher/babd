"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  /** Optional: prefill the search input (used for deep links) */
  initialQuery?: string
}

export function SearchBar({ onSearch, initialQuery }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery ?? "")

  useEffect(() => {
    // Keep input in sync if initialQuery changes (e.g., navigating between deep links)
    if (typeof initialQuery === "string" && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = (query || "").trim()
    if (cleaned.length > 0) {
      onSearch(cleaned)
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-2">
      <div className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-lg rounded-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste a TxID or Bitcoin address…"
            className="flex-1"
          />
          <Button type="submit">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </div>
    </div>
  )
}
