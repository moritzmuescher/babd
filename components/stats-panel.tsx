"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TradingViewWidget from "@/components/tradingview-widget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StatsPanelProps {
  blockHeight: number
}

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartSymbol, setChartSymbol] = useState<"BTCUSD" | "BTCEUR">("BTCUSD")

  return (
    <>
      <Card className="p-4 bg-black/40 border-orange-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="text-orange-400/80">Current block height</div>
            <div className="text-xl font-semibold text-orange-200">{blockHeight.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="border border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
              onClick={() => setIsChartOpen(true)}
            >
              Chart
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-orange-500/30">
          <DialogHeader className="px-4 py-3 border-b border-orange-500/20">
            <DialogTitle className="flex items-center justify-between w-full text-orange-100">
              <span>Bitcoin Price Chart</span>
              {/* USD / EUR toggle */}
              <div className="inline-flex rounded-md overflow-hidden border border-orange-500/40">
                <button
                  className={`px-3 py-1 text-sm ${
                    chartSymbol === "BTCUSD"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCUSD")}
                  aria-pressed={chartSymbol === "BTCUSD"}
                >
                  USD
                </button>
                <button
                  className={`px-3 py-1 text-sm border-l border-orange-500/40 ${
                    chartSymbol === "BTCEUR"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCEUR")}
                  aria-pressed={chartSymbol === "BTCEUR"}
                >
                  EUR
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="h-[calc(85vh-60px)] w-full">
            {/* key forces a remount as an extra safety; the widget also rebuilds on prop change */}
            <TradingViewWidget key={chartSymbol} symbol={chartSymbol} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StatsPanel
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TradingViewWidget from "@/components/tradingview-widget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StatsPanelProps {
  blockHeight: number
}

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartSymbol, setChartSymbol] = useState<"BTCUSD" | "BTCEUR">("BTCUSD")

  return (
    <>
      <Card className="p-4 bg-black/40 border-orange-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="text-orange-400/80">Current block height</div>
            <div className="text-xl font-semibold text-orange-200">{blockHeight.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="border border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
              onClick={() => setIsChartOpen(true)}
            >
              Chart
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-orange-500/30">
          <DialogHeader className="px-4 py-3 border-b border-orange-500/20">
            <DialogTitle className="flex items-center justify-between w-full text-orange-100">
              <span>Bitcoin Price Chart</span>
              {/* USD / EUR toggle */}
              <div className="inline-flex rounded-md overflow-hidden border border-orange-500/40">
                <button
                  className={`px-3 py-1 text-sm ${
                    chartSymbol === "BTCUSD"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCUSD")}
                  aria-pressed={chartSymbol === "BTCUSD"}
                >
                  USD
                </button>
                <button
                  className={`px-3 py-1 text-sm border-l border-orange-500/40 ${
                    chartSymbol === "BTCEUR"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCEUR")}
                  aria-pressed={chartSymbol === "BTCEUR"}
                >
                  EUR
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="h-[calc(85vh-60px)] w-full">
            {/* key forces a remount as an extra safety; the widget also rebuilds on prop change */}
            <TradingViewWidget key={chartSymbol} symbol={chartSymbol} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StatsPanel
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TradingViewWidget from "@/components/tradingview-widget"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StatsPanelProps {
  blockHeight: number
}

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartSymbol, setChartSymbol] = useState<"BTCUSD" | "BTCEUR">("BTCUSD")

  return (
    <>
      <Card className="p-4 bg-black/40 border-orange-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="text-orange-400/80">Current block height</div>
            <div className="text-xl font-semibold text-orange-200">{blockHeight.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="border border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
              onClick={() => setIsChartOpen(true)}
            >
              Chart
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-orange-500/30">
          <DialogHeader className="px-4 py-3 border-b border-orange-500/20">
            <DialogTitle className="flex items-center justify-between w-full text-orange-100">
              <span>Bitcoin Price Chart</span>
              {/* USD / EUR toggle */}
              <div className="inline-flex rounded-md overflow-hidden border border-orange-500/40">
                <button
                  className={`px-3 py-1 text-sm ${
                    chartSymbol === "BTCUSD"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCUSD")}
                  aria-pressed={chartSymbol === "BTCUSD"}
                >
                  USD
                </button>
                <button
                  className={`px-3 py-1 text-sm border-l border-orange-500/40 ${
                    chartSymbol === "BTCEUR"
                      ? "bg-orange-500/20 text-orange-100"
                      : "text-orange-300 hover:bg-orange-500/10"
                  }`}
                  onClick={() => setChartSymbol("BTCEUR")}
                  aria-pressed={chartSymbol === "BTCEUR"}
                >
                  EUR
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="h-[calc(85vh-60px)] w-full">
            {/* key forces a remount as an extra safety; the widget also rebuilds on prop change */}
            <TradingViewWidget key={chartSymbol} symbol={chartSymbol} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default StatsPanel

