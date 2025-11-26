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
import { AnimatePresence, motion } from "framer-motion"

export type { Block, ProjectedBlock }

interface BlockExplorerProps {
  currentHeight: number // Accept currentHeight as a prop
}

const MAX_BLOCK_WEIGHT_WU = 4000000
const BYTES_TO_WU_RATIO = 4

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
  const itemsRef = useRef<Map<string, HTMLElement | null>>(new Map())
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

  const [mousePositionX, setMousePositionX] = useState<number | null>(null);
  const [containerLeft, setContainerLeft] = useState<number>(0);
  const mouseMoveAnimationFrameRef = useRef<number | null>(null);

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

  const minScrollLeft = useRef(0)

  // Calculate left padding and min scroll to center the current block at the limit
  useEffect(() => {
    const calculateLayout = () => {
      if (scrollRef.current && projectedGroupRef.current && blocksGroupRef.current) {
        const containerWidth = scrollRef.current.clientWidth
        const projectedWidth = projectedGroupRef.current.offsetWidth

        // Get current block width (first child of blocks group)
        const currentBlockNode = blocksGroupRef.current.firstElementChild
        const currentBlockWidth = currentBlockNode ? (currentBlockNode as HTMLElement).offsetWidth : 100

        // Calculate distance from content start to center of current block
        // Structure: [Padding 16px] [Spacer] --16px--> [ProjectedGroup] --16px--> [BlocksGroup(CurrentBlock...)]
        // Note: space-x-4 adds 16px gap between flex items. pl-4 adds 16px padding.
        const baseDist = 16 + 16 + projectedWidth + 16 + (currentBlockWidth / 2)

        const targetPadding = (containerWidth / 2) - baseDist

        if (targetPadding > 0) {
          setLeftPadPx(targetPadding)
          minScrollLeft.current = 0
        } else {
          setLeftPadPx(0)
          minScrollLeft.current = -targetPadding // Positive value
        }
      }
    }

    calculateLayout()
    window.addEventListener('resize', calculateLayout)
    return () => window.removeEventListener('resize', calculateLayout)
  }, [projectedBlocks, blocks])

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
  }, [blocks, projectedBlocks, leftPadPx]) // Added leftPadPx dependency

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

  const handleBlockClick = (block: Block | ProjectedBlock) => {
    if (isDragging || hasDragged.current) return
    const pastBlock = block as Block
    setSelectedBlockHash(pastBlock.id)
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

  const getBlockScaleAndZIndex = useCallback((itemId: string) => {
    if (mousePositionX === null || isDragging) {
      return { scale: 1, zIndex: 1 };
    }

    const el = itemsRef.current.get(itemId);
    if (!el) return { scale: 1, zIndex: 1 };

    const rect = el.getBoundingClientRect();
    const blockCenterX = rect.left + rect.width / 2;

    const distance = Math.abs(blockCenterX - mousePositionX);
    const magnificationRadius = 80; // Reduced to 80px for tighter focus (block width is ~100px)
    const maxScale = 1.10; // Maximum scale for the block directly under the cursor

    if (distance > magnificationRadius) {
      return { scale: 1, zIndex: 1 };
    }

    const normalizedDistance = distance / magnificationRadius; // 0 to 1
    // Use a lower power for faster falloff on adjacent blocks
    const scale = maxScale - (maxScale - 1) * Math.pow(normalizedDistance, 1.5);
    const zIndex = Math.round(scale * 10); // Scale 1.0 -> zIndex 10, Scale 1.18 -> zIndex 11

    return { scale, zIndex };
  }, [mousePositionX, isDragging]);

  return (
    <>
      <div className="absolute bottom-32 md:bottom-24 left-1/2 -translate-x-1/2 w-[120vw] z-10">
        <div className="hud-panel-bottom">
          <Card className="bg-transparent border-transparent shadow-none relative">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto pl-4 py-4 pr-32 space-x-4 no-scrollbar select-none items-center"
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
                  // No throttle for smoother immediate response
                  if (mouseMoveAnimationFrameRef.current) {
                    cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                  }
                  mouseMoveAnimationFrameRef.current = requestAnimationFrame(() => {
                    setMousePositionX(e.clientX);
                    setContainerLeft(root.getBoundingClientRect().left);
                  });
                  return;
                }
                hasDragged.current = true
                setIsDragging(true)
                let next = startScrollLeft.current - dx
                const max = root.scrollWidth - root.clientWidth
                // Clamp to minScrollLeft to prevent scrolling past current block center
                if (next < minScrollLeft.current) next = minScrollLeft.current
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
              }}
              onPointerLeave={() => {
                isPointerDown.current = false
                setIsDragging(false)
                setMousePositionX(null); // Reset mouse position on pointer leave
                if (mouseMoveAnimationFrameRef.current) {
                  cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                  mouseMoveAnimationFrameRef.current = null;
                }
              }}
              onMouseMove={(e) => {
                if (!isPointerDown.current) { // Only update mouse position if not dragging
                  if (mouseMoveAnimationFrameRef.current) {
                    cancelAnimationFrame(mouseMoveAnimationFrameRef.current);
                  }
                  mouseMoveAnimationFrameRef.current = requestAnimationFrame(() => {
                    setMousePositionX(e.clientX);
                    setContainerLeft(scrollRef.current?.getBoundingClientRect().left || 0);
                  });
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
                <motion.div ref={projectedGroupRef} className="flex space-x-4" layout>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {/* Future projected blocks - rightmost, reversed order */}
                    {projectedBlocks
                      .slice()
                      .reverse()
                      .map((proj, index) => {
                        const itemId = `proj-${index}`;
                        const { scale, zIndex } = getBlockScaleAndZIndex(itemId);

                        const futureHeight = currentHeight + (projectedBlocks.length - index);
                        return (
                          <motion.div
                            key={proj.nTx + "-" + index}
                            ref={(el) => { if (el) itemsRef.current.set(itemId, el); else itemsRef.current.delete(itemId); }}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <BlockItem
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
                          </motion.div>
                        )
                      })}
                  </AnimatePresence>
                </motion.div>
                {/* Past blocks group */}
                <motion.div ref={blocksGroupRef} className="flex space-x-4" layout>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {/* Past blocks - newest to oldest (right to left) */}
                    {blocks.map((block, index) => {
                      const itemId = `block-${block.height}`;
                      const { scale, zIndex } = getBlockScaleAndZIndex(itemId);

                      return (
                        <motion.div
                          key={block.height}
                          ref={(el) => { if (el) itemsRef.current.set(itemId, el); else itemsRef.current.delete(itemId); }}
                          layout
                          initial={{ opacity: 0, scale: 0.8, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <BlockItem
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
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </div>
              {/* Sentinel for older blocks (right edge) */}
              <div ref={olderSentinelRef} className="w-px h-1" />

            </div>
          </Card>
        </div>
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