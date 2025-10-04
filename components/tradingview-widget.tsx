"use client"

import React, { useEffect, useRef, memo } from "react"

/**
 * TradingView Advanced Chart (BTCUSD)
 * Loads the official TradingView advanced chart widget.
 * NOTE: Uses a client-side script injection – safe for Next.js "use client" components.
 */
function TradingViewWidget() {
  const container = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!container.current) return

    // Clean any previous widget if re-mounted
    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    // You asked for ticker BTCUSD. We pick a widely-supported exchange symbol.
    // You can change it to e.g. "BITSTAMP:BTCUSD" or "COINBASE:BTCUSD".
    script.innerHTML = `{
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": "BITSTAMP:BTCUSD",
      "theme": "dark",
      "timezone": "Etc/UTC",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(242, 242, 242, 0.06)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "studies": [],
      "autosize": true
    }`

    container.current.appendChild(script)

    return () => {
      // Best-effort cleanup
      if (container.current) {
        container.current.innerHTML = ""
      }
    }
  }, [])

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container as React.RefObject<HTMLDivElement>}>
      <div className="tradingview-widget-container__widget h-full w-full" />
      <div className="tradingview-widget-copyright text-xs text-muted-foreground px-2 py-1">
        <a
          href="https://www.tradingview.com/symbols/BTCUSD/"
          rel="noopener nofollow"
          target="_blank"
          className="underline"
        >
          BTCUSD chart
        </a>
        <span className="ml-1">by TradingView</span>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
