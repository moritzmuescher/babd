"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface DifficultyData {
  progressPercent: number
  difficultyChange: number
  previousChange: number
  averageBlockTime: number
  estimatedRetarget: string
  blocksIntoEpoch: number
}

interface HalvingData {
  progressPercent: number
  blocksRemaining: number
  estimatedDate: string
  newSubsidy: number
}

export function NetworkStats() {
  const [difficultyData, setDifficultyData] = useState<DifficultyData | null>(null)
  const [halvingData, setHalvingData] = useState<HalvingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch difficulty data
        const diffResponse = await fetch("https://mempool.space/api/v1/difficulty-adjustment")
        const diffData = await diffResponse.json()

        const blocksIntoEpoch = (diffData.progressPercent * 2016) / 100
        const retargetDate = new Date(diffData.estimatedRetargetDate)
        const now = new Date()
        const msUntil = retargetDate.getTime() - now.getTime()
        const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24))

        const timeString = retargetDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })

        setDifficultyData({
          progressPercent: diffData.progressPercent,
          difficultyChange: diffData.difficultyChange,
          previousChange: diffData.previousRetarget || 0,
          averageBlockTime: diffData.timeAvg / 60000,
          estimatedRetarget: `In ~${daysUntil} days (${timeString})`,
          blocksIntoEpoch: Math.round(blocksIntoEpoch),
        })

        // Fetch halving data
        const heightRes = await fetch("https://mempool.space/api/blocks/tip/height")
        const currentHeight = Number.parseInt(await heightRes.text(), 10)

        const halvingInterval = 210000
        const currentHalvingEpoch = Math.floor(currentHeight / halvingInterval)
        const nextHalvingBlock = (currentHalvingEpoch + 1) * halvingInterval
        const blocksRemaining = nextHalvingBlock - currentHeight
        const blocksSinceLastHalving = currentHeight - currentHalvingEpoch * halvingInterval
        const progressPercent = (blocksSinceLastHalving / halvingInterval) * 100

        const currentSubsidy = 50 / Math.pow(2, currentHalvingEpoch)
        const newSubsidy = currentSubsidy / 2

        const minutesRemaining = blocksRemaining * 10
        const estimatedDate = new Date(Date.now() + minutesRemaining * 60 * 1000)
        const yearsUntil = Math.floor((estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365))
        const daysUntil2 = Math.floor(((estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) % 365)
        const dateString = estimatedDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        setHalvingData({
          progressPercent,
          blocksRemaining,
          estimatedDate: `${dateString} (In ~${yearsUntil} years, ${daysUntil2} days)`,
          newSubsidy,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching network stats:", error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !difficultyData || !halvingData) {
    return (
      <div className="absolute top-32 right-4 md:top-1/2 md:transform md:-translate-y-1/2 z-10 w-full md:w-auto md:max-w-xs p-4 md:p-0">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
          <div className="text-gray-400 text-xs">Loading...</div>
        </Card>
      </div>
    )
  }

  const baseProgress = (difficultyData.blocksIntoEpoch / 2016) * 100
  const isAhead = difficultyData.difficultyChange > 0
  const extensionPercent = Math.abs(difficultyData.difficultyChange) * 0.5

  return (
    <div className="absolute top-32 right-4 md:top-1/2 md:transform md:-translate-y-1/2 z-10 w-full md:w-auto md:max-w-xs p-4 md:p-0">
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
        {/* Difficulty Adjustment Section */}
        <div className="mb-4">
          <div className="text-orange-400 text-sm font-semibold mb-3">Difficulty Adjustment</div>

          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(baseProgress, 100)}%` }}
              />
              {baseProgress < 100 && (
                <div
                  className={`h-3 ${isAhead ? "bg-green-500" : "bg-red-500"} transition-all duration-500 inline-block`}
                  style={{
                    width: `${Math.min(extensionPercent, 100 - baseProgress)}%`,
                  }}
                />
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">{difficultyData.blocksIntoEpoch} / 2016 blocks</div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average block time</span>
              <span className="text-white font-medium">~{difficultyData.averageBlockTime.toFixed(1)} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Difficulty change</span>
              <span
                className={`font-medium ${difficultyData.difficultyChange > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {difficultyData.difficultyChange > 0 ? "+" : ""}
                {difficultyData.difficultyChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Previous</span>
              <span className={`font-medium ${difficultyData.previousChange > 0 ? "text-green-400" : "text-red-400"}`}>
                {difficultyData.previousChange > 0 ? "+" : ""}
                {difficultyData.previousChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Next retarget</span>
              <span className="text-white font-medium text-right">{difficultyData.estimatedRetarget}</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-4 bg-orange-500/25" />

        {/* Halving Countdown Section */}
        <div>
          <div className="text-orange-400 text-sm font-semibold mb-3">Halving Countdown</div>

          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${halvingData.progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">{halvingData.progressPercent.toFixed(2)}% complete</div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New subsidy</span>
              <span className="text-white font-medium">{halvingData.newSubsidy.toFixed(3)} BTC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Blocks remaining</span>
              <span className="text-white font-medium">{halvingData.blocksRemaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated date</span>
              <span className="text-white font-medium text-right">{halvingData.estimatedDate}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
