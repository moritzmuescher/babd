"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      if (/^[0-9a-fA-F]{64}$/.test(trimmedQuery)) {
        router.push(`/tx/${trimmedQuery}`)
      } else if (/^(1|3|bc1)/.test(trimmedQuery)) {
        router.push(`/address/${trimmedQuery}`)
      } else {
        // Fallback for other queries, or show an error
        router.push(`/${trimmedQuery}`)
      }
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl px-2">
      <div>
        <div className="search-bar-container">
          <div className="search-bar-glow">
            <div className="search-bar-inner">
              <form onSubmit={handleSubmit} className="flex items-center p-1">
                <span className="text-orange-400 text-2xl font-mono pl-5 pr-3 select-none">&gt;</span>
                <Input
                  type="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Input TxID or Address and press <Enter>"
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-gray-400 transition-all duration-300 text-xl font-mono px-2 py-6 caret-orange-400"
                  autoComplete="off"
                  data-1p-ignore
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
