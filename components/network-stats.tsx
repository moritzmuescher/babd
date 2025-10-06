"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { fmt } from "@/lib/format"

type DiffAdj = {
  progressPercent?: number
  estimatedRetargetDate?: string
  remainingBlocks?: number
  difficultyChange?: number
}

async function fetchJSON<T=any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export function NetworkStats() {
  const [diff, setDiff] = useState<DiffAdj | null>(null)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    let stop = false
    async function load() {
      const [d, h] = await Promise.all([
        fetchJSON<DiffAdj>("https://mempool.space/api/v1/difficulty-adjustment"),
        (async () => {
          try {
            const res = await fetch("https://mempool.space/api/blocks/tip/height", { cache: "no-store" })
            if (!res.ok) return null
            const txt = await res.text()
            const n = parseInt(txt, 10)
            return Number.isFinite(n) ? n : null
          } catch { return null }
        })(),
      ])
      if (!stop) {
        if (d) setDiff(d)
        if (typeof h === "number") setHeight(h)
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  const halvingInfo = useMemo(() => {
    if (!height) return { nextHeight: "—", blocksLeft: "—" }
    const HALVING_INTERVAL = 210_000
    const next = Math.ceil((height + 1) / HALVING_INTERVAL) * HALVING_INTERVAL
    const left = next - height
    return { nextHeight: fmt(next), blocksLeft: fmt(left) }
  }, [height])

  return (
    <div className="fixed top-[90px] right-4 left-4 md:left-auto md:w-[380px] z-10">
      <Card className="bg-black/30 border-white/10 p-4 rounded-2xl space-y-3">
        <div className="text-sm opacity-70">Difficulty Adjustment</div>
        <div className="text-lg font-semibold">
          Progress: {fmt(diff?.progressPercent)}%
        </div>
        <div className="text-sm">
          Remaining blocks: <span className="font-medium">{fmt(diff?.remainingBlocks)}</span>
        </div>
        <div className="text-sm">
          Est. retarget: <span className="font-medium">{diff?.estimatedRetargetDate ?? "—"}</span>
        </div>
        <div className="text-sm">
          Est. change: <span className="font-medium">{fmt(diff?.difficultyChange)}%</span>
        </div>

        <div className="h-px bg-white/10 my-2" />

        <div className="text-sm opacity-70">Halving Countdown</div>
        <div className="text-sm">
          Next halving height: <span className="font-medium">{halvingInfo.nextHeight}</span>
        </div>
        <div className="text-sm">
          Blocks left: <span className="font-medium">{halvingInfo.blocksLeft}</span>
        </div>
      </Card>
    </div>
  )
}
