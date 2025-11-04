"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { CyberBrackets } from "@/components/ui/cyber-brackets"
import TradingViewWidget from "@/components/tradingview-widget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBitcoinStats } from "@/hooks/use-bitcoin-data"

interface StatsPanelProps {
  blockHeight: number
}

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartSymbol, setChartSymbol] = useState<'BTCUSD' | 'BTCEUR'>('BTCUSD')
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

  return (
    <>
      {/* Block Height - Center Top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 hidden md:block">
        <CyberBrackets>
          <Card className="frosted-glass scanline-container">
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
      <div className="absolute top-4 left-4 z-10">
        <CyberBrackets>
          <Card className="frosted-glass scanline-container">
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
                  <div className="text-orange-400 text-sm flex items-center gap-2"><span>Price</span><Button onClick={() => setIsChartOpen(true)} size="sm" variant="ghost" className="border border-orange-500/25 px-2 py-0.5 h-7 text-orange-400 bg-orange-500/30 hover:text-orange-200 hover:bg-orange-500/20 transition-all">Chart</Button></div>
                </>
              )}
            </div>
          </Card>
        </CyberBrackets>
      </div>

      {/* High Priority - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <CyberBrackets>
          <Card className="frosted-glass scanline-container">
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
      <div className="absolute bottom-20 md:bottom-4 left-4 z-10">
        <CyberBrackets>
          <Card className="frosted-glass scanline-container">
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
      <div className="absolute bottom-20 md:bottom-4 right-4 z-10">
        <CyberBrackets>
          <Card className="frosted-glass scanline-container">
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
    
      {/* Chart Modal */}

      {/* Chart Modal (TradingView) */}
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[80vh] p-0 bg-black text-white border border-orange-500/25">
          <DialogHeader className="pt-2 pb-0 px-2">
            <DialogTitle className="pt-0 pb-0">
          {/* Symbol toggle */}
          <div className="px-0 pb-0">
            <div className="inline-flex rounded-md border border-orange-500/25 overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${chartSymbol === "BTCUSD" ? "bg-orange-500/20 text-orange-200" : "text-orange-400 hover:bg-orange-500/10"}`}
                onClick={() => setChartSymbol("BTCUSD")}
              >USD</button>
              <button
                className={`px-3 py-1 text-sm border-l border-orange-500/25 ${chartSymbol === "BTCEUR" ? "bg-orange-500/20 text-orange-200" : "text-orange-400 hover:bg-orange-500/10"}`}
                onClick={() => setChartSymbol("BTCEUR")}
              >EUR</button>
            </div>
          </div>
            </DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-28px)] w-full">
            <TradingViewWidget key={chartSymbol} symbol={chartSymbol} />
          </div>
        </DialogContent>
      </Dialog>
</>
  )
}
