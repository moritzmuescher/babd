"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink } from "lucide-react"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  query: string
}

export function SearchModal({ isOpen, onClose, query }: SearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && query) {
      searchQuery(query)
    }
  }, [isOpen, query])

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

  const renderTransactionResult = (txData: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-400">Transaction Details</h3>
        <a
          href={`https://mempool.space/tx/${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-black/30 border-orange-500/25 p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge className={txData.status.confirmed ? "bg-green-500" : "bg-yellow-500"}>
                {txData.status.confirmed ? `Confirmed (Block ${txData.status.block_height})` : "Unconfirmed"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee:</span>
              <span className="text-white">{txData.fee.toLocaleString()} sat</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="text-white">{txData.size} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">vSize:</span>
              <span className="text-white">{txData.vsize} vBytes</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-3">Inputs ({txData.vin.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {txData.vin.map((vin: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="text-gray-400">Input {i + 1}:</div>
                <div className="text-white font-mono text-xs break-all">{vin.prevout.scriptpubkey_address}</div>
                <div className="text-yellow-400">{vin.prevout.value.toLocaleString()} sat</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-3">Outputs ({txData.vout.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {txData.vout.map((vout: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="text-gray-400">Output {i + 1}:</div>
                <div className="text-white font-mono text-xs break-all">{vout.scriptpubkey_address}</div>
                <div className="text-yellow-400">{vout.value.toLocaleString()} sat</div>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-400">Address Details</h3>
          <a
            href={`https://mempool.space/address/${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-green-400 font-semibold">{balance.toLocaleString()} sat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Received:</span>
                <span className="text-white">{addrData.chain_stats.funded_txo_sum.toLocaleString()} sat</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Spent:</span>
                <span className="text-white">{addrData.chain_stats.spent_txo_sum.toLocaleString()} sat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transactions:</span>
                <span className="text-white">{addrData.chain_stats.tx_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-3">UTXOs ({utxos.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {utxos.map((utxo, i) => (
              <div key={i} className="border-b border-gray-700 pb-2 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">UTXO {i + 1}:</div>
                    <div className="text-xs font-mono text-white break-all">
                      {utxo.txid}:{utxo.vout}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">{utxo.value.toLocaleString()} sat</div>
                    <Badge className={utxo.status.confirmed ? "bg-green-500" : "bg-yellow-500"}>
                      {utxo.status.confirmed ? `Block ${utxo.status.block_height}` : "Unconfirmed"}
                    </Badge>
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
      <DialogContent className="bg-black/90 border-orange-500/25 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-400">Search Results</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="mb-4 p-2 bg-gray-800/50 rounded font-mono text-sm break-all">{query}</div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <span className="ml-2 text-gray-400">Searching...</span>
            </div>
          )}

          {error && <div className="text-red-400 text-center py-4">{error}</div>}

          {result && result.type === "transaction" && renderTransactionResult(result.data)}
          {result && result.type === "address" && renderAddressResult(result.data, result.utxos)}
        </div>
      </DialogContent>
    </Dialog>
  )
}
