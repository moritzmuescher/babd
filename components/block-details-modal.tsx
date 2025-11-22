"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Copy, Check, Clock, Hash, Zap, Users } from "lucide-react"
import { motion } from "framer-motion"

interface BlockDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  blockHash: string | null
}

interface BlockDetails {
  id: string
  height: number
  version: number
  timestamp: number
  tx_count: number
  size: number
  weight: number
  merkle_root: string
  previousblockhash: string
  mediantime: number
  nonce: number
  bits: number
  difficulty: number
  chainwork: string
  nTx: number
  extras: {
    reward: number
    coinbaseRaw: string
    orphans: any[]
    feeRange: number[]
    totalFees: number
    avgFee: number
    avgFeeRate: number
    utxoSetChange: number
    avgTxSize: number
    totalInputs: number
    totalOutputs: number
    totalOutputAmt: number
    segwitTotalTxs: number
    segwitTotalSize: number
    segwitTotalWeight: number
  }
}

export function BlockDetailsModal({ isOpen, onClose, blockHash }: BlockDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [blockDetails, setBlockDetails] = useState<BlockDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && blockHash) {
      fetchBlockDetails(blockHash)
    }
  }, [isOpen, blockHash])

  const fetchBlockDetails = async (hash: string) => {
    setLoading(true)
    setError(null)
    setBlockDetails(null)

    try {
      const response = await fetch(`https://mempool.space/api/block/${hash}`)
      if (!response.ok) {
        throw new Error("Failed to fetch block details")
      }
      const data = await response.json()
      setBlockDetails(data)
    } catch (err) {
      setError("Error fetching block details. Please try again.")
      console.error("Error fetching block details:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatSats = (sats: number) => {
    return (sats / 100000000).toFixed(8) + " BTC"
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-orange-500/10 bg-orange-500/5">
          <DialogTitle className="text-orange-400 flex items-center gap-2 text-xl">
            <Hash className="w-6 h-6" />
            Block Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-orange-400 mb-4" />
              <span className="text-gray-400 animate-pulse">Retrieving block data from mempool...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center py-8 bg-red-500/10 rounded-lg border border-red-500/25">
              <div className="text-lg font-bold mb-2">Error Loading Block</div>
              {error}
            </div>
          )}

          {blockDetails && (
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
              {/* Hero Section: Height & Hash */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="relative"
              >
                <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full" />
                <div className="relative z-10 text-center mb-8">
                  <div className="text-sm text-orange-400/80 uppercase tracking-widest mb-1">Block Height</div>
                  <div className="text-6xl md:text-7xl font-bold text-white number-glow mb-4">
                    {blockDetails.height.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-center gap-2 max-w-2xl mx-auto bg-black/40 p-2 rounded-full border border-orange-500/20 backdrop-blur-sm">
                    <span className="font-mono text-xs md:text-sm text-gray-400 truncate px-2">
                      {blockDetails.id}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(blockDetails.id, "hash")}
                      className="h-8 w-8 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded-full"
                    >
                      {copiedField === "hash" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-full"
                    >
                      <a
                        href={`https://mempool.space/block/${blockDetails.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="bg-black/40 border-orange-500/20 p-4 h-full hover:bg-orange-500/5 transition-colors">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Timestamp</div>
                    <div className="text-white font-mono text-sm">{formatDate(blockDetails.timestamp)}</div>
                  </Card>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="bg-black/40 border-orange-500/20 p-4 h-full hover:bg-orange-500/5 transition-colors">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Size</div>
                    <div className="text-white font-mono text-lg">{formatBytes(blockDetails.size)}</div>
                  </Card>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="bg-black/40 border-orange-500/20 p-4 h-full hover:bg-orange-500/5 transition-colors">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Weight</div>
                    <div className="text-white font-mono text-lg">{blockDetails.weight.toLocaleString()} WU</div>
                  </Card>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="bg-black/40 border-orange-500/20 p-4 h-full hover:bg-orange-500/5 transition-colors">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Transactions</div>
                    <div className="text-white font-mono text-lg">{blockDetails.tx_count.toLocaleString()}</div>
                  </Card>
                </motion.div>
              </div>

              {/* Detailed Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Statistics */}
                {blockDetails.extras && (
                  <motion.div
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <Card className="bg-black/30 border-green-500/20 overflow-hidden h-full">
                      <div className="bg-green-500/10 p-3 border-b border-green-500/20 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-400" />
                        <h4 className="text-green-400 font-semibold">Fee Statistics</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center p-2 rounded bg-white/5">
                          <span className="text-gray-400 text-sm">Total Fees</span>
                          <span className="text-green-400 font-mono font-bold">{formatSats(blockDetails.extras.totalFees)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-gray-500 text-xs mb-1">Average Fee</div>
                            <div className="text-white font-mono">{blockDetails.extras.avgFee.toLocaleString()} sat</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs mb-1">Avg Fee Rate</div>
                            <div className="text-white font-mono">{blockDetails.extras.avgFeeRate.toFixed(1)} sat/vB</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-2">Fee Range (sat/vB)</div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-green-900 w-1/4" />
                            <div className="h-full bg-green-700 w-1/4" />
                            <div className="h-full bg-green-500 w-1/4" />
                            <div className="h-full bg-green-400 w-1/4" />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                            <span>{blockDetails.extras.feeRange[0]}</span>
                            <span>{blockDetails.extras.feeRange[blockDetails.extras.feeRange.length - 1]}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Transaction Details */}
                {blockDetails.extras && (
                  <motion.div
                    variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <Card className="bg-black/30 border-blue-500/20 overflow-hidden h-full">
                      <div className="bg-blue-500/10 p-3 border-b border-blue-500/20 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h4 className="text-blue-400 font-semibold">Transaction Details</h4>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center p-2 rounded bg-white/5">
                          <span className="text-gray-400 text-sm">Block Reward</span>
                          <span className="text-yellow-400 font-mono font-bold">{formatSats(blockDetails.extras.reward)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-black/20 rounded border border-white/5">
                            <div className="text-gray-500 text-[10px] uppercase">Avg Size</div>
                            <div className="text-white font-mono text-sm">{blockDetails.extras.avgTxSize.toFixed(0)} B</div>
                          </div>
                          <div className="p-2 bg-black/20 rounded border border-white/5">
                            <div className="text-gray-500 text-[10px] uppercase">Inputs</div>
                            <div className="text-white font-mono text-sm">{blockDetails.extras.totalInputs.toLocaleString()}</div>
                          </div>
                          <div className="p-2 bg-black/20 rounded border border-white/5">
                            <div className="text-gray-500 text-[10px] uppercase">Outputs</div>
                            <div className="text-white font-mono text-sm">{blockDetails.extras.totalOutputs.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* SegWit Mini-Section */}
                        {blockDetails.extras.segwitTotalTxs > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-purple-400 text-xs font-semibold">SegWit Adoption</span>
                              <span className="text-purple-300 text-xs font-mono">
                                {Math.round((blockDetails.extras.segwitTotalTxs / blockDetails.tx_count) * 100)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {blockDetails.extras.segwitTotalTxs.toLocaleString()} SegWit transactions
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Technical Details Collapsible (Visual only, always open for now) */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <Card className="bg-black/30 border-gray-500/20 p-4">
                  <h4 className="text-gray-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    Technical Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-1">Merkle Root</span>
                      <span className="text-gray-300 break-all bg-black/30 p-1.5 rounded border border-white/5">
                        {blockDetails.merkle_root}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-1">Previous Block</span>
                      <span className="text-gray-300 break-all bg-black/30 p-1.5 rounded border border-white/5">
                        {blockDetails.previousblockhash}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5 mt-2">
                      <span className="text-gray-500">Bits</span>
                      <span className="text-gray-300">{blockDetails.bits.toString(16)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5 mt-2">
                      <span className="text-gray-500">Nonce</span>
                      <span className="text-gray-300">{blockDetails.nonce.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-500">Version</span>
                      <span className="text-gray-300">{blockDetails.version}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-500">Difficulty</span>
                      <span className="text-gray-300">{blockDetails.difficulty.toExponential(2)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
