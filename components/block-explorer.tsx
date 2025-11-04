"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BlockDetailsModal } from "@/components/block-details-modal"
import { ProjectedBlockDetailsModal } from "@/components/projected-block-details-modal"
import { BlockItem } from "@/components/block-item"
import { useRecentBlocks, useProjectedBlocks, useOlderBlocks } from "@/hooks/use-bitcoin-data"
import { MempoolAPI } from "@/lib/mempool-api"
import type { Block, ProjectedBlock } from "@/lib/types"

export type { Block, ProjectedBlock }

interface BlockExplorerProps {
  currentHeight: number // Accept currentHeight as a prop
}

const MAX_BLOCK_WEIGHT_WU = 4000000
const BYTES_TO_WU_RATIO = 4
// const BLOCKS_TO_LOAD = 10 // No longer needed as "Load More" is removed

export function BlockExplorer({ currentHeight }: BlockExplorerProps) {
  // Use React Query for initial data
  const { data: recentBlocksData, isLoading: recentBlocksLoading } = useRecentBlocks()
  const { data: projectedBlocksData, isLoading: projectedBlocksLoading } = useProjectedBlocks()

  // Local state for accumulated blocks (for lazy loading older blocks)
  const [accumulatedBlocks, setAccumulatedBlocks] = useState<Block[]>([])
  const [oldestHeight, setOldestHeight] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Modal state
  const [selectedBlockHash, setSelectedBlockHash] = useState<string | null>(null)
  const [selectedProjectedBlock, setSelectedProjectedBlock] = useState<
    (ProjectedBlock & { height: number; estimatedTime: string }) | null
  >(null)
  const [isBlockDetailsModalOpen, setIsBlockDetailsModalOpen] = useState(false)
  const [isProjectedBlockDetailsModalOpen, setIsProjectedBlockDetailsModalOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const olderSentinelRef = useRef<HTMLDivElement>(null)
  const isInitialCenteringDone = useRef(false)

  // Sync React Query data to local state
  useEffect(() => {
    if (recentBlocksData && recentBlocksData.length > 0) {
      setAccumulatedBlocks(recentBlocksData)
      setOldestHeight(recentBlocksData[recentBlocksData.length - 1].height)
      isInitialCenteringDone.current = false
    }
  }, [recentBlocksData])

  const blocks = accumulatedBlocks
  const projectedBlocks = projectedBlocksData || []

  

  
  // Drag-to-pan
  const isPointerDown = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const hasDragged = useRef(false)
  const dragThreshold = 6
  const [isDragging, setIsDragging] = useState(false)
  // Centering spacer + group refs
  const [leftPadPx, setLeftPadPx] = useState(0)
  const projectedGroupRef = useRef<HTMLDivElement>(null)
  const blocksGroupRef = useRef<HTMLDivElement>(null)
  const projectedGroupOffsetLeft = useRef<number>(0);
  const blocksGroupOffsetLeft = useRef<number>(0);
// Removed handleScroll and loadMorePastBlocks as they are no longer needed

  const [mousePositionX, setMousePositionX] = useState<number | null>(null);
  const [containerLeft, setContainerLeft] = useState<number>(0);
  const mouseMoveAnimationFrameRef = useRef<number | null>(null);
  const throttleTimeoutRef = useRef<number | null>(null); // New ref for throttling
  const throttleInterval = 50; // Update every 50ms

  // Load older blocks (older = lower height)
  const loadOlderBlocks = useCallback(async (count: number = 10) => {
    if (isLoadingMore) return
    try {
      setIsLoadingMore(true)
      const currentOldest = oldestHeight ?? (blocks.length ? blocks[blocks.length - 1].height : null)
      if (!currentOldest) return

      // Fetch older blocks using API service
      const start = currentOldest - 1
      const olderData = await MempoolAPI.getBlocksFromHeight(start)
      const needed = olderData.slice(0, count)

      // Fetch weights using API service
      const withWeights = await MempoolAPI.getBlocksWithWeights(needed)

      setAccumulatedBlocks((prev) => [...prev, ...withWeights])
      const newOldest = withWeights.length ? withWeights[withWeights.length - 1].height : currentOldest
      setOldestHeight(newOldest)
    } catch (error) {
      console.error("Failed to fetch older blocks:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, oldestHeight, blocks.length])

  // Observe RIGHT edge to lazy-load older blocks
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const root = scrollRef.current
    const target = olderSentinelRef.current
    if (!root || !target) return
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadOlderBlocks(10)
        }
      }
    }, { root, rootMargin: "200px", threshold: 0.1 })
    io.observe(target)
    return () => io.disconnect()
  }, [scrollRef, olderSentinelRef, loadOlderBlocks])

  // Reset centering when current height changes
  useEffect(() => {
    if (currentHeight > 0 && recentBlocksData) {
      isInitialCenteringDone.current = false
    }
  }, [currentHeight, recentBlocksData])

  useEffect(() => {
    if (projectedGroupRef.current && blocksGroupRef.current && scrollRef.current) {
      projectedGroupOffsetLeft.current = projectedGroupRef.current.offsetLeft;
      blocksGroupOffsetLeft.current = blocksGroupRef.current.offsetLeft;
    }
  }, [blocks, projectedBlocks, leftPadPx]); // Recalculate if blocks or padding changes

  // Center the view on the current block
  useEffect(() => {
    if (scrollRef.current && !isInitialCenteringDone.current) {
      const currentBlockElement = scrollRef.current.querySelector(".current-block")
      if (currentBlockElement) {
        const containerWidth = scrollRef.current.clientWidth
        const elementLeft = (currentBlockElement as HTMLElement).offsetLeft
        const elementWidth = (currentBlockElement as HTMLElement).offsetWidth
        scrollRef.current.scrollLeft =
          elementLeft - containerWidth / 2 + elementWidth / 2
        isInitialCenteringDone.current = true
      }
    }
  }, [blocks, projectedBlocks])
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
    if (isDragging || hasDragged.current) return
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

  const getBlockScaleAndZIndex = useCallback((blockCenterXRelativeToScrollRef: number) => {
    if (mousePositionX === null || !scrollRef.current || isDragging) {
      return { scale: 1, zIndex: 1 };
    }

    const scrollLeft = scrollRef.current.scrollLeft;
    const mouseXRelativeToContainer = mousePositionX - containerLeft + scrollLeft;

    const distance = Math.abs(blockCenterXRelativeToScrollRef - mouseXRelativeToContainer);
    const magnificationRadius = 200; // Pixels around the cursor where magnification occurs
    const maxScale = 1.1; // Maximum scale for the block directly under the cursor

    if (distance > magnificationRadius) {
      return { scale: 1, zIndex: 1 };
    }

    const normalizedDistance = distance / magnificationRadius; // 0 to 1
    const scale = maxScale - (maxScale - 1) * (normalizedDistance * normalizedDistance);
    const zIndex = Math.round(scale * 10); // Scale 1.0 -> zIndex 10, Scale 1.2 -> zIndex 12

    return { scale, zIndex };
  }, [mousePositionX, containerLeft, isDragging]);

  return (
    <>
      <div className="absolute top-20 md:top-32 left-0 right-0 w-full z-10">
        <Card className="bg-transparent border-transparent shadow-none relative">
          {/* Left Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          {/* Right Fade Overlay (Desktop Only) */}
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/50 to-transparent z-20 hidden md:block pointer-events-none" />
          <div
            ref={scrollRef}
            className="flex overflow-x-auto p-4 space-x-4 no-scrollbar select-none"
            style={{ direction: "ltr", cursor: isDragging ? "grabbing" : "grab", scrollbarWidth: "none", msOverflowStyle: "none" }}
            onPointerDown={(e) => {
              const root = scrollRef.current
              if (!root) return
              isPointerDown.current = true
              hasDragged.current = false
              setIsDragging(false)
              startX.current = e.clientX
              startScrollLeft.current = root.scrollLeft
            }}
            onPointerMove={(e) => {
              const root = scrollRef.current
              if (!root || !isPointerDown.current) return
              const dx = e.clientX - startX.current
              if (!hasDragged.current && Math.abs(dx) < dragThreshold) {
                // If not dragging yet, just update mouse position for magnification
                if (!throttleTimeoutRef.current) { // Only update if not currently throttled
                  if (mouseMoveAnimationFrameRef.current) {
                    cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                  }
                  mouseMoveAnimationFrameRef.current = requestAnimationFrame(() => {
                    setMousePositionX(e.clientX);
                    setContainerLeft(root.getBoundingClientRect().left);
                    throttleTimeoutRef.current = window.setTimeout(() => {
                      throttleTimeoutRef.current = null;
                    }, throttleInterval);
                  });
                }
                return;
              }
              hasDragged.current = true
              setIsDragging(true)
              let next = startScrollLeft.current - dx
              const max = root.scrollWidth - root.clientWidth
              if (next < 0) next = 0
              if (next > max) next = max
              root.scrollLeft = next
            }}
            onPointerUp={() => {
              isPointerDown.current = false
              setIsDragging(false)
              setMousePositionX(null); // Reset mouse position on pointer up
              if (mouseMoveAnimationFrameRef.current) {
                cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                mouseMoveAnimationFrameRef.current = null;
              }
              if (throttleTimeoutRef.current) { // Clear throttle on pointer up
                clearTimeout(throttleTimeoutRef.current);
                throttleTimeoutRef.current = null;
              }
            }}
            onPointerLeave={() => {
              isPointerDown.current = false
              setIsDragging(false)
              setMousePositionX(null); // Reset mouse position on pointer leave
              if (mouseMoveAnimationFrameRef.current) {
                cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                mouseMoveAnimationFrameRef.current = null;
              }
              if (throttleTimeoutRef.current) { // Clear throttle on pointer leave
                clearTimeout(throttleTimeoutRef.current);
                throttleTimeoutRef.current = null;
              }
            }}
            onMouseMove={(e) => {
              if (!isPointerDown.current) { // Only update mouse position if not dragging
                if (!throttleTimeoutRef.current) { // Only update if not currently throttled
                  if (mouseMoveAnimationFrameRef.current) {
                    cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                  }
                  mouseMoveAnimationFrameRef.current = requestAnimationFrame(() => {
                    setMousePositionX(e.clientX);
                    setContainerLeft(scrollRef.current?.getBoundingClientRect().left || 0);
                    throttleTimeoutRef.current = window.setTimeout(() => {
                      throttleTimeoutRef.current = null;
                    }, throttleInterval);
                  });
                }
              }
            }}
          >
            <style jsx>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="flex space-x-4" style={{ direction: "ltr" }}>
              {/* Left spacer to center current block at left cap */}
              <div style={{ width: `${leftPadPx}px`, flex: "0 0 auto" }} />
              {/* Future projected blocks group */}
              <div ref={projectedGroupRef} className="flex space-x-4">
              {/* Future projected blocks - rightmost, reversed order */}
              {projectedBlocks
                .slice()
                .reverse()
                .map((proj, index) => {
                  const blockWidth = 100; // min-w-[100px]
                  const blockMargin = 16; // space-x-4 (4 * 4px = 16px)
                  const blockCenterXRelativeToProjectedGroup = (index * (blockWidth + blockMargin)) + (blockWidth / 2);
                  const blockCenterXRelativeToScrollRef = projectedGroupOffsetLeft.current + blockCenterXRelativeToProjectedGroup;

                  const { scale, zIndex } = getBlockScaleAndZIndex(blockCenterXRelativeToScrollRef);

                  const futureHeight = currentHeight + (projectedBlocks.length - index);
                  return (
                    <BlockItem
                      key={proj.nTx + "-" + index} // Use a unique key for projected blocks
                      block={proj}
                      currentHeight={currentHeight}
                      isProjected={true}
                      scale={scale}
                      zIndex={zIndex}
                      onClick={(projBlock) => handleProjectedBlockClick(projBlock as ProjectedBlock, index)}
                      formatTimeAgo={formatTimeAgo}
                      getEstimatedTime={getEstimatedTime}
                      getAverageFeeRate={getAverageFeeRate}
                      getInterpolatedFeeColor={getInterpolatedFeeColor}
                      index={index}
                      futureHeight={futureHeight} // New prop
                    />
                  )
                })}

              </div>
              {/* Past blocks group */}
              <div ref={blocksGroupRef} className="flex space-x-4">
{/* Past blocks - newest to oldest (right to left) */}
              {blocks.map((block, index) => {
                const blockWidth = 100; // min-w-[100px]
                const blockMargin = 16; // space-x-4 (4 * 4px = 16px)
                const blockCenterXRelativeToBlocksGroup = (index * (blockWidth + blockMargin)) + (blockWidth / 2);
                const blockCenterXRelativeToScrollRef = blocksGroupOffsetLeft.current + blockCenterXRelativeToBlocksGroup;

                const { scale, zIndex } = getBlockScaleAndZIndex(blockCenterXRelativeToScrollRef);

                return (
                  <BlockItem
                    key={block.height}
                    block={block}
                    currentHeight={currentHeight}
                    isProjected={false}
                    scale={scale}
                    zIndex={zIndex}
                    onClick={handleBlockClick}
                    formatTimeAgo={formatTimeAgo}
                    getEstimatedTime={getEstimatedTime}
                    getAverageFeeRate={getAverageFeeRate}
                    getInterpolatedFeeColor={getInterpolatedFeeColor}
                    index={index}
                  />
                )
              })}
              {/* The "Load More Past Blocks" div has been removed */}
              </div>
            </div>
              {/* Sentinel for older blocks (right edge) */}
              <div ref={olderSentinelRef} className="w-px h-1" />

              {/* Sentinel for older blocks (right edge in LTR) */}
              <div ref={olderSentinelRef} className="w-px h-1" />

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