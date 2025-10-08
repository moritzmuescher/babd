"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl px-2">
      <div className="search-bar-container">
        <div className="search-bar-glow">
          <div className="search-bar-inner">
            <form onSubmit={handleSubmit} className="flex p-2 space-x-2">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Lookup TxID or Bitcoin Address..."
                className="flex-1 bg-black/30 border-orange-500/40 text-white placeholder-gray-300 focus:border-orange-400 search-input-glow transition-all duration-300 text-sm font-medium px-3 py-2"
                autoComplete="off"
                data-1p-ignore
              />
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
