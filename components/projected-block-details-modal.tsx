"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Clock, Hash } from "lucide-react"

interface ProjectedBlock {
  blockSize: number
  nTx: number
  feeRange: number[]
  estimatedTime: string
  height: number
}

interface ProjectedBlockDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  projectedBlock: ProjectedBlock | null
}

export function ProjectedBlockDetailsModal({ isOpen, onClose, projectedBlock }: ProjectedBlockDetailsModalProps) {
  if (!isOpen || !projectedBlock) return null

  const getAverageFeeRate = (feeRange: number[]) => {
    if (!feeRange || feeRange.length === 0) return "~1"
    const sortedFees = [...feeRange].sort((a, b) => a - b)
    const median = sortedFees[Math.floor(sortedFees.length / 2)]
    return `~${Math.round(median)} sat/vB`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-green-500/25 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-400 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Projected Block #{projectedBlock.height}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <Card className="bg-black/30 border-green-500/25 p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Estimated Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Time:</span>
                  <span className="text-white">{projectedBlock.estimatedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Size:</span>
                  <span className="text-white">{(projectedBlock.blockSize / 1000000).toFixed(2)} MB</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Transactions:</span>
                  <span className="text-white">{projectedBlock.nTx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Fee Rate:</span>
                  <span className="text-white">{getAverageFeeRate(projectedBlock.feeRange)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-black/30 border-gray-500/25 p-4">
            <h4 className="text-gray-400 font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Information
            </h4>
            <p className="text-sm text-gray-300">
              This block has not yet been mined. The details displayed are projections based on the current mempool
              state and network activity. Actual block details may vary once confirmed.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
