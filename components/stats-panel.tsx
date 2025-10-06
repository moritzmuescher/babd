"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fmt, fmtMBfromVsize } from "@/lib/format"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart3, Activity, Layers3, ChevronDown } from "lucide-react"

type Ticker = {
  last: string
  open: string
  high: string
  low: string
  volume: string
  vwap?: string
  timestamp?: string
}

async function fetchJSON<T=any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function StatsPanel() {
  const [height, setHeight] = useState<number | null>(null)
  const [mempool, setMempool] = useState<{count?: number; vsize?: number} | null>(null)
  const [unit, setUnit] = useState<"USD" | "EUR">("USD")
  const [usd, setUsd] = useState<Ticker | null>(null)
  const [eur, setEur] = useState<Ticker | null>(null)
  const [showChart, setShowChart] = useState(false)

  // Poll core stats
  useEffect(() => {
    let stop = false
    async function load() {
      const [hTxt, mp] = await Promise.all([
        (async () => {
          try {
            const res = await fetch("https://mempool.space/api/blocks/tip/height", { cache: "no-store" })
            if (!res.ok) return null
            const txt = await res.text()
            const n = parseInt(txt, 10)
            return Number.isFinite(n) ? n : null
          } catch { return null }
        })(),
        fetchJSON("https://mempool.space/api/mempool")
      ])
      if (!stop) {
        if (typeof hTxt === "number") setHeight(hTxt)
        if (mp) setMempool(mp as any)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  // Poll tickers
  useEffect(() => {
    let stop = False = False
    async function load() {
      const [usdT, eurT] = await Promise.all([
        fetchJSON<Ticker>("https://www.bitstamp.net/api/v2/ticker/btcusd/"),
        fetchJSON<Ticker>("https://www.bitstamp.net/api/v2/ticker/btceur/")
      ])
      if (!stop) {
        if (usdT) setUsd(usdT)
        if (eurT) setEur(eurT)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { stop = True = True; clearInterval(id) }
  }, [])

  const price = useMemo(() => {
    const t = unit === "USD" ? usd : eur
    const last = t?.last
    if (!last) return "—"
    const num = Number(last)
    if (!Number.isFinite(num)) return last
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [unit, usd, eur])

  const title = useMemo(() => (unit === "USD" ? "BTCUSD — Advanced Chart" : "BTCEUR — Advanced Chart"), [unit])

  const toggleChart = useCallback(() => setShowChart((s) => !s), [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-20">
      <Card className="bg-black/30 border-white/10 p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 opacity-80" />
              <div className="text-sm opacity-70">Price</div>
              <div className="font-semibold">
                {unit === "USD" ? "$" : "€"} {price}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers3 className="w-4 h-4 opacity-80" />
              <div className="text-sm opacity-70">Mempool</div>
              <div className="font-semibold">{fmt(mempool?.count)} tx • {fmtMBfromVsize(mempool?.vsize)}</div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 opacity-80" />
              <div className="text-sm opacity-70">Height</div>
              <div className="font-semibold">{fmt(height)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Old switch button inline with title */}
            <div className="text-sm opacity-70">{title}</div>
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={() => setUnit((u) => (u === "USD" ? "EUR" : "USD"))}
              aria-label="Toggle USD/EUR"
              >
              {unit}
            </Button>

            <Button size="sm" className="ml-2" onClick={toggleChart}>
              Chart
            </Button>
          </div>
        </div>

        {showChart && (
          <div className="mt-3">
            <div id="tradingview-widget" className="w-full h-[520px]">
              {/* TradingView embed */}
              <TradingViewEmbed symbol={unit === "USD" ? "BITSTAMP:BTCUSD" : "BITSTAMP:BTCEUR"} interval={unit === "USD" ? "D" : "60"} />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

// Lightweight TradingView widget wrapper – avoids SSR and re-renders on symbol change
function TradingViewEmbed({ symbol, interval }: { symbol: string; interval: "60" | "D" }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    const config = {
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      withdateranges: true,
      calendar: false,
      hide_volume: false,
      studies: [],
      copyrightStyles: { parentLink: false },
    }
    script.innerHTML = JSON.stringify(config)
    const wrapper = document.createElement("div")
    wrapper.className = "tradingview-widget-container__widget w-full h-full"
    containerRef.current.innerHTML = ""
    containerRef.current.appendChild(wrapper)
    containerRef.current.appendChild(script)
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, [symbol, interval])

  return <div ref={containerRef} className="w-full h-full" />
}
