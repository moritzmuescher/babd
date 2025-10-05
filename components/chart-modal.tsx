"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ChartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChartModal({ open, onOpenChange }: ChartModalProps) {
  const container = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!open || !container.current) return

    console.log("[v0] Chart modal opened, initializing TradingView widget")
    setIsLoading(true)

    // Clear any existing content
    container.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container__widget"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.onload = () => {
      console.log("[v0] TradingView script loaded successfully")
      setIsLoading(false)
    }
    script.onerror = () => {
      console.log("[v0] TradingView script failed to load")
      setIsLoading(false)
    }
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BTCUSD",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      gridColor: "rgba(242, 242, 242, 0.06)",
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      save_image: true,
      studies: [],
      watchlist: [],
      withdateranges: true,
    })

    container.current.appendChild(widgetContainer)
    container.current.appendChild(script)

    return () => {
      console.log("[v0] Cleaning up TradingView widget")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] h-[90vh] bg-black/95 border-orange-500/25">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Bitcoin Price Chart</DialogTitle>
          <DialogDescription className="text-orange-300/70">
            Live BTCUSD price chart powered by TradingView
          </DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95">
            <div className="text-orange-400 text-sm">Loading chart...</div>
          </div>
        )}
        <div
          ref={container}
          className="tradingview-widget-container"
          style={{ height: "calc(100% - 80px)", width: "100%" }}
        />
      </DialogContent>
    </Dialog>
  )
}
