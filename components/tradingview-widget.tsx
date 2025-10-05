"use client"

import React, { useEffect, useRef, memo } from "react"

/**
 * TradingView Advanced Chart widget
 * Re-initializes cleanly whenever the `symbol` prop changes.
 */
function TradingViewWidget({ symbol = "BTCUSD" }: { symbol?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clean up any previous widget/script
    container.innerHTML = ""

    // TradingView requires a child div with this class name
    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = "100%"
    widgetDiv.style.width = "100%"

    // Optional: attribution/footer container
    const attribution = document.createElement("div")
    attribution.className = "tradingview-widget-copyright"
    attribution.style.marginTop = "8px"
    attribution.style.fontSize = "12px"

    // Script tag with JSON config inside
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.async = true
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"

    const config = {
      autosize: true,
      symbol, // <-- uses current prop
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(240, 185, 11, 0.1)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      withdateranges: true,
      studies: [],
      // No container_id here; TradingView attaches to the sibling "widget" div
    }

    script.innerHTML = JSON.stringify(config)

    container.appendChild(widgetDiv)
    container.appendChild(script)

    // (Optional) update attribution text to match current symbol
    attribution.innerHTML = `
      <a href="https://www.tradingview.com/symbols/${encodeURIComponent(
        symbol
      )}/" rel="noopener nofollow" target="_blank" class="underline">
        ${symbol} chart
      </a>
      <span class="ml-1">by TradingView</span>
    `
    container.appendChild(attribution)

    // Cleanup when symbol changes or component unmounts
    return () => {
      container.innerHTML = ""
    }
  }, [symbol])

  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  )
}

export default memo(TradingViewWidget)

