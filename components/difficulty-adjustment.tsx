"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface DifficultyData {
  progressPercent: number
  difficultyChange: number
  previousChange: number
  averageBlockTime: number
  estimatedRetarget: string
  blocksIntoEpoch: number
}

export function DifficultyAdjustment() {
  const [data, setData] = useState<DifficultyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDifficultyData = async () => {
      try {
        const response = await fetch("https://mempool.space/api/v1/difficulty-adjustment")
        const diffData = await response.json()

        // Calculate progress percentage (out of 2016 blocks per epoch)
        const blocksIntoEpoch = (diffData.progressPercent * 2016) / 100
        const progressPercent = (blocksIntoEpoch / 2016) * 100

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

        setData({
          progressPercent: diffData.progressPercent,
          difficultyChange: diffData.difficultyChange,
          previousChange: diffData.previousRetarget || 0,
          averageBlockTime: diffData.timeAvg / 60000,
          estimatedRetarget: `In ~${daysUntil} days (${timeString})`,
          blocksIntoEpoch: Math.round(blocksIntoEpoch),
        })
        setLoading(false)
      } catch (error) {
        console.error("Error fetching difficulty data:", error)
        setLoading(false)
      }
    }

    fetchDifficultyData()
    const interval = setInterval(fetchDifficultyData, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return (
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
        <div className="text-orange-400 text-sm font-semibold mb-3">Difficulty Adjustment</div>
        <div className="text-gray-400 text-xs">Loading...</div>
      </Card>
    )
  }

  // Calculate the extended bar color and value
  const baseProgress = (data.blocksIntoEpoch / 2016) * 100
  const isAhead = data.difficultyChange > 0
  const extensionPercent = Math.abs(data.difficultyChange) * 0.5 // Scale for visual effect

  return (
    <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm p-4">
      <div className="text-orange-400 text-sm font-semibold mb-3">Difficulty Adjustment</div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          {/* Base blue progress */}
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
        <div className="text-xs text-gray-400 mt-1">{data.blocksIntoEpoch} / 2016 blocks</div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Average block time</span>
          <span className="text-white font-medium">~{data.averageBlockTime.toFixed(1)} minutes</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Difficulty change</span>
          <span className={`font-medium ${data.difficultyChange > 0 ? "text-green-400" : "text-red-400"}`}>
            {data.difficultyChange > 0 ? "+" : ""}
            {data.difficultyChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Previous</span>
          <span className={`font-medium ${data.previousChange > 0 ? "text-green-400" : "text-red-400"}`}>
            {data.previousChange > 0 ? "+" : ""}
            {data.previousChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Next retarget</span>
          <span className="text-white font-medium text-right">{data.estimatedRetarget}</span>
        </div>
      </div>
    </Card>
  )
}
