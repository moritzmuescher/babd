"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { CyberBrackets } from "@/components/ui/cyber-brackets"
import { ChartModal } from "@/components/chart-modal"
import { FeesModal, MempoolModal } from "@/components/stats-modals"
import { BlockDetailsModal } from "@/components/block-details-modal"
import { useBitcoinStats } from "@/hooks/use-bitcoin-data"
import { MempoolAPI } from "@/lib/mempool-api"

interface StatsPanelProps {
  blockHeight: number
}

type ModalType = 'chart' | 'fees' | 'mempool' | 'unconfirmed' | 'block-height' | null

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [tipHash, setTipHash] = useState<string | null>(null)
  const { data: stats, isLoading, error } = useBitcoinStats()

  // Default values while loading
  const displayStats = stats || {
    price: 0,
    mempoolSize: 0,
    highPriority: 0,
    unconfirmed: 0,
  }

  if (error) {
    console.error("Error fetching stats:", error)
  }

  const handleBlockHeightClick = async () => {
    try {
      const hash = await MempoolAPI.getTipHash()
      setTipHash(hash)
      setActiveModal('block-height')
    } catch (err) {
      console.error("Failed to fetch tip hash:", err)
    }
  }

  return (
    <>
      {/* Block Height - Center Top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 hidden md:block">
        <CyberBrackets>
          <Card
            className="frosted-glass scanline-container hover:bg-orange-500/10 transition-colors cursor-pointer"
            onClick={handleBlockHeightClick}
          >
            <div className="p-4 text-center">
              <div className="text-5xl md:text-6xl font-bold text-orange-400 number-glow">
                <AnimatedNumber
                  value={blockHeight}
                  formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                  duration={800}
                />
              </div>
              <div className="text-orange-400 text-sm mt-1">Block Height</div>
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* Price - Top Left */}
      <div className="absolute top-4 left-4 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => setActiveModal('chart')}>
        <CyberBrackets>
          <Card className="frosted-glass scanline-container hover:bg-orange-500/10 transition-colors">
            <div className="p-3 relative">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-32 mb-2 shimmer-skeleton" />
                  <Skeleton className="h-4 w-24 shimmer-skeleton" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-400 number-glow">
                    $<AnimatedNumber
                      value={displayStats.price}
                      formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                      duration={800}
                    />
                  </div>
                  <div className="text-orange-400 text-sm flex items-center gap-2">Price</div>
                </>
              )}
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* High Priority - Top Right */}
      <div className="absolute top-4 right-4 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => setActiveModal('fees')}>
        <CyberBrackets>
          <Card className="frosted-glass scanline-container hover:bg-orange-500/10 transition-colors">
            <div className="p-3 text-right">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-32 mb-2 ml-auto shimmer-skeleton" />
                  <Skeleton className="h-4 w-24 ml-auto shimmer-skeleton" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-400 number-glow">
                    <AnimatedNumber
                      value={displayStats.highPriority}
                      formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                      duration={800}
                    /> sat/vB
                  </div>
                  <div className="text-orange-400 text-sm">High Priority</div>
                </>
              )}
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* Mempool Size - Bottom Left */}
      <div className="absolute bottom-20 md:bottom-4 left-4 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => setActiveModal('mempool')}>
        <CyberBrackets>
          <Card className="frosted-glass scanline-container hover:bg-orange-500/10 transition-colors">
            <div className="p-3 relative">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-32 mb-2 shimmer-skeleton" />
                  <Skeleton className="h-4 w-28 shimmer-skeleton" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-400 number-glow">
                    <AnimatedNumber
                      value={displayStats.mempoolSize}
                      decimals={2}
                      duration={800}
                    /> MB
                  </div>
                  <div className="text-orange-400 text-sm">Mempool Size</div>
                </>
              )}
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* Unconfirmed - Bottom Right */}
      <div className="absolute bottom-20 md:bottom-4 right-4 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => setActiveModal('unconfirmed')}>
        <CyberBrackets>
          <Card className="frosted-glass scanline-container hover:bg-orange-500/10 transition-colors">
            <div className="p-3 text-right">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-32 mb-2 ml-auto shimmer-skeleton" />
                  <Skeleton className="h-4 w-28 ml-auto shimmer-skeleton" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-400 number-glow">
                    <AnimatedNumber
                      value={displayStats.unconfirmed}
                      formatFn={(val) => Math.floor(val).toLocaleString("en-US")}
                      duration={800}
                    />
                  </div>
                  <div className="text-orange-400 text-sm">Unconfirmed TX</div>
                </>
              )}
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* Modals */}
      <ChartModal
        open={activeModal === 'chart'}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />

      <FeesModal
        isOpen={activeModal === 'fees'}
        onClose={() => setActiveModal(null)}
        fees={stats?.fees}
      />

      <MempoolModal
        isOpen={activeModal === 'mempool' || activeModal === 'unconfirmed'}
        onClose={() => setActiveModal(null)}
        mempool={stats?.mempool}
      />

      <BlockDetailsModal
        isOpen={activeModal === 'block-height'}
        onClose={() => setActiveModal(null)}
        blockHash={tipHash}
      />
    </>
  )
}
