"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { CyberBrackets } from "@/components/ui/cyber-brackets"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useDifficultyData, useHalvingData } from "@/hooks/use-bitcoin-data"
import { motion } from "framer-motion"
import { NetworkStatsModal } from "@/components/network-stats-modal"
import { MiningStatsModal } from "@/components/mining-stats-modal"
import { BarChart3 } from "lucide-react"

export function NetworkStats() {
  const { data: difficultyData, isLoading: difficultyLoading, error: difficultyError } = useDifficultyData()
  const { data: halvingData, isLoading: halvingLoading, error: halvingError } = useHalvingData()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMiningModalOpen, setIsMiningModalOpen] = useState(false)

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

  return (
    <>
      <div className={`absolute left-4 ${isDesktop ? "bottom-[18rem]" : "bottom-[22rem]"} @[@media(min-height:1000px)]:top-1/2 @[@media(min-height:1000px)]:-translate-y-1/2 @[@media(min-height:1000px)]:bottom-auto min-[2000px]:top-1/2 min-[2000px]:-translate-y-1/2 min-[2000px]:bottom-auto z-5`}>
        <motion.div
          className="max-w-xs height-responsive-scale cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="hud-panel-left">
            {isDesktop ? (
              <CyberBrackets>
                <Card className="frosted-glass scanline-container p-4 hover:bg-orange-500/10 transition-colors">
                  <StatsContent
                    difficultyData={difficultyData}
                    halvingData={halvingData}
                    baseProgress={baseProgress}
                    isAhead={isAhead}
                    extensionPercent={extensionPercent}
                    onOpenMiningModal={() => setIsMiningModalOpen(true)}
                  />
                </Card>
              </CyberBrackets>
            ) : (
              <Card className="frosted-glass p-2 hover:bg-orange-500/10 transition-colors">
                <StatsContent
                  difficultyData={difficultyData}
                  halvingData={halvingData}
                  baseProgress={baseProgress}
                  isAhead={isAhead}
                  extensionPercent={extensionPercent}
                  onOpenMiningModal={() => setIsMiningModalOpen(true)}
                />
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      <NetworkStatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        difficultyData={difficultyData}
        halvingData={halvingData}
      />

      <MiningStatsModal
        isOpen={isMiningModalOpen}
        onClose={() => setIsMiningModalOpen(false)}
      />
    </>
  )
}

function StatsContent({ difficultyData, halvingData, baseProgress, isAhead, extensionPercent, onOpenMiningModal }: any) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Difficulty Adjustment Section */}
      <div className="mb-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-orange-400 text-xs font-semibold">Difficulty Adjustment</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenMiningModal()
            }}
            className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:text-orange-300 transition-all p-1.5 rounded-md border border-orange-500/30 hover:border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            title="View Hashrate & Difficulty Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-2">
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden relative">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(baseProgress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {baseProgress < 100 && (
              <motion.div
                className={`h-full ${isAhead ? "bg-green-500" : "bg-red-500"} inline-block absolute top-0`}
                style={{ left: `${baseProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(extensionPercent, 100 - baseProgress)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
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

      <Separator className="my-2 bg-orange-500/25" />

      {/* Halving Countdown Section */}
      <div>
        <div className="text-orange-400 text-xs font-semibold mb-2">Halving Countdown</div>

        {/* Progress Bar */}
        <div className="relative mb-2">
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${halvingData.progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
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
  )
}