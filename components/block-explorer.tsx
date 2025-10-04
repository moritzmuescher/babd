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
  const hasUserScrolledRef = useRef(false)
  
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [oldestHeight, setOldestHeight] = useState<number | null>(null)
  const isInitialCenteringDone = useRef(false)

  

  // Removed  and loadMorePastBlocks as they are no longer needed

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
  }, [isLoadingMore, oldestHeight, blocks.length])

              }
            }}
            className="flex overflow-x-auto p-4 space-x-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-transparent"
            
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
