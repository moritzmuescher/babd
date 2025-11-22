"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { MempoolInfoResponse, RecommendedFeesResponse } from "@/lib/types"

interface FeesModalProps {
    isOpen: boolean
    onClose: () => void
    fees?: RecommendedFeesResponse
}

export function FeesModal({ isOpen, onClose, fees }: FeesModalProps) {
    if (!fees) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-orange-400">Recommended Fees</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Current fee rates in sat/vB
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-orange-500/10">
                        <div className="flex flex-col">
                            <span className="text-orange-400 font-bold">High Priority</span>
                            <span className="text-xs text-gray-500">Next block</span>
                        </div>
                        <span className="text-2xl font-mono text-white">{fees.fastestFee}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-orange-500/10">
                        <div className="flex flex-col">
                            <span className="text-yellow-400 font-bold">Medium Priority</span>
                            <span className="text-xs text-gray-500">~30 minutes</span>
                        </div>
                        <span className="text-2xl font-mono text-white">{fees.halfHourFee}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-orange-500/10">
                        <div className="flex flex-col">
                            <span className="text-blue-400 font-bold">Low Priority</span>
                            <span className="text-xs text-gray-500">~1 hour</span>
                        </div>
                        <span className="text-2xl font-mono text-white">{fees.hourFee}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-orange-500/10">
                        <div className="flex flex-col">
                            <span className="text-gray-400 font-bold">No Priority</span>
                            <span className="text-xs text-gray-500">Economy</span>
                        </div>
                        <span className="text-2xl font-mono text-white">{fees.economyFee}</span>
                    </div>
                    <div className="text-xs text-center text-gray-500 pt-2">
                        Minimum relay fee: {fees.minimumFee} sat/vB
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface MempoolModalProps {
    isOpen: boolean
    onClose: () => void
    mempool?: MempoolInfoResponse
}

export function MempoolModal({ isOpen, onClose, mempool }: MempoolModalProps) {
    if (!mempool) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-orange-400">Mempool Status</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Current state of unconfirmed transactions
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-900/50 rounded-lg border border-orange-500/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">Transaction Count</div>
                            <div className="text-xl font-mono text-white">{mempool.count.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-gray-900/50 rounded-lg border border-orange-500/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">Total Size</div>
                            <div className="text-xl font-mono text-white">{(mempool.vsize / 1000000).toFixed(2)} MB</div>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-900/50 rounded-lg border border-orange-500/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Total Fees</span>
                            <span className="text-sm font-mono text-orange-400">{(mempool.total_fee || 0).toLocaleString()} sats</span>
                        </div>
                        {/* We could add more derived stats here if available */}
                        <div className="text-xs text-gray-500 text-center mt-2">
                            Waiting to be mined in upcoming blocks
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
