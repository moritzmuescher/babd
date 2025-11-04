"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { CyberBrackets } from "@/components/ui/cyber-brackets"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useDifficultyData, useHalvingData } from "@/hooks/use-bitcoin-data"

export function NetworkStats() {
  const { data: difficultyData, isLoading: difficultyLoading, error: difficultyError } = useDifficultyData()
  const { data: halvingData, isLoading: halvingLoading, error: halvingError } = useHalvingData()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const loading = difficultyLoading || halvingLoading

  if (difficultyError) {
    console.error("Error fetching difficulty data:", difficultyError)
  }

  if (halvingError) {
    console.error("Error fetching halving data:", halvingError)
  }

  if (loading || !difficultyData || !halvingData) {
    return (
      <div className="absolute left-4 top-64 md:top-80 z-10 max-w-xs">
        <Card className="bg-black/30 border-orange-500/25 backdrop-blur-md p-4">
          <div className="text-gray-400 text-xs">Loading...</div>
        </Card>
      </div>
    )
  }

  const baseProgress = (difficultyData.blocksIntoEpoch / 2016) * 100
  const isAhead = difficultyData.difficultyChange > 0
  const extensionPercent = Math.abs(difficultyData.difficultyChange) * 0.5

  if (isDesktop) {
    return (
    <div className="absolute left-4 top-80 z-20 max-w-xs height-responsive-scale">
      <CyberBrackets>
        <Card className="frosted-glass scanline-container p-4">
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
              <span className="text-white font-medium">
                ~<AnimatedNumber
                  value={difficultyData.averageBlockTime}
                  decimals={1}
                  duration={800}
                /> minutes
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Difficulty change</span>
              <span
                className={`font-medium ${difficultyData.difficultyChange > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {difficultyData.difficultyChange > 0 ? "+" : ""}
                <AnimatedNumber
                  value={difficultyData.difficultyChange}
                  decimals={2}
                  duration={800}
                />%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Previous</span>
              <span className={`font-medium ${difficultyData.previousChange > 0 ? "text-green-400" : "text-red-400"}`}>
                {difficultyData.previousChange > 0 ? "+" : ""}
                <AnimatedNumber
                  value={difficultyData.previousChange}
                  decimals={2}
                  duration={800}
                />%
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
              <span className="text-gray-400">Current subsidy</span>
              <span className="text-white font-medium">{halvingData.currentSubsidy} BTC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New subsidy</span>
              <span className="text-white font-medium">
                {halvingData.currentSubsidy === 3.125
                  ? "1.5625 BTC"
                  : `${halvingData.newSubsidy.toFixed(3)} BTC`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Blocks remaining</span>
              <span className="text-white font-medium">
                <AnimatedNumber
                  value={halvingData.blocksRemaining}
                  formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                  duration={800}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated date</span>
              <span className="text-white font-medium text-right">{halvingData.estimatedDate}</span>
            </div>
          </div>
        </div>
      </Card>
      </CyberBrackets>
    </div>
    )
  }

  return (
    <div className="absolute left-0 top-64 z-10 w-full px-4">
      <Card className="frosted-glass p-2">
        <div className="grid grid-cols-1 gap-4">
          {/* Difficulty Adjustment Section */}
          <div className="mb-0">
            <div className="text-orange-400 text-xs font-semibold mb-2">Difficulty Adjustment</div>

            {/* Progress Bar */}
            <div className="relative mb-2">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(baseProgress, 100)}%` }}
                />
                {baseProgress < 100 && (
                  <div
                    className={`h-2 ${isAhead ? "bg-green-500" : "bg-red-500"} transition-all duration-500 inline-block`}
                    style={{
                      width: `${Math.min(extensionPercent, 100 - baseProgress)}%`,
                    }}
                  />
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <AnimatedNumber
                  value={difficultyData.blocksIntoEpoch}
                  formatFn={(val) => Math.floor(val).toString()}
                  duration={800}
                /> / 2016 blocks
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg block time</span>
                <span className="text-white font-medium">
                  ~<AnimatedNumber
                    value={difficultyData.averageBlockTime}
                    decimals={1}
                    duration={800}
                  /> min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Difficulty</span>
                <span
                  className={`font-medium ${difficultyData.difficultyChange > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {difficultyData.difficultyChange > 0 ? "+" : ""}
                  <AnimatedNumber
                    value={difficultyData.difficultyChange}
                    decimals={2}
                    duration={800}
                  />%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Previous</span>
                <span className={`font-medium ${difficultyData.previousChange > 0 ? "text-green-400" : "text-red-400"}`}>
                  {difficultyData.previousChange > 0 ? "+" : ""}
                  <AnimatedNumber
                    value={difficultyData.previousChange}
                    decimals={2}
                    duration={800}
                  />%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Next retarget</span>
                <span className="text-white font-medium text-right">{difficultyData.estimatedRetarget}</span>
              </div>
            </div>
          </div>

          {/* Halving Countdown Section */}
          <div>
            <div className="text-orange-400 text-xs font-semibold mb-2">Halving Countdown</div>

            {/* Progress Bar */}
            <div className="relative mb-2">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                  style={{ width: `${halvingData.progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <AnimatedNumber
                  value={halvingData.progressPercent}
                  decimals={2}
                  duration={800}
                />% complete
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current subsidy</span>
                <span className="text-white font-medium">{halvingData.currentSubsidy} BTC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">New subsidy</span>
                <span className="text-white font-medium">
                  {halvingData.currentSubsidy === 3.125
                    ? "1.5625 BTC"
                    : `${halvingData.newSubsidy.toFixed(3)} BTC`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Blocks remaining</span>
                <span className="text-white font-medium">
                  <AnimatedNumber
                    value={halvingData.blocksRemaining}
                    formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                    duration={800}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Estimated date</span>
                <span className="text-white font-medium text-right">{halvingData.estimatedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}