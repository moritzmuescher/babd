"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Copy,
  Check,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react"

interface StoredToken {
  id: string
  token: string
  amount: number
  timestamp: number
  redeemed: boolean
  note?: string
}

interface Stats {
  totalReceived: number
  unredeemedAmount: number
  redeemedAmount: number
  totalTokens: number
  unredeemedTokens: number
}

export default function AdminDonationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [tokens, setTokens] = useState<StoredToken[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set())
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set())

  // Check authentication status
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/session")
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchTokens()
      }
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsAuthenticated(true)
        setPassword("")
        fetchTokens()
      } else {
        setLoginError(data.error || "Login failed")
      }
    } catch {
      setLoginError("Network error")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      setIsAuthenticated(false)
      setTokens([])
      setStats(null)
    } catch {
      // Still log out locally
      setIsAuthenticated(false)
    }
  }

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/tokens")
      if (res.status === 401) {
        setIsAuthenticated(false)
        return
      }

      const data = await res.json()
      setTokens(data.tokens || [])
      setStats(data.stats || null)
    } catch {
      setError("Failed to fetch tokens")
    } finally {
      setLoading(false)
    }
  }, [])

  const copyToken = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError("Failed to copy")
    }
  }

  const toggleShowToken = (id: string) => {
    setShowTokens((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectToken = (id: string) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllUnredeemed = () => {
    const unredeemed = tokens.filter((t) => !t.redeemed).map((t) => t.id)
    setSelectedTokens(new Set(unredeemed))
  }

  const clearSelection = () => {
    setSelectedTokens(new Set())
  }

  const markAsRedeemed = async (tokenIds: string[]) => {
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenIds, redeemed: true }),
      })

      if (res.ok) {
        fetchTokens()
        setSelectedTokens(new Set())
      } else {
        setError("Failed to update tokens")
      }
    } catch {
      setError("Network error")
    }
  }

  const markAsUnredeemed = async (tokenIds: string[]) => {
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenIds, redeemed: false }),
      })

      if (res.ok) {
        fetchTokens()
        setSelectedTokens(new Set())
      } else {
        setError("Failed to update tokens")
      }
    } catch {
      setError("Network error")
    }
  }

  const deleteRedeemed = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all redeemed tokens?"
      )
    ) {
      return
    }

    try {
      const res = await fetch("/api/admin/tokens", { method: "DELETE" })

      if (res.ok) {
        fetchTokens()
      } else {
        setError("Failed to delete tokens")
      }
    } catch {
      setError("Network error")
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const truncateToken = (token: string) => {
    if (token.length <= 40) return token
    return `${token.slice(0, 20)}...${token.slice(-20)}`
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-black/50 border-orange-500/25 p-6 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-orange-500 mr-2" />
            <h1 className="text-xl font-bold text-orange-400">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="mb-4 bg-black/50 border-orange-500/25 text-orange-200 placeholder:text-orange-400/50"
              autoFocus
            />

            {loginError && (
              <div className="text-red-400 text-sm mb-4">{loginError}</div>
            )}

            <Button
              type="submit"
              disabled={loginLoading || !password}
              className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/25 hover:bg-orange-500/30"
            >
              {loginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Login
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-400">
            Cashu Donations
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={fetchTokens}
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-orange-200 hover:bg-orange-500/10"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-orange-200 hover:bg-orange-500/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-black/50 border-orange-500/25 p-4">
              <div className="text-orange-400/70 text-xs mb-1">
                Total Received
              </div>
              <div className="text-orange-200 text-xl font-bold">
                {stats.totalReceived.toLocaleString()} sats
              </div>
            </Card>
            <Card className="bg-black/50 border-orange-500/25 p-4">
              <div className="text-orange-400/70 text-xs mb-1">Unredeemed</div>
              <div className="text-green-400 text-xl font-bold">
                {stats.unredeemedAmount.toLocaleString()} sats
              </div>
            </Card>
            <Card className="bg-black/50 border-orange-500/25 p-4">
              <div className="text-orange-400/70 text-xs mb-1">Redeemed</div>
              <div className="text-orange-200/50 text-xl font-bold">
                {stats.redeemedAmount.toLocaleString()} sats
              </div>
            </Card>
            <Card className="bg-black/50 border-orange-500/25 p-4">
              <div className="text-orange-400/70 text-xs mb-1">Tokens</div>
              <div className="text-orange-200 text-xl font-bold">
                {stats.unredeemedTokens} / {stats.totalTokens}
              </div>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={selectAllUnredeemed}
            variant="ghost"
            size="sm"
            className="text-orange-400 hover:text-orange-200 hover:bg-orange-500/10 border border-orange-500/25"
          >
            Select All Unredeemed
          </Button>
          {selectedTokens.size > 0 && (
            <>
              <Button
                onClick={clearSelection}
                variant="ghost"
                size="sm"
                className="text-orange-400 hover:text-orange-200 hover:bg-orange-500/10 border border-orange-500/25"
              >
                Clear ({selectedTokens.size})
              </Button>
              <Button
                onClick={() => markAsRedeemed(Array.from(selectedTokens))}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-200 hover:bg-green-500/10 border border-green-500/25"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark Redeemed
              </Button>
              <Button
                onClick={() => markAsUnredeemed(Array.from(selectedTokens))}
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-200 hover:bg-yellow-500/10 border border-yellow-500/25"
              >
                Mark Unredeemed
              </Button>
            </>
          )}
          {stats && stats.totalTokens - stats.unredeemedTokens > 0 && (
            <Button
              onClick={deleteRedeemed}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-200 hover:bg-red-500/10 border border-red-500/25 ml-auto"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete Redeemed
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Token List */}
        <div className="space-y-2">
          {loading && tokens.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : tokens.length === 0 ? (
            <Card className="bg-black/50 border-orange-500/25 p-8 text-center">
              <div className="text-orange-400/70">No donations yet</div>
            </Card>
          ) : (
            tokens.map((token) => (
              <Card
                key={token.id}
                className={`bg-black/50 border-orange-500/25 p-3 ${
                  token.redeemed ? "opacity-50" : ""
                } ${selectedTokens.has(token.id) ? "ring-2 ring-orange-500" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTokens.has(token.id)}
                    onChange={() => toggleSelectToken(token.id)}
                    className="mt-1 accent-orange-500"
                  />

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-lg font-bold ${token.redeemed ? "text-orange-400/50" : "text-orange-200"}`}
                      >
                        {token.amount > 0
                          ? `${token.amount.toLocaleString()} sats`
                          : "Unknown amount"}
                      </span>
                      {token.redeemed && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Redeemed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-orange-400/50 mb-2">
                      {formatDate(token.timestamp)}
                    </div>

                    {/* Note */}
                    {token.note && (
                      <div className="text-sm text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded px-2 py-1 mb-2">
                        <span className="text-orange-400/70 text-xs mr-1">Note:</span>
                        {token.note}
                      </div>
                    )}

                    {/* Token string */}
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-orange-400/70 bg-black/50 px-2 py-1 rounded flex-1 overflow-hidden">
                        {showTokens.has(token.id)
                          ? token.token
                          : truncateToken(token.token)}
                      </code>
                      <Button
                        onClick={() => toggleShowToken(token.id)}
                        variant="ghost"
                        size="sm"
                        className="text-orange-400/70 hover:text-orange-200 p-1 h-auto"
                      >
                        {showTokens.has(token.id) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => copyToken(token.token, token.id)}
                        variant="ghost"
                        size="sm"
                        className="text-orange-400/70 hover:text-orange-200 p-1 h-auto"
                      >
                        {copiedId === token.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Instructions */}
        <Card className="bg-black/50 border-orange-500/25 p-4 mt-6">
          <h3 className="text-orange-400 font-medium mb-2">How to redeem</h3>
          <ol className="text-orange-400/70 text-sm space-y-1 list-decimal list-inside">
            <li>Copy a Cashu token using the copy button</li>
            <li>
              Open a Cashu wallet (e.g., Minibits, Nutstash, eNuts)
            </li>
            <li>Paste/receive the token in your wallet</li>
            <li>Come back here and mark the token as redeemed</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
