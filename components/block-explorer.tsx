"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BlockDetailsModal } from "@/components/block-details-modal"

interface Block {
  height: number
  size: number
  tx_count: number
  timestamp: number
  id: string
}

interface ProjectedBlock {
  blockSize: number
  nTx: number
  feeRange: number[]
}

export function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [projectedBlocks, setProjectedBlocks] = useState<ProjectedBlock[]>([])
  const [currentHeight, setCurrentHeight] = useState(0)
  const [selectedBlockHash, setSelectedBlockHash] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

        setBlocks(blocksData)
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

  // Auto-center the current block when data loads
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

  const handleBlockClick = (blockHash: string) => {
    setSelectedBlockHash(blockHash)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBlockHash(null)
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
              {/* Future projected blocks - rightmost */}
              {projectedBlocks.map((proj, index) => {
                const futureHeight = currentHeight + index + 1
                return (
                  <div
                    key={futureHeight}
                    className="flex-shrink-0 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-center min-w-[100px] opacity-70 cursor-not-allowed"
                    title="Future block - not yet mined"
                  >
                    <div className="text-xl font-bold text-green-400 mb-1">{futureHeight}</div>
                    <div className="text-xs text-white space-y-1">
                      <div>{(proj.blockSize / 1000000).toFixed(2)} MB</div>
                      <div>{proj.nTx.toLocaleString()} TX</div>
                      <div className="text-gray-400">
                        {proj.feeRange[0].toFixed(0)}-{proj.feeRange[proj.feeRange.length - 1].toFixed(0)} sat/vB
                      </div>
                    </div>
                    <Badge className="mt-2 bg-green-500 text-white text-xs">Future</Badge>
                  </div>
                )
              })}

              {/* Past blocks - newest to oldest (right to left) */}
              {blocks.map((block) => (
                <div
                  key={block.height}
                  onClick={() => handleBlockClick(block.id)}
                  className={`flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer hover:scale-105 transition-all duration-200 ${
                    block.height === currentHeight
                      ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/30 current-block hover:shadow-blue-500/50"
                      : "border-blue-500/30 bg-blue-500/10 hover:border-blue-400/50 hover:bg-blue-500/20"
                  }`}
                  title={`Click to view details for block ${block.height}`}
                >
                  <div className="text-xl font-bold text-blue-400 mb-1">{block.height}</div>
                  <div className="text-xs text-white space-y-1">
                    <div>{(block.size / 1000000).toFixed(2)} MB</div>
                    <div>{block.tx_count.toLocaleString()} TX</div>
                    <div className="text-gray-400">{formatTimeAgo(block.timestamp)}</div>
                  </div>
                  {block.height === currentHeight && (
                    <Badge className="mt-2 bg-blue-500 text-white text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Block Details Modal */}
      <BlockDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} blockHash={selectedBlockHash} />
    </>
  )
}
