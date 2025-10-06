"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Share2, Check } from "lucide-react"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  query: string
}

type TxResult = any
type AddressResult = any
type UtxoResult = any[]

function isLikelyTxid(q: string) {
  return /^[0-9a-fA-F]{64}$/.test(q.trim())
}

function isLikelyAddress(q: string) {
  const s = q.trim()
  // P2PKH/P2SH (Base58) or Bech32 mainnet
  const base58 = /^[13][a-km-zA-HJ-NP-Z1-9]{25,40}$/
  const bech32 = /^bc1[ac-hj-np-z02-9]{11,71}$/i
  return base58.test(s) || bech32.test(s)
}

export function SearchModal({ isOpen, onClose, query }: SearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txResult, setTxResult] = useState<TxResult | null>(null)
  const [addrResult, setAddrResult] = useState<AddressResult | null>(null)
  const [utxos, setUtxos] = useState<UtxoResult | null>(null)
  const [copied, setCopied] = useState(false)

  const deepLink = useMemo(() => {
    if (!query) return ""
    if (typeof window === "undefined") return `/${encodeURIComponent(query)}`
    return `${window.location.origin}/${encodeURIComponent(query)}`
  }, [query])

  useEffect(() => {
    let abort = false
    async function run() {
      if (!isOpen || !query) return
      setLoading(true)
      setError(null)
      setTxResult(null)
      setAddrResult(null)
      setUtxos(null)
      try {
        const q = query.trim()
        if (isLikelyTxid(q)) {
          const res = await fetch(`https://mempool.space/api/tx/${q}`)
          if (!res.ok) throw new Error("TX not found")
          const data = await res.json()
          if (!abort) setTxResult(data)
        } else if (isLikelyAddress(q)) {
          const [addrRes, utxoRes] = await Promise.all([
            fetch(`https://mempool.space/api/address/${q}`),
            fetch(`https://mempool.space/api/address/${q}/utxo`),
          ])
          if (!addrRes.ok) throw new Error("Address not found")
          const addrData = await addrRes.json()
          const utxoData = utxoRes.ok ? await utxoRes.json() : []
          if (!abort) {
            setAddrResult(addrData)
            setUtxos(Array.isArray(utxoData) ? utxoData : [])
          }
        } else {
          throw new Error("Please enter a valid TxID or Bitcoin address.")
        }
      } catch (e: any) {
        if (!abort) setError(e?.message || "Error fetching data. Please try again.")
      } finally {
        if (!abort) setLoading(false)
      }
    }
    run()
    return () => {
      abort = true
    }
  }, [isOpen, query])

  async function shareOrCopy() {
    const url = deepLink
    try {
      if (navigator.share) {
        await navigator.share({ title: "Babd Timechain Explorer", text: query, url })
        return
      }
    } catch {
      // fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <DialogTitle className="truncate">Search result</DialogTitle>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[40ch]">{query}</span>
        <Button size="sm" variant="outline" onClick={shareOrCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span className="ml-2">{copied ? "Copied" : "Share"}</span>
        </Button>
      </div>
    </div>
  )

  function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-start gap-3 text-sm">
        <div className="min-w-28 text-muted-foreground">{label}</div>
        <div className="flex-1 break-all">{value}</div>
      </div>
    )
  }

  function External({ href, children }: { href: string; children: React.ReactNode }) {
    return (
      <a className="inline-flex items-center gap-1 underline hover:no-underline" href={href} target="_blank" rel="noreferrer">
        {children}
        <ExternalLink className="w-4 h-4" />
      </a>
    )
  }

  function renderTx(data: any) {
    const txid = data?.txid || data?.id || query
    return (
      <div className="space-y-4">
        <Card className="bg-black/30 border-orange-500/25 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge>Transaction</Badge>
              <span className="font-mono text-xs break-all">{txid}</span>
            </div>
            <External href={`https://mempool.space/tx/${txid}`}>Open in mempool.space</External>
          </div>
          <div className="mt-3 space-y-2">
            <Row label="Size" value={`${data?.size ?? data?.vsize ?? "—"} vB`} />
            <Row label="Weight" value={`${data?.weight ?? "—"} WU`} />
            <Row label="Fee" value={`${data?.fee?.toLocaleString?.() ?? data?.fee ?? "—"} sat`} />
            <Row label="Inputs" value={data?.vin?.length ?? 0} />
            <Row label="Outputs" value={data?.vout?.length ?? 0} />
          </div>
        </Card>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-2">Inputs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(data?.vin ?? []).map((vin: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="text-gray-400">Input {i + 1}:</div>
                <div className="font-mono text-xs break-all">{vin?.prevout?.scriptpubkey_address ?? "—"}</div>
                <div className="text-yellow-400">{vin?.prevout?.value?.toLocaleString?.() ?? vin?.prevout?.value ?? 0} sat</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-2">Outputs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(data?.vout ?? []).map((vout: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="text-gray-400">Output {i + 1}:</div>
                <div className="font-mono text-xs break-all">{vout?.scriptpubkey_address ?? "—"}</div>
                <div className="text-green-400">{vout?.value?.toLocaleString?.() ?? vout?.value ?? 0} sat</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  function renderAddress(addr: any, utxos: any[]) {
    const address = addr?.address ?? query
    return (
      <div className="space-y-4">
        <Card className="bg-black/30 border-orange-500/25 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge>Address</Badge>
              <span className="font-mono text-xs break-all">{address}</span>
            </div>
            <External href={`https://mempool.space/address/${address}`}>Open in mempool.space</External>
          </div>
          <div className="mt-3 space-y-2">
            <Row label="Funded TXOs" value={addr?.chain_stats?.funded_txo_count ?? "—"} />
            <Row label="Spent TXOs" value={addr?.chain_stats?.spent_txo_count ?? "—"} />
            <Row label="Total Received" value={`${addr?.chain_stats?.funded_txo_sum?.toLocaleString?.() ?? addr?.chain_stats?.funded_txo_sum ?? 0} sat`} />
            <Row label="Total Spent" value={`${addr?.chain_stats?.spent_txo_sum?.toLocaleString?.() ?? addr?.chain_stats?.spent_txo_sum ?? 0} sat`} />
            <Row label="Balance" value={`${(addr?.chain_stats?.funded_txo_sum ?? 0) - (addr?.chain_stats?.spent_txo_sum ?? 0)} sat`} />
          </div>
        </Card>

        <Card className="bg-black/30 border-orange-500/25 p-4">
          <h4 className="text-orange-400 font-semibold mb-2">UTXOs ({utxos?.length ?? 0})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(utxos ?? []).map((u: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="text-gray-400">TXID:</div>
                <div className="font-mono text-xs break-all">{u?.txid}</div>
                <div>Vout: {u?.vout}</div>
                <div className="text-green-400">Value: {u?.value?.toLocaleString?.() ?? u?.value ?? 0} sat</div>
                <div>Confirmed: {u?.status?.confirmed ? "Yes" : "No"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>{header}</DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">Searching…</span>
          </div>
        )}

        {!loading && error && <div className="text-red-400 text-center py-4">{error}</div>}

        {!loading && !error && txResult && renderTx(txResult)}
        {!loading && !error && addrResult && renderAddress(addrResult, utxos || [])}
      </DialogContent>
    </Dialog>
  )
}
