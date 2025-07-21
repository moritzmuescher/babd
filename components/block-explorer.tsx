"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const [blocksRes, heightRes, projectedRes] = await Promise.all([
          fetch("https://mempool.space/api/blocks"),
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
      } catch (error) {
        console.error("Error fetching blocks:", error)
      }
    }

    fetchBlocks()
    const interval = setInterval(fetchBlocks, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (blocks.length > 0 && currentHeight > 0 && scrollRef.current) {
      const timer = setTimeout(() => {
        const currentBlockElement = scrollRef.current?.querySelector(".current-block")
        if (currentBlockElement && scrollRef.current) {
          const containerWidth = scrollRef.current.clientWidth
          const elementLeft = (currentBlockElement as HTMLElement).offsetLeft
          const elementWidth = (currentBlockElement as HTMLElement).offsetWidth

          scrollRef.current.scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [blocks, currentHeight])

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

  const getEstimatedTime = (blockIndex: number) => {
    const estimatedMinutes = (blockIndex + 1) * 10
    return `~${estimatedMinutes}m`
  }

  const getAverageFeeRate = (feeRange: number[]) => {
    if (!feeRange || feeRange.length === 0) return "~1"
    const sortedFees = [...feeRange].sort((a, b) => a - b)
    const median = sortedFees[Math.floor(sortedFees.length / 2)]
    return `~${Math.round(median)}`
  }

  const handleBlockClick = (block: Block) => {
    setSelectedBlockHash(block.id)
    setIsBlockDetailsModalOpen(true)
  }

  const handleProjectedBlockClick = (proj: ProjectedBlock, index: number) => {
    const futureHeight = currentHeight + (projectedBlocks.length - index)
    const estimatedTime = getEstimatedTime(projectedBlocks.length - 1 - index)
    setSelectedProjectedBlock({ ...proj, height: futureHeight, estimatedTime })
    setIsProjectedBlockDetailsModalOpen(true)
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
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto p-4 space-x-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-transparent"
            style={{ scrollbarWidth: "thin", direction: "rtl" }}
          >
            <div className="flex space-x-4" style={{ direction: "ltr" }}>
              {/* Future projected blocks - rightmost, reversed order */}
              {projectedBlocks
                .slice()
                .reverse()
                .map((proj, index) => {
                  const futureHeight = currentHeight + (projectedBlocks.length - index)
                  const originalIndex = projectedBlocks.length - 1 - index
                  const estimatedWeightWU = proj.blockSize * BYTES_TO_WU_RATIO
                  const weightPercentage = estimatedWeightWU
                    ? Math.min((estimatedWeightWU / MAX_BLOCK_WEIGHT_WU) * 100, 100)
                    : 0
                  return (
                    <div
                      key={futureHeight}
                      onClick={() => handleProjectedBlockClick(proj, index)}
                      className="relative flex-shrink-0 p-3 rounded-lg text-center min-w-[100px] cursor-pointer overflow-hidden hover:scale-105 transition-all duration-200" // Removed 'border' class
                      title={`Click to view estimated details for future block ${futureHeight}`}
                    >
                      {/* Green fill layer for future blocks */}
                      <div
                        className="absolute bottom-0 left-0 w-full bg-green-500/40 transition-all duration-300"
                        style={{ height: `${weightPercentage}%` }}
                      ></div>
                      {/* Content layer */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <div className="text-xl font-bold text-green-400 mb-1">{futureHeight}</div>
                          <div className="text-xs text-white space-y-1">
                            <div>{(proj.blockSize / 1000000).toFixed(2)} MB</div>
                            <div>{proj.nTx.toLocaleString()} TX</div>
                            <div className="text-gray-400">{getAverageFeeRate(proj.feeRange)} sat/vB</div>
                          </div>
                        </div>
                        <Badge className="mt-2 bg-green-500 text-white text-xs self-center">
                          in {getEstimatedTime(originalIndex)}
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
