"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface BitcoinStats {
  price: number
  mempoolSize: number
  highPriority: number
  unconfirmed: number
}

interface StatsPanelProps {
  blockHeight: number
}

export function StatsPanel({ blockHeight }: StatsPanelProps) {
  const [stats, setStats] = useState<BitcoinStats>({
    price: 0,
    mempoolSize: 0,
    highPriority: 0,
    unconfirmed: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [priceRes, mempoolRes, feesRes] = await Promise.all([
          fetch("https://mempool.space/api/v1/prices"),
          fetch("https://mempool.space/api/mempool"),
          fetch("https://mempool.space/api/v1/fees/recommended"),
        ])

        const priceData = await priceRes.json()
        const mempoolData = await mempoolRes.json()
        const feesData = await feesRes.json()

        setStats({
          price: priceData.USD,
          mempoolSize: mempoolData.vsize / 1000000,
          highPriority: feesData.fastestFee,
          unconfirmed: mempoolData.count,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Block Height - Center Top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 hidden md:block">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div className="p-4 text-center">
            <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              {blockHeight.toLocaleString()}
            </div>
            <div className="text-orange-400 text-sm mt-1">Block Height</div>
          </div>
        </Card>
      </div>

      {/* Price - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div className="p-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              ${stats.price.toLocaleString()}
            </div>
            <div className="text-orange-400 text-sm">Price</div>
          </div>
        </Card>
      </div>

      {/* High Priority - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div className="p-3 text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              {stats.highPriority} sat/vB
            </div>
            <div className="text-orange-400 text-sm">High Priority</div>
          </div>
        </Card>
      </div>

      {/* Mempool Size - Bottom Left */}
      <div className="absolute bottom-20 left-4 z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div className="p-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              {stats.mempoolSize.toFixed(2)} MB
            </div>
            <div className="text-orange-400 text-sm">Mempool Size</div>
          </div>
        </Card>
      </div>

      {/* Unconfirmed - Bottom Right */}
      <div className="absolute bottom-20 right-4 z-10">
        <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
          <div className="p-3 text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              {stats.unconfirmed.toLocaleString()}
            </div>
            <div className="text-orange-400 text-sm">Unconfirmed TX</div>
          </div>
        </Card>
      </div>
    </>
  )
}
