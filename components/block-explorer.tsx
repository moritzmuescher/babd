"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// Loader2 is no longer needed if Load More is removed, but keeping it for now as it might be used elsewhere or for future features.
// import { Loader2 } from 'lucide-react'
import { BlockDetailsModal } from "@/components/block-details-modal"
import { ProjectedBlockDetailsModal } from "@/components/projected-block-details-modal"

interface Block {
  height: number
  size: number
  tx_count: number
  timestamp: number
  id: string
  weight: number
  extras?: {
    totalFees: number
  }
}

interface ProjectedBlock {
  blockSize: number
  nTx: number
  feeRange: number[]
}

interface BlockExplorerProps {
  currentHeight: number // Accept currentHeight as a prop
}

const MAX_BLOCK_WEIGHT_WU = 4000000
const BYTES_TO_WU_RATIO = 4
// const BLOCKS_TO_LOAD = 10 // No longer needed as "Load More" is removed

export function BlockExplorer({ currentHeight }: BlockExplorerProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [projectedBlocks, setProjectedBlocks] = useState<ProjectedBlock[]>([])
  const [selectedBlockHash, setSelectedBlockHash] = useState<string | null>(null)
  const [selectedProjectedBlock, setSelectedProjectedBlock] = useState<
    (ProjectedBlock & { height: number; estimatedTime: string }) | null
  >(null)
  const [isBlockDetailsModalOpen, setIsBlockDetailsModalOpen] = useState(false)
  const [isProjectedBlockDetailsModalOpen, setIsProjectedBlockDetailsModalOpen] = useState(false)
  // Removed oldestFetchedBlockHeight, isLoadingMore, showLoadMorePast states
  // const [oldestFetchedBlockHeight, setOldestFetchedBlockHeight] = useState<number | null>(null)
  // const [isLoadingMore, setIsLoadingMore] = useState(false)
  // const [showLoadMorePast, setShowLoadMorePast] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)
  const hasUserScrolledRef = useRef(false)const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [oldestHeight, setOldestHeight] = useState<number | null>(null)
  const isInitialCenteringDone = useRef(false)

  

  // Removed handleScroll and loadMorePastBlocks as they are no longer needed

  // Load older blocks (older = lower height)
  const loadOlderBlocks = useCallback(async (count: number = 10) => {
    if (isLoadingMore) return
    try {
      setIsLoadingMore(true)
      const currentOldest = oldestHeight ?? (blocks.length ? blocks[blocks.length - 1].height : null)
      if (!currentOldest) return
      // mempool.space returns 10 blocks starting from a given height (older)
      // We subtract 1 to avoid duplicating the current oldest
      const start = currentOldest - 1
      const res = await fetch(`https://mempool.space/api/blocks/${start}`)
      if (!res.ok) {
        console.error("Failed to fetch older blocks:", res.status, res.statusText)
        return
      }
      const olderData: Block[] = await res.json()
      // Optional: limit to 'count'
      const needed = olderData.slice(0, count)
      // Fetch weights for each
      const withWeights: Block[] = await Promise.all(
        needed.map(async (block: Block) => {
          try {
            const blockDetailRes = await fetch(`https://mempool.space/api/block/${block.id}`)
            if (!blockDetailRes.ok) return { ...block, weight: 0 }
            const blockDetail = await blockDetailRes.json()
            const weight = typeof blockDetail.weight === "number" ? blockDetail.weight : 0
            return { ...block, weight }
          } catch {
            return { ...block, weight: 0 }
          }
        })
      )
      setBlocks((prev) => [...prev, ...withWeights])
      const newOldest = withWeights.length ? withWeights[withWeights.length - 1].height : currentOldest
      setOldestHeight(newOldest)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, oldestHeight, blocks.length])// const handleScroll = useCallback(() => { ... }, [...])
  // const loadMorePastBlocks = useCallback(async () => { ... }, [...])

  const fetchBlocksForCurrentHeight = useCallback(
    async (height: number) => {
      if (height === 0) return // Don't fetch if height is not yet available

      try {
        const [blocksRes, projectedRes] = await Promise.all([
          fetch("https://mempool.space/api/blocks"), // Gets 10 most recent blocks
          fetch("https://mempool.space/api/v1/fees/mempool-blocks"),
        ])

        const blocksData = await blocksRes.json()
        const projectedData = await projectedRes.json()

        let blocksWithWeight = await Promise.all(
          blocksData.map(async (block: Block) => {
            try {
              const blockDetailRes = await fetch(`https://mempool.space/api/block/${block.id}`)
              if (!blockDetailRes.ok) {
                console.error(
                  `Failed to fetch block details for block ${block.height}: ${blockDetailRes.status} ${blockDetailRes.statusText}`,
                )
                return { ...block, weight: 0 } // Return with default weight on failure
              }
              const blockDetail = await blockDetailRes.json()
              // Ensure weight is a number, default to 0 if not
              const weight = typeof blockDetail.weight === "number" ? blockDetail.weight : 0
              if (typeof blockDetail.weight !== "number") {
                console.warn(`Block ${block.height} weight is not a number:`, blockDetail.weight)
              }
              return { ...block, weight: weight }
            } catch (error) {
              console.error(`Error fetching weight for block ${block.height}:`, error)
              return { ...block, weight: 0 }
            }
          }),
        )

        setBlocks(blocksWithWeight)
        setProjectedBlocks(projectedData)
        // Removed setOldestFetchedBlockHeight
        // setOldestFetchedBlockHeight(blocksWithWeight[blocksWithWeight.length - 1]?.height || null)

        // Initial centering logic - runs only once per new height
        // Reset isInitialCenteringDone if height changes to re-center
        if (isInitialCenteringDone.current === false || blocksWithWeight[0]?.height !== height) {
          isProgrammaticScrollRef.current = true
          const timer = requestAnimationFrame(() => {
            if (scrollRef.current) {
              const currentBlockElement = scrollRef.current.querySelector(".current-block")
              if (currentBlockElement) {
                const containerWidth = scrollRef.current.clientWidth
                const elementLeft = (currentBlockElement as HTMLElement).offsetLeft
                const elementWidth = (currentBlockElement as HTMLElement).offsetWidth
                scrollRef.current.scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2
                isInitialCenteringDone.current = true // Mark as done for this height
                // Allow lazy-load again on next user scroll
                requestAnimationFrame(() => { isProgrammaticScrollRef.current = false })
                // Removed handleScroll() call
              }
            }
          }, 100)
          return () => cancelAnimationFrame(timer)
        }
      } catch (error) {
        console.error("Error fetching blocks for current height:", error)
      }
    },
    [], // No dependencies needed for this useCallback as handleScroll is removed
  )

  // Effect for periodic projected blocks update (currentHeight is now from prop)
  useEffect(() => {
    const fetchProjectedBlocksPeriodically = async () => {
      try {
        const projectedRes = await fetch("https://mempool.space/api/v1/fees/mempool-blocks")
        const projectedData = await projectedRes.json()
        setProjectedBlocks(projectedData)
      } catch (error) {
        console.error("Error fetching projected blocks periodically:", error)
      }
    }

    fetchProjectedBlocksPeriodically() // Fetch immediately
    const interval = setInterval(fetchProjectedBlocksPeriodically, 30000) // Update projected blocks more frequently (e.g., every 30 seconds)
    return () => clearInterval(interval)
  }, [])

  // Effect to re-fetch blocks whenever currentHeight prop changes
  useEffect(() => {
    if (currentHeight > 0) {
      fetchBlocksForCurrentHeight(currentHeight)
      isInitialCenteringDone.current = false // Reset centering flag when height changes
      isProgrammaticScrollRef.current = true
      hasUserScrolledRef.current = false
    }
  }, [currentHeight, fetchBlocksForCurrentHeight])

  // Removed dedicated useEffect for scroll listener
  // useEffect(() => { ... }, [...])

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diffMinutes = Math.round((now - timestamp * 1000) / 60000)
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      const diffHours = Math.round(diffMinutes / 60)
      return `${diffHours}h ago`
    }
  }

  const getEstimatedTime = (indexInReversedArray: number) => {
    return `~${(projectedBlocks.length - indexInReversedArray) * 10}m`
  }

  const getAverageFeeRate = (feeRange: number[]) => {
    if (!feeRange || feeRange.length === 0) return "~1"
    const sortedFees = [...feeRange].sort((a, b) => a - b)
    const median = sortedFees[Math.floor(sortedFees.length / 2)]
    return `~${Math.round(median)}`
  }

  // Linear interpolation helper
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Function to get interpolated HSL color based on fee rate
  const getInterpolatedFeeColor = (feeRate: number, alpha = 1) => {
    let hue: number
    const saturation = 70
    const lightness = 50

    if (feeRate <= 1) {
      hue = 140
    } else if (feeRate <= 5) {
      const t = (feeRate - 1) / (5 - 1)
      hue = lerp(140, 90, t)
    } else if (feeRate <= 10) {
      const t = (feeRate - 5) / (10 - 5)
      hue = lerp(90, 60, t)
    } else if (feeRate <= 20) {
      const t = (feeRate - 10) / (20 - 10)
      hue = lerp(60, 30, t)
    } else if (feeRate <= 50) {
      const t = (feeRate - 20) / (50 - 20)
      hue = lerp(30, 0, t)
    } else {
      hue = 0
    }

    return `hsla(${Math.round(hue)}, ${saturation}%, ${lightness}%, ${alpha})`
  }

  const handleProjectedBlockClick = (proj: ProjectedBlock, index: number) => {
    const futureHeight = currentHeight + (projectedBlocks.length - index)
    setSelectedProjectedBlock({ ...proj, height: futureHeight, estimatedTime: getEstimatedTime(index) })
    setIsProjectedBlockDetailsModalOpen(true)
  }

  const handleBlockClick = (block: Block) => {
    setSelectedBlockHash(block.id)
    setIsBlockDetailsModalOpen(true)
  }

  const handleCloseBlockDetailsModal = () => {
    setIsBlockDetailsModalOpen(false)
    setSelectedBlockHash(null)
  }

  const handleCloseProjectedBlockDetailsModal = () => {
    setIsProjectedBlockDetailsModalOpen(false)
    setSelectedProjectedBlock(null)
  }

  return (
    <>
      <div className="absolute top-20 md:top-32 left-0 right-0 w-full z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm relative">
          {/* Left Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          {/* Right Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto p-4 space-x-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-transparent"
            
          >
            <div className="flex space-x-4" style={{ direction: "ltr" }}>
              {/* Sentinel for older blocks (right boundary of past) */}
              <div ref={olderSentinelRef} className="w-px h-1" />
              {/* Future projected blocks - rightmost, reversed order */}
              {projectedBlocks
                .slice()
                .reverse()
                .map((proj, index) => {
                  const futureHeight = currentHeight + (projectedBlocks.length - index)
                  const estimatedWeightWU = proj.blockSize * BYTES_TO_WU_RATIO
                  const weightPercentage = estimatedWeightWU
                    ? Math.min((estimatedWeightWU / MAX_BLOCK_WEIGHT_WU) * 100, 100)
                    : 0

                  const estimatedFeeRate = Number.parseFloat(getAverageFeeRate(proj.feeRange).replace("~", ""))
                  const interpolatedFillColor = getInterpolatedFeeColor(estimatedFeeRate, 0.4) // 40% opacity for fill
                  const interpolatedTextColor = getInterpolatedFeeColor(estimatedFeeRate) // Full opacity for text and badge

                  return (
                    <div
                      key={futureHeight}
                      onClick={() => handleProjectedBlockClick(proj, index)}
                      className="relative flex-shrink-0 p-3 rounded-lg text-center min-w-[100px] cursor-pointer overflow-hidden hover:scale-105 transition-all duration-200"
                      title={`Click to view estimated details for future block ${futureHeight}`}
                    >
                      {/* Dynamic fill layer for future blocks */}
                      <div
                        className="absolute bottom-0 left-0 w-full transition-all duration-300"
                        style={{ height: `${weightPercentage}%`, backgroundColor: interpolatedFillColor }}
                      ></div>
                      {/* Content layer */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <div className="text-xl font-bold mb-1" style={{ color: interpolatedTextColor }}>
                            {futureHeight}
                          </div>
                          <div className="text-xs text-white space-y-1">
                            <div>{(proj.blockSize / 1000000).toFixed(2)} MB</div>
                            <div>{proj.nTx.toLocaleString()} TX</div>
                            <div className="text-gray-400">{getAverageFeeRate(proj.feeRange)} sat/vB</div>
                          </div>
                        </div>
                        <Badge
                          className="mt-2 text-white text-xs self-center"
                          style={{ backgroundColor: interpolatedTextColor }}
                        >
                          in {getEstimatedTime(index)}
                        </Badge>
                      </div>
                    </div>
                  )
                })}

              {/* Past blocks - newest to oldest (right to left) */}
              {blocks.map((block) => {
                const weightPercentage = block.weight ? Math.min((block.weight / MAX_BLOCK_WEIGHT_WU) * 100, 100) : 0
                return (
                  <div
                    key={block.height}
                    onClick={() => handleBlockClick(block)}
                    className={`relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden hover:scale-105 transition-all duration-200 ${block.height === currentHeight // Use prop here
                        ? "border-blue-400 bg-black/50 shadow-lg shadow-blue-500/30 current-block hover:shadow-blue-500/50"
                        : "border-blue-500/30 bg-black/50 hover:border-blue-400/50 hover:bg-black/50"
                      }`}
                    title={`Click to view details for block ${block.height}`}
                  >
                    {/* Blue fill layer */}
                    <div
                      className="absolute bottom-0 left-0 w-full bg-blue-500/40 transition-all duration-300"
                      style={{ height: `${weightPercentage}%` }}
                    ></div>
                    {/* Content layer */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="text-xl font-bold text-blue-400 mb-1">{block.height}</div>
                        <div className="text-xs text-white space-y-1">
                          <div>{(block.size / 1000000).toFixed(2)} MB</div>
                          <div className="text-gray-400">
                            {block.weight ? `${(block.weight / 1000000).toFixed(2)} MWU` : "-- MWU"}
                          </div>
                          <div>{block.tx_count.toLocaleString()} TX</div>
                        </div>
                      </div>
                      <Badge className="mt-2 bg-blue-500 text-white text-xs self-center">
                        {formatTimeAgo(block.timestamp)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {/* The "Load More Past Blocks" div has been removed */}
            </div>
          </div>
        </Card>
      </div>

      {/* Block Details Modal for existing blocks */}
      <BlockDetailsModal
        isOpen={isBlockDetailsModalOpen}
        onClose={handleCloseBlockDetailsModal}
        blockHash={selectedBlockHash}
      />

      {/* Projected Block Details Modal for future blocks */}
      <ProjectedBlockDetailsModal
        isOpen={isProjectedBlockDetailsModalOpen}
        onClose={handleCloseProjectedBlockDetailsModal}
        projectedBlock={selectedProjectedBlock}
      />
    </>
  )
}
