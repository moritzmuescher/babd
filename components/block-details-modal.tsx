"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Copy, Check, Clock, Hash, Zap, Users } from "lucide-react"

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
      <DialogContent className="bg-black/95 border-orange-500/25 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-400 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Block Details
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <span className="ml-2 text-gray-400">Loading block details...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center py-8 bg-red-500/10 rounded-lg border border-red-500/25">
              {error}
            </div>
          )}

          {blockDetails && (
            <div className="space-y-6">
              {/* Block Header */}
              <Card className="bg-black/30 border-orange-500/25 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-orange-400">Block #{blockDetails.height}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(blockDetails.id, "hash")}
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 bg-transparent"
                    >
                      {copiedField === "hash" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 bg-transparent"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hash:</span>
                      <span className="font-mono text-xs text-white break-all max-w-[200px]">{blockDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-white">{formatDate(blockDetails.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white">{formatBytes(blockDetails.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight:</span>
                      <span className="text-white">{blockDetails.weight.toLocaleString()} WU</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transactions:</span>
                      <span className="text-white">{blockDetails.tx_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-white">{blockDetails.difficulty.toExponential(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nonce:</span>
                      <span className="text-white">{blockDetails.nonce.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version:</span>
                      <span className="text-white">{blockDetails.version}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transaction & Fee Statistics */}
              {blockDetails.extras && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/30 border-green-500/25 p-4">
                    <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Fee Statistics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Fees:</span>
                        <span className="text-green-400 font-semibold">
                          {formatSats(blockDetails.extras.totalFees)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average Fee:</span>
                        <span className="text-white">{blockDetails.extras.avgFee.toLocaleString()} sat</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average Fee Rate:</span>
                        <span className="text-white">{blockDetails.extras.avgFeeRate.toFixed(1)} sat/vB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fee Range:</span>
                        <span className="text-white">
                          {blockDetails.extras.feeRange[0]} -{" "}
                          {blockDetails.extras.feeRange[blockDetails.extras.feeRange.length - 1]} sat/vB
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-black/30 border-blue-500/25 p-4">
                    <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Transaction Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Block Reward:</span>
                        <span className="text-yellow-400 font-semibold">{formatSats(blockDetails.extras.reward)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average TX Size:</span>
                        <span className="text-white">{blockDetails.extras.avgTxSize.toFixed(0)} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Inputs:</span>
                        <span className="text-white">{blockDetails.extras.totalInputs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Outputs:</span>
                        <span className="text-white">{blockDetails.extras.totalOutputs.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* SegWit Statistics */}
              {blockDetails.extras && blockDetails.extras.segwitTotalTxs > 0 && (
                <Card className="bg-black/30 border-purple-500/25 p-4">
                  <h4 className="text-purple-400 font-semibold mb-3">SegWit Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">SegWit TXs:</span>
                      <span className="text-white">{blockDetails.extras.segwitTotalTxs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SegWit Size:</span>
                      <span className="text-white">{formatBytes(blockDetails.extras.segwitTotalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SegWit Weight:</span>
                      <span className="text-white">{blockDetails.extras.segwitTotalWeight.toLocaleString()} WU</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Technical Details */}
              <Card className="bg-black/30 border-gray-500/25 p-4">
                <h4 className="text-gray-400 font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Technical Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Merkle Root:</span>
                    <span className="font-mono text-xs text-white break-all max-w-[300px]">
                      {blockDetails.merkle_root}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Previous Block:</span>
                    <span className="font-mono text-xs text-white break-all max-w-[300px]">
                      {blockDetails.previousblockhash}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bits:</span>
                    <span className="text-white">{blockDetails.bits.toString(16)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chainwork:</span>
                    <span className="font-mono text-xs text-white break-all max-w-[300px]">
                      {blockDetails.chainwork}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
