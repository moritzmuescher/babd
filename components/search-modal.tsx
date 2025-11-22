"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, Copy, Check, ArrowRight, ArrowLeft, Wallet, Coins, HardDrive, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  query: string
}

export function SearchModal({ isOpen, onClose, query }: SearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && query) {
      searchQuery(query)
    }
  }, [isOpen, query])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const searchQuery = async (searchQuery: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    const isTxId = /^[0-9a-fA-F]{64}$/.test(searchQuery)
    const isAddress =
      /^(1|3)[1-9A-HJ-NP-Za-km-z]{33}$/.test(searchQuery) ||
      /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/.test(searchQuery)

    if (!isTxId && !isAddress) {
      setError("Invalid TxID or Bitcoin Address")
      setLoading(false)
      return
    }

    try {
      if (isTxId) {
        const txData = await (await fetch(`https://mempool.space/api/tx/${searchQuery}`)).json()
        setResult({ type: "transaction", data: txData })
      } else if (isAddress) {
        const [addrData, utxoData] = await Promise.all([
          fetch(`https://mempool.space/api/address/${searchQuery}`).then((r) => r.json()),
          fetch(`https://mempool.space/api/address/${searchQuery}/utxo`).then((r) => r.json()),
        ])
        setResult({ type: "address", data: addrData, utxos: utxoData })
      }
    } catch (err) {
      setError("Error fetching data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ label, value, icon: Icon, subValue }: any) => (
    <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center space-x-3">
      <div className="p-2 bg-orange-500/10 rounded-full">
        <Icon className="w-4 h-4 text-orange-400" />
      </div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
        {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      </div>
    </div>
  )

  const renderTransactionResult = (txData: any) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
        </div>
        <a
          href={`https://mempool.space/tx/${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>View on Mempool</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Status"
          value={txData.status.confirmed ? "Confirmed" : "Unconfirmed"}
          subValue={txData.status.confirmed ? `Block ${txData.status.block_height}` : undefined}
          icon={Activity}
        />
        <StatCard
          label="Fee"
          value={`${txData.fee.toLocaleString()} sat`}
          icon={Coins}
        />
        <StatCard
          label="Size"
          value={`${txData.size} B`}
          icon={HardDrive}
        />
        <StatCard
          label="Virtual Size"
          value={`${txData.vsize} vB`}
          icon={HardDrive}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/20 border-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center">
              <ArrowRight className="w-4 h-4 mr-2 text-green-400" />
              Inputs ({txData.vin.length})
            </h4>
          </div>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {txData.vin.map((vin: any, i: number) => (
              <div key={i} className="bg-black/40 p-3 rounded border border-white/5 text-sm group hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-gray-500">#{i}</span>
                  <span className="text-orange-400 font-mono">{vin.prevout ? `${vin.prevout.value.toLocaleString()} sat` : "Coinbase"}</span>
                </div>
                {vin.prevout?.scriptpubkey_address ? (
                  <Link
                    href={`/address/${vin.prevout.scriptpubkey_address}`}
                    className="text-xs text-gray-300 font-mono break-all opacity-70 group-hover:opacity-100 transition-opacity hover:text-orange-400 hover:underline block"
                  >
                    {vin.prevout.scriptpubkey_address}
                  </Link>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic opacity-50">
                    No address available
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-black/20 border-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2 text-red-400" />
              Outputs ({txData.vout.length})
            </h4>
          </div>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {txData.vout.map((vout: any, i: number) => (
              <div key={i} className="bg-black/40 p-3 rounded border border-white/5 text-sm group hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-gray-500">#{i}</span>
                  <span className="text-orange-400 font-mono">{vout.value.toLocaleString()} sat</span>
                </div>
                {vout.scriptpubkey_address ? (
                  <Link
                    href={`/address/${vout.scriptpubkey_address}`}
                    className="text-xs text-gray-300 font-mono break-all opacity-70 group-hover:opacity-100 transition-opacity hover:text-orange-400 hover:underline block"
                  >
                    {vout.scriptpubkey_address}
                  </Link>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic opacity-50">
                    No address available
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderAddressResult = (addrData: any, utxos: any[]) => {
    const balance = addrData.chain_stats.funded_txo_sum - addrData.chain_stats.spent_txo_sum

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Address Details</h3>
          </div>
          <a
            href={`https://mempool.space/address/${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View on Mempool</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Balance"
            value={`${balance.toLocaleString()} sat`}
            icon={Wallet}
          />
          <StatCard
            label="Total Received"
            value={`${addrData.chain_stats.funded_txo_sum.toLocaleString()} sat`}
            icon={ArrowRight}
          />
          <StatCard
            label="Total Spent"
            value={`${addrData.chain_stats.spent_txo_sum.toLocaleString()} sat`}
            icon={ArrowLeft}
          />
          <StatCard
            label="Transactions"
            value={addrData.chain_stats.tx_count.toLocaleString()}
            icon={Activity}
          />
        </div>

        <Card className="bg-black/20 border-white/10 p-4 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Coins className="w-4 h-4 mr-2 text-yellow-400" />
            UTXOs ({utxos.length})
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {utxos.map((utxo, i) => (
              <div key={i} className="bg-black/40 p-3 rounded border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">UTXO #{i + 1}</span>
                      <Badge variant="outline" className={`text-[10px] h-5 ${utxo.status.confirmed ? "text-green-400 border-green-400/30" : "text-yellow-400 border-yellow-400/30"}`}>
                        {utxo.status.confirmed ? `Block ${utxo.status.block_height}` : "Unconfirmed"}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-gray-300 break-all truncate">
                      {utxo.txid}:{utxo.vout}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-orange-400 font-mono text-sm">{utxo.value.toLocaleString()} sat</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Search Results
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="relative group">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 font-mono text-xs text-gray-300 break-all pr-10">
              {query}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 animate-spin text-orange-400 relative z-10" />
              </div>
              <span className="text-sm text-gray-400 animate-pulse">Fetching blockchain data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result.type === "transaction" && renderTransactionResult(result.data)}
              {result.type === "address" && renderAddressResult(result.data, result.utxos)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

