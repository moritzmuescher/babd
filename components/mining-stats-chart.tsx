"use client"

import { useState, useEffect } from "react"
import { Loader2, BarChart3 } from "lucide-react"
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

export function MiningStatsChart() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch("https://mempool.space/api/v1/mining/hashrate/difficulty")
            const json = await res.json()

            if (!json.hashrates || !json.difficulty) {
                console.error("Invalid data format received")
                return
            }

            // Filter for last year (365 days)
            const oneYearAgo = Date.now() / 1000 - 365 * 24 * 60 * 60

            const hashrates = json.hashrates.filter((d: any) => d.timestamp > oneYearAgo)
            const difficulties = json.difficulty.sort((a: any, b: any) => a.time - b.time)

            const formattedData = hashrates.map((h: any) => {
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

    if (loading) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                <span className="text-gray-400 text-sm">Loading mining data...</span>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
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
                        tick={{ fill: '#666', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="#f97316"
                        tick={{ fill: '#f97316', fontSize: 10 }}
                        tickFormatter={formatHashrate}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        width={60}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3b82f6"
                        tick={{ fill: '#3b82f6', fontSize: 10 }}
                        tickFormatter={formatDifficulty}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        width={60}
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
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
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
        </div>
    )
}
