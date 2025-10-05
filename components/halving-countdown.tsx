"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface HalvingData {
  progressPercent: number
  blocksRemaining: number
  estimatedDate: string
  newSubsidy: number
}

export function HalvingCountdown() {
  const [data, setData] = useState<HalvingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHalvingData = async () => {
      try {
        // Get current block height
        const heightRes = await fetch("https://mempool.space/api/blocks/tip/height")
        const currentHeight = Number.parseInt(await heightRes.text(), 10)

        // Calculate halving data
        const halvingInterval = 210000
        const currentHalvingEpoch = Math.floor(currentHeight / halvingInterval)
        const nextHalvingBlock = (currentHalvingEpoch + 1) * halvingInterval
        const blocksRemaining = nextHalvingBlock - currentHeight
        const blocksSinceLastHalving = currentHeight - currentHalvingEpoch * halvingInterval
        const progressPercent = (blocksSinceLastHalving / halvingInterval) * 100

        // Calculate new subsidy (starts at 50 BTC, halves each epoch)
        const currentSubsidy = 50 / Math.pow(2, currentHalvingEpoch)
        const newSubsidy = currentSubsidy / 2

        // Estimate date (assuming 10 minute blocks)
        const minutesRemaining = blocksRemaining * 10
        const estimatedDate = new Date(Date.now() + minutesRemaining * 60 * 1000)
        const now = new Date()
        const yearsUntil = Math.floor((estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365))
        const daysUntil = Math.floor(((estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) % 365)
        const dateString = estimatedDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        setData({
          progressPercent,
          blocksRemaining,
          estimatedDate: `${dateString} (In ~${yearsUntil} years, ${daysUntil} days)`,
          newSubsidy,
        })
        setLoading(false)
      } catch (error) {
        console.error("Error fetching halving data:", error)
        setLoading(false)
      }
    }

    fetchHalvingData()
    const interval = setInterval(fetchHalvingData, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
        <div className="text-orange-400 text-sm font-semibold mb-3">Halving Countdown</div>
        <div className="text-gray-400 text-xs">Loading...</div>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
      <div className="text-orange-400 text-sm font-semibold mb-3">Halving Countdown</div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${data.progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">{data.progressPercent.toFixed(2)}% complete</div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">New subsidy</span>
          <span className="text-white font-medium">{data.newSubsidy.toFixed(3)} BTC</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Blocks remaining</span>
          <span className="text-white font-medium">{data.blocksRemaining.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Estimated date</span>
          <span className="text-white font-medium text-right">{data.estimatedDate}</span>
        </div>
      </div>
    </Card>
  )
}
