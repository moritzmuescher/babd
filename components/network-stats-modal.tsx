"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Activity, Calendar, Clock, TrendingUp, TrendingDown, Coins, Hourglass } from "lucide-react"
import { motion } from "framer-motion"
import type { DifficultyData, HalvingData } from "@/lib/types"

interface NetworkStatsModalProps {
    isOpen: boolean
    onClose: () => void
    difficultyData: DifficultyData | undefined
    halvingData: HalvingData | undefined
}

export function NetworkStatsModal({ isOpen, onClose, difficultyData, halvingData }: NetworkStatsModalProps) {
    if (!isOpen || !difficultyData || !halvingData) return null

    const isAhead = difficultyData.difficultyChange > 0
    const baseProgress = (difficultyData.blocksIntoEpoch / 2016) * 100
    const extensionPercent = Math.abs(difficultyData.difficultyChange) * 0.5

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b border-orange-500/10 bg-orange-500/5">
                    <DialogTitle className="text-orange-400 flex items-center gap-2 text-xl">
                        <Activity className="w-6 h-6" />
                        Network Status
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-8">
                    <motion.div
                        className="space-y-8"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                    >
                        {/* Difficulty Section */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                <h3 className="text-xl font-bold text-blue-400">Difficulty Adjustment</h3>
                            </div>

                            <Card className="bg-black/30 border-blue-500/20 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-2">Current Period Progress</div>
                                            <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(baseProgress, 100)}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                                {baseProgress < 100 && (
                                                    <motion.div
                                                        className={`h-full ${isAhead ? "bg-green-500" : "bg-red-500"} inline-block absolute top-0`}
                                                        style={{ left: `${baseProgress}%` }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(extensionPercent, 100 - baseProgress)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                <span>{difficultyData.blocksIntoEpoch} blocks mined</span>
                                                <span>2016 total</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/20 p-3 rounded border border-white/5">
                                                <div className="text-xs text-gray-500 mb-1">Estimated Change</div>
                                                <div className={`text-lg font-mono font-bold ${difficultyData.difficultyChange > 0 ? "text-green-400" : "text-red-400"}`}>
                                                    {difficultyData.difficultyChange > 0 ? "+" : ""}
                                                    {difficultyData.difficultyChange.toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded border border-white/5">
                                                <div className="text-xs text-gray-500 mb-1">Previous Change</div>
                                                <div className={`text-lg font-mono font-bold ${difficultyData.previousChange > 0 ? "text-green-400" : "text-red-400"}`}>
                                                    {difficultyData.previousChange > 0 ? "+" : ""}
                                                    {difficultyData.previousChange.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">Average Block Time</span>
                                            </div>
                                            <span className="font-mono text-white">
                                                {difficultyData.averageBlockTime.toFixed(2)} min
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">Next Retarget</span>
                                            </div>
                                            <span className="font-mono text-white text-right text-sm">
                                                {difficultyData.estimatedRetarget}
                                            </span>
                                        </div>

                                        <div className="p-3 bg-blue-500/5 rounded border border-blue-500/10 text-xs text-blue-200/70 leading-relaxed">
                                            Bitcoin adjusts its mining difficulty every 2016 blocks (approx. 2 weeks) to maintain a 10-minute average block time.
                                            {difficultyData.difficultyChange > 0
                                                ? " Blocks are currently being mined faster than 10 minutes, so difficulty is expected to increase."
                                                : " Blocks are currently being mined slower than 10 minutes, so difficulty is expected to decrease."}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Halving Section */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Hourglass className="w-5 h-5 text-orange-400" />
                                <h3 className="text-xl font-bold text-orange-400">Halving Countdown</h3>
                            </div>

                            <Card className="bg-black/30 border-orange-500/20 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-2">Progress to Next Halving</div>
                                            <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-orange-600 to-yellow-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${halvingData.progressPercent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                <span>{halvingData.progressPercent.toFixed(2)}% complete</span>
                                                <span>
                                                    <AnimatedNumber value={halvingData.blocksRemaining} formatFn={v => Math.floor(v).toLocaleString()} /> blocks left
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/20 p-3 rounded border border-white/5">
                                                <div className="text-xs text-gray-500 mb-1">Current Subsidy</div>
                                                <div className="text-lg font-mono font-bold text-white">
                                                    {halvingData.currentSubsidy} BTC
                                                </div>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded border border-white/5">
                                                <div className="text-xs text-gray-500 mb-1">Next Subsidy</div>
                                                <div className="text-lg font-mono font-bold text-orange-400">
                                                    {halvingData.newSubsidy.toFixed(4)} BTC
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">Estimated Date</span>
                                            </div>
                                            <span className="font-mono text-white text-right text-sm">
                                                {halvingData.estimatedDate}
                                            </span>
                                        </div>

                                        <div className="p-3 bg-orange-500/5 rounded border border-orange-500/10 text-xs text-orange-200/70 leading-relaxed">
                                            The Bitcoin Halving occurs every 210,000 blocks (approx. 4 years). It cuts the block reward in half, reducing the rate at which new Bitcoin is created. This ensures Bitcoin's scarcity and controlled supply inflation.
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
