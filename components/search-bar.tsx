"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl px-4">
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex p-4 space-x-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TxID or Bitcoin Address"
            className="flex-1 bg-black/50 border-orange-500/50 text-white placeholder-gray-400 focus:border-orange-400"
            autoComplete="off"
            data-1p-ignore
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-semibold"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>
    </div>
  )
}
