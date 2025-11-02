"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getMempoolWebSocket } from "@/lib/websocket-service"
import { MempoolAPI } from "@/lib/mempool-api"
import type { Block } from "@/lib/types"

/**
 * Hook to subscribe to real-time block updates via WebSocket
 * Automatically updates React Query cache when new blocks arrive
 */
export function useBlocksWebSocket() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = getMempoolWebSocket()

    // Check initial connection state
    setIsConnected(ws.isConnected())

    // Subscribe to new blocks
    const unsubscribe = ws.subscribe("blocks", async (block: Block) => {
      console.log("🔔 New block received via WebSocket:", block.height)

      try {
        // Fetch full block details with weight
        const blockDetails = await MempoolAPI.getBlockDetails(block.id)
        const fullBlock: Block = {
          ...block,
          weight: blockDetails.weight,
        }

        // Update current height
        queryClient.setQueryData(["blockHeight"], block.height)

        // Update recent blocks - add to front and remove oldest
        queryClient.setQueryData(["recentBlocks"], (oldData: Block[] | undefined) => {
          if (!oldData) return [fullBlock]

          // Add new block to front, keep only 10 most recent
          const updated = [fullBlock, ...oldData].slice(0, 10)
          return updated
        })

        // Invalidate difficulty and halving data to refetch with new height
        queryClient.invalidateQueries({ queryKey: ["difficultyAdjustment"] })
        queryClient.invalidateQueries({ queryKey: ["halvingData"] })
      } catch (error) {
        console.error("Error processing WebSocket block update:", error)
      }
    })

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setIsConnected(ws.isConnected())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(checkConnection)
    }
  }, [queryClient])

  return { isConnected }
}

/**
 * Hook to subscribe to real-time mempool-blocks updates via WebSocket
 */
export function useMempoolBlocksWebSocket() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = getMempoolWebSocket()

    setIsConnected(ws.isConnected())

    const unsubscribe = ws.subscribe("mempool-blocks", (mempoolBlocks: any[]) => {
      console.log("🔔 Mempool blocks updated via WebSocket")

      // Update projected blocks cache
      queryClient.setQueryData(["projectedBlocks"], mempoolBlocks)
    })

    const checkConnection = setInterval(() => {
      setIsConnected(ws.isConnected())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(checkConnection)
    }
  }, [queryClient])

  return { isConnected }
}

/**
 * Hook to subscribe to real-time stats updates via WebSocket
 */
export function useStatsWebSocket() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = getMempoolWebSocket()

    setIsConnected(ws.isConnected())

    const unsubscribe = ws.subscribe("stats", (stats: any) => {
      console.log("🔔 Stats updated via WebSocket")

      // Update price data if available
      if (stats.conversions) {
        queryClient.setQueryData(["prices"], stats.conversions)
      }

      // Refresh other stats
      queryClient.invalidateQueries({ queryKey: ["mempool"] })
      queryClient.invalidateQueries({ queryKey: ["fees"] })
    })

    const checkConnection = setInterval(() => {
      setIsConnected(ws.isConnected())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(checkConnection)
    }
  }, [queryClient])

  return { isConnected }
}

/**
 * Master hook that enables all WebSocket subscriptions
 * Use this in your main app component
 */
export function useMempoolWebSocket() {
  const blocks = useBlocksWebSocket()
  const mempoolBlocks = useMempoolBlocksWebSocket()
  const stats = useStatsWebSocket()

  const isConnected = blocks.isConnected || mempoolBlocks.isConnected || stats.isConnected

  return {
    isConnected,
    blocks: blocks.isConnected,
    mempoolBlocks: mempoolBlocks.isConnected,
    stats: stats.isConnected,
  }
}

/**
 * Hook to get WebSocket connection status
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<{
    isConnected: boolean
    state: number | null
  }>({
    isConnected: false,
    state: null,
  })

  useEffect(() => {
    const ws = getMempoolWebSocket()

    const checkStatus = () => {
      setStatus({
        isConnected: ws.isConnected(),
        state: ws.getConnectionState(),
      })
    }

    checkStatus()
    const interval = setInterval(checkStatus, 2000)

    return () => clearInterval(interval)
  }, [])

  return status
}
