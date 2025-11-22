"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TradingViewWidget from "@/components/tradingview-widget"

interface ChartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChartModal({ open, onOpenChange }: ChartModalProps) {
  const [symbol, setSymbol] = useState<"BTCUSD" | "BTCEUR">("BTCUSD")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[80vh] p-0 bg-black text-white border border-orange-500/25">
        <DialogHeader className="pt-2 pb-0 px-2">
          <DialogTitle className="pt-0 pb-0">
            {/* Symbol toggle */}
            <div className="px-0 pb-0">
              <div className="inline-flex rounded-md border border-orange-500/25 overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${symbol === "BTCUSD" ? "bg-orange-500/20 text-orange-200" : "text-orange-400 hover:bg-orange-500/10"}`}
                  onClick={() => setSymbol("BTCUSD")}
                >
                  USD
                </button>
                <button
                  className={`px-3 py-1 text-sm border-l border-orange-500/25 ${symbol === "BTCEUR" ? "bg-orange-500/20 text-orange-200" : "text-orange-400 hover:bg-orange-500/10"}`}
                  onClick={() => setSymbol("BTCEUR")}
                >
                  EUR
                </button>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="h-[calc(80vh-28px)] w-full">
          <TradingViewWidget symbol={symbol} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
