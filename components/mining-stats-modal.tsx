"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Activity, Loader2, BarChart3 } from "lucide-react"
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts"

interface MiningStatsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function MiningStatsModal({ isOpen, onClose }: MiningStatsModalProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && data.length === 0) {
            fetchData()
        }
    }, [isOpen])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch("https://mempool.space/api/v1/mining/hashrate/difficulty")
            const json = await res.json()

            // The API returns { hashrates: [...], difficulty: [...] }
            // hashrates: { timestamp, avgHashrate }
            // difficulty: { time, difficulty, height, adjustment }

            if (!json.hashrates || !json.difficulty) {
                console.error("Invalid data format received")
                return
            }

            // Filter for last year (365 days)
            const oneYearAgo = Date.now() / 1000 - 365 * 24 * 60 * 60

            const hashrates = json.hashrates.filter((d: any) => d.timestamp > oneYearAgo)
            const difficulties = json.difficulty.sort((a: any, b: any) => a.time - b.time)

            const formattedData = hashrates.map((h: any) => {
                // Find the difficulty that was active at this time
                // We want the last difficulty adjustment that happened BEFORE or AT this timestamp
                const activeDifficulty = difficulties.reduce((prev: any, curr: any) => {
                    return (curr.time <= h.timestamp) ? curr : prev
                }, difficulties[0])

                return {
                    date: new Date(h.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    fullDate: new Date(h.timestamp * 1000).toLocaleDateString(),
                    difficulty: activeDifficulty ? activeDifficulty.difficulty : 0,
                    hashrate: h.avgHashrate,
                }
            })

            setData(formattedData)
        } catch (error) {
            console.error("Failed to fetch mining stats", error)
        } finally {
            setLoading(false)
        }
    }

    const formatHashrate = (hashrate: number) => {
        if (hashrate > 1e18) return `${(hashrate / 1e18).toFixed(2)} EH/s`
        if (hashrate > 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`
        return `${(hashrate / 1e12).toFixed(2)} TH/s`
    }

    const formatDifficulty = (difficulty: number) => {
        if (difficulty > 1e12) return `${(difficulty / 1e12).toFixed(2)} T`
        return `${(difficulty / 1e9).toFixed(2)} G`
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b border-orange-500/10 bg-orange-500/5">
                    <DialogTitle className="text-orange-400 flex items-center gap-2 text-xl">
                        <BarChart3 className="w-6 h-6" />
                        Hashrate & Difficulty (1 Year)
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 h-[500px] w-full">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
                            <span className="text-gray-400">Loading mining data...</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data}>
                                <defs>
                                    <linearGradient id="colorHashrate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    tick={{ fill: '#666', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#f97316"
                                    tick={{ fill: '#f97316', fontSize: 12 }}
                                    tickFormatter={formatHashrate}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#3b82f6"
                                    tick={{ fill: '#3b82f6', fontSize: 12 }}
                                    tickFormatter={formatDifficulty}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    labelStyle={{ color: '#999', marginBottom: '4px' }}
                                    formatter={(value: number, name: string) => [
                                        name === 'hashrate' ? formatHashrate(value) : formatDifficulty(value),
                                        name === 'hashrate' ? 'Hashrate' : 'Difficulty'
                                    ]}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullDate
                                        }
                                        return label
                                    }}
                                />
                                <Legend />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="hashrate"
                                    name="Hashrate"
                                    stroke="#f97316"
                                    fillOpacity={1}
                                    fill="url(#colorHashrate)"
                                    strokeWidth={2}
                                />
                                <Line
                                    yAxisId="right"
                                    type="stepAfter"
                                    dataKey="difficulty"
                                    name="Difficulty"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
