"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react" // Re-import Loader2 for the button
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

const MAX_BLOCK_WEIGHT_WU = 4000000
const BYTES_TO_WU_RATIO = 4
const BLOCKS_TO_LOAD = 10 // Number of blocks to load per click

export function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [projectedBlocks, setProjectedBlocks] = useState<ProjectedBlock[]>([])
  const [currentHeight, setCurrentHeight] = useState(0)
  const [selectedBlockHash, setSelectedBlockHash] = useState<string | null>(null)
  const [selectedProjectedBlock, setSelectedProjectedBlock] = useState<
    (ProjectedBlock & { height: number; estimatedTime: string }) | null
  >(null)
  const [isBlockDetailsModalOpen, setIsBlockDetailsModalOpen] = useState(false)
  const [isProjectedBlockDetailsModalOpen, setIsProjectedBlockDetailsModalOpen] = useState(false)
  const [oldestFetchedBlockHeight, setOldestFetchedBlockHeight] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showLoadMorePast, setShowLoadMorePast] = useState(false) // Reintroduced state for button visibility

  const scrollRef = useRef<HTMLDivElement>(null)
  const isInitialCenteringDone = useRef(false)

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) {
      setShowLoadMorePast(false) // Ensure it's hidden if no container
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = container
    const scrollThreshold = 5 // pixels from the edge

    const isContentScrollable = scrollWidth > clientWidth
    const isAtRightmostEnd = scrollLeft <= scrollThreshold // For RTL, 0 is rightmost

    if (isContentScrollable && isAtRightmostEnd && oldestFetchedBlockHeight !== null && oldestFetchedBlockHeight > 1) {
      setShowLoadMorePast(true)
    } else {
      setShowLoadMorePast(false)
    }
  }, [oldestFetchedBlockHeight]) // Dependency on oldestFetchedBlockHeight

  const loadMorePastBlocks = useCallback(async () => {
    if (isLoadingMore || oldestFetchedBlockHeight === null || oldestFetchedBlockHeight <= 1) return // Prevent loading past genesis

    setIsLoadingMore(true)
    try {
      // Fetch blocks starting from (oldestFetchedBlockHeight - 1) downwards
      const response = await fetch(`https://mempool.space/api/v1/blocks/${oldestFetchedBlockHeight - 1}`)
      if (!response.ok) {
        throw new Error("Failed to fetch older blocks")
      }
      const newBlocksData = await response.json()

      const newBlocksWithWeight = await Promise.all(
        newBlocksData.map(async (block: Block) => {
          try {
            const blockDetailRes = await fetch(`https://mempool.space/api/block/${block.id}`)
            if (blockDetailRes.ok) {
              const blockDetail = await blockDetailRes.json()
              return { ...block, weight: blockDetail.weight }
            }
          } catch (error) {
            console.error(`Error fetching weight for block ${block.height}:`, error)
          }
          return { ...block, weight: 0 }
        }),
      )

      setBlocks((prevBlocks) => [...prevBlocks, ...newBlocksWithWeight])
      if (newBlocksWithWeight.length > 0) {
        setOldestFetchedBlockHeight(newBlocksWithWeight[newBlocksWithWeight.length - 1].height)
      }
    } catch (error) {
      console.error("Error loading more past blocks:", error)
    } finally {
      setIsLoadingMore(false)
      // After loading, re-evaluate scroll position to update button visibility
      setTimeout(() => handleScroll(), 50)
    }
  }, [isLoadingMore, oldestFetchedBlockHeight, handleScroll]) // Added handleScroll to dependencies

  const fetchInitialBlocks = useCallback(async () => {
    try {
      const [blocksRes, heightRes, projectedRes] = await Promise.all([
        fetch("https://mempool.space/api/blocks"), // Gets 10 most recent blocks
        fetch("https://mempool.space/api/blocks/tip/height"),
        fetch("https://mempool.space/api/v1/fees/mempool-blocks"),
      ])

      const blocksData = await blocksRes.json()
      const blockHeight = await heightRes.text()
      const projectedData = await projectedRes.json()

      const blocksWithWeight = await Promise.all(
        blocksData.map(async (block: Block) => {
          try {
            const blockDetailRes = await fetch(`https://mempool.space/api/block/${block.id}`)
            if (blockDetailRes.ok) {
              const blockDetail = await blockDetailRes.json()
              return { ...block, weight: blockDetail.weight }
            }
          } catch (error) {
            console.error(`Error fetching weight for block ${block.height}:`, error)
          }
          return { ...block, weight: 0 }
        }),
      )

      setBlocks(blocksWithWeight)
      setCurrentHeight(Number.parseInt(blockHeight, 10))
      setProjectedBlocks(projectedData)
      if (blocksWithWeight.length > 0) {
        setOldestFetchedBlockHeight(blocksWithWeight[blocksWithWeight.length - 1].height)
      }

      // Initial centering logic - runs only once
      if (!isInitialCenteringDone.current && blocksWithWeight.length > 0 && Number.parseInt(blockHeight, 10) > 0) {
        const timer = setTimeout(() => {
          if (scrollRef.current) {
            const currentBlockElement = scrollRef.current.querySelector(".current-block")
            if (currentBlockElement) {
              const containerWidth = scrollRef.current.clientWidth
              const elementLeft = (currentBlockElement as HTMLElement).offsetLeft
              const elementWidth = (currentBlockElement as HTMLElement).offsetWidth
              scrollRef.current.scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2
              isInitialCenteringDone.current = true // Mark as done
              // After centering, explicitly call handleScroll to set initial button visibility
              handleScroll()
            }
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    } catch (error) {
      console.error("Error fetching blocks:", error)
    }
  }, [handleScroll]) // Dependency on handleScroll ensures it uses the latest memoized version

  const handleProjectedBlockClick = useCallback(
    (proj: ProjectedBlock, index: number) => {
      const futureHeight = currentHeight + (projectedBlocks.length - index)
      setSelectedProjectedBlock({ ...proj, height: futureHeight, estimatedTime: getEstimatedTime(index) })
      setIsProjectedBlockDetailsModalOpen(true)
    },
    [currentHeight, projectedBlocks],
  )

  const handleBlockClick = useCallback((block: Block) => {
    setSelectedBlockHash(block.id)
    setIsBlockDetailsModalOpen(true)
  }, [])

  const handleCloseBlockDetailsModal = useCallback(() => {
    setSelectedBlockHash(null)
    setIsBlockDetailsModalOpen(false)
  }, [])

  const handleCloseProjectedBlockDetailsModal = useCallback(() => {
    setSelectedProjectedBlock(null)
    setIsProjectedBlockDetailsModalOpen(false)
  }, [])

  useEffect(() => {
    fetchInitialBlocks()
    const interval = setInterval(fetchInitialBlocks, 60000)
    return () => clearInterval(interval)
  }, [fetchInitialBlocks])

  // Dedicated useEffect for scroll listener
  useEffect(() => {
    const currentScrollRef = scrollRef.current
    if (currentScrollRef) {
      currentScrollRef.addEventListener("scroll", handleScroll)
      // Call handleScroll once after attaching to check initial state
      handleScroll()
      return () => {
        if (currentScrollRef) {
          currentScrollRef.removeEventListener("scroll", handleScroll)
        }
      }
    }
  }, [handleScroll]) // Dependency on handleScroll ensures listener is re-attached if handleScroll changes

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
    const saturation = 70 // Adjusted saturation for a more "Tailwind green" feel
    const lightness = 50 // Keep lightness around 50% for good visibility

    if (feeRate <= 1) {
      hue = 140 // Starting hue for a vibrant green (closer to Tailwind green-500)
    } else if (feeRate <= 5) {
      // Interpolate from vibrant green (140) to yellow-green (90)
      const t = (feeRate - 1) / (5 - 1)
      hue = lerp(140, 90, t)
    } else if (feeRate <= 10) {
      // Interpolate from yellow-green (90) to yellow (60)
      const t = (feeRate - 5) / (10 - 5)
      hue = lerp(90, 60, t)
    } else if (feeRate <= 20) {
      // Interpolate from yellow (60) to orange (30)
      const t = (feeRate - 10) / (20 - 10)
      hue = lerp(60, 30, t)
    } else if (feeRate <= 50) {
      // Interpolate from orange (30) to red (0)
      const t = (feeRate - 20) / (50 - 20)
      hue = lerp(30, 0, t)
    } else {
      hue = 0 // Pure red for very high fees
    }

    return `hsla(${Math.round(hue)}, ${saturation}%, ${lightness}%, ${alpha})`
  }

  return (
    <>
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm relative">
          {/* Left Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          {/* Right Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          <div
            ref={scrollRef}
            className="flex overflow-x-auto p-4 space-x-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-transparent"
            style={{ direction: "rtl" }} // Keep RTL for scroll behavior
          >
            <div className="flex space-x-4" style={{ direction: "ltr" }}>
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
                    className={`relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden hover:scale-105 transition-all duration-200 ${
                      block.height === currentHeight
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
                          <div>{block.tx_count.toLocaleString()} TX</div>
                          <div className="text-gray-400">
                            {block.weight ? `${(block.weight / 1000000).toFixed(2)} MWU` : "-- MWU"}
                          </div>
                        </div>
                      </div>
                      <Badge className="mt-2 bg-blue-500 text-white text-xs self-center">
                        {formatTimeAgo(block.timestamp)}
                      </Badge>
                    </div>
                  </div>
                )
              })}

              {/* Load More Past Blocks "Block" - Appears on the right when scrolled to the rightmost end */}
              {showLoadMorePast && (
                <div
                  onClick={loadMorePastBlocks}
                  className={`relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden hover:scale-105 transition-all duration-200 
                    border-orange-500/50 bg-black/50 hover:border-orange-400/50 hover:bg-black/50 
                    flex flex-col items-center justify-center ${isLoadingMore ? "opacity-70 cursor-not-allowed" : ""}`}
                  title={isLoadingMore ? "Loading..." : "Load older blocks"}
                >
                  {/* Mimic the internal structure of other blocks for consistent sizing */}
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                        </div>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-orange-400 mb-1">Load More</div>
                          <div className="text-xs text-white space-y-1">
                            <div>Older Blocks</div>
                            <div>Available</div>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Placeholder to take up space similar to the Badge in other blocks */}
                    <Badge className="mt-2 bg-transparent text-transparent text-xs self-center pointer-events-none">
                      &nbsp;
                    </Badge>
                  </div>
                </div>
              )}
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
