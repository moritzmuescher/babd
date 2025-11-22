"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Clock, Hash, Zap, Database, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface ProjectedBlock {
  blockSize: number
  nTx: number
  feeRange: number[]
  estimatedTime: string
  height: number
  medianFee?: number
  totalFees?: number
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
    return Math.round(median)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const medianFee = getAverageFeeRate(projectedBlock.feeRange)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-green-500/25 text-white max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-green-500/10 bg-green-500/5">
          <DialogTitle className="text-green-400 flex items-center gap-2 text-xl">
            <Hash className="w-6 h-6" />
            Projected Block Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {/* Hero Section: Height & Time */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="relative"
            >
              <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full" />
              <div className="relative z-10 text-center mb-8">
                <div className="text-sm text-green-400/80 uppercase tracking-widest mb-1">Projected Height</div>
                <div className="text-6xl md:text-7xl font-bold text-white number-glow mb-2">
                  {projectedBlock.height.toLocaleString()}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-mono">
                  <Clock className="w-3 h-3" />
                  Expected in {projectedBlock.estimatedTime}
                </div>
              </div>
            </motion.div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="bg-black/40 border-green-500/20 p-4 h-full hover:bg-green-500/5 transition-colors">
                  <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                    <Database className="w-3 h-3" />
                    Size
                  </div>
                  <div className="text-white font-mono text-xl">{formatBytes(projectedBlock.blockSize)}</div>
                </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="bg-black/40 border-green-500/20 p-4 h-full hover:bg-green-500/5 transition-colors">
                  <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                    <Hash className="w-3 h-3" />
                    Transactions
                  </div>
                  <div className="text-white font-mono text-xl">{projectedBlock.nTx.toLocaleString()}</div>
                </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="bg-black/40 border-green-500/20 p-4 h-full hover:bg-green-500/5 transition-colors">
                  <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                    <Zap className="w-3 h-3" />
                    Median Fee
                  </div>
                  <div className="text-white font-mono text-xl">~{medianFee} sat/vB</div>
                </Card>
              </motion.div>
            </div>

            {/* Fee Range Visualization */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <Card className="bg-black/30 border-green-500/20 p-5">
                <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  Fee Range Projection
                </h4>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Min Fee</span>
                      <span>Max Fee</span>
                    </div>
                    <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex relative">
                      {/* Gradient bar representing fee range */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-500 to-green-300 opacity-80" />
                    </div>
                    <div className="flex justify-between text-sm font-mono text-white mt-2">
                      <span>{projectedBlock.feeRange[0]} sat/vB</span>
                      <span>{projectedBlock.feeRange[projectedBlock.feeRange.length - 1]} sat/vB</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-green-500/50" />
                      This block is currently being built in the mempool. The transactions included and their fees are subject to change until a miner successfully finds the block.
                    </p>
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
