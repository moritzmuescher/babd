"use client"

import React, { useEffect, useRef, memo } from "react"

declare global {
  interface Window {
    TradingView?: any
  }
}

type Props = {
  /** Symbol to load, e.g. "BTCUSD" or "BTCEUR" */
  symbol?: string
}

/**
 * TradingView Advanced Chart widget wrapper
 * - Re-initializes when `symbol` changes
 * - Uses interval "D" for USD, "60" (1h) for EUR as requested
 */
function TradingViewWidget({ symbol = "BTCUSD" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const containerIdRef = useRef<string>(() => `tv_${Math.random().toString(36).slice(2)}` as unknown as string) as React.MutableRefObject<string>

  // Utility to (re)create the chart
  const createChart = () => {
    if (!containerRef.current) return

    // Clear any previous widget
    containerRef.current.innerHTML = ""

    const make = () => {
      if (!window.TradingView) return

      const interval = symbol.endsWith("EUR") ? "60" : "D" // 1h for EUR, 1d for USD
      const config = {
        autosize: true,
        symbol,
        interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        allow_symbol_change: false,
        hide_side_toolbar: false,
        container_id: containerIdRef.current,
        withdateranges: true,
        studies: [],
      }

      // Create the actual widget
      // eslint-disable-next-line new-cap
      new window.TradingView.widget(config)
    }

    if (window.TradingView) {
      make()
    } else {
      // Load script once, then build
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = () => make()
      containerRef.current.appendChild(script)
    }
  }

  useEffect(() => {
    createChart()
    // cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
    // Re-init when symbol changes
  }, [symbol])

  return (
    <div className="tradingview-widget-container h-full w-full">
      <div id={containerIdRef.current} ref={containerRef} className="h-full w-full" />
      <div className="tradingview-widget-copyright text-xs text-orange-300/70 mt-2">
        <a
          href={`https://www.tradingview.com/symbols/${symbol}/`}
          rel="noopener nofollow"
          target="_blank"
          className="underline"
        >
          {symbol} chart
        </a>
        <span className="ml-1">by TradingView</span>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
