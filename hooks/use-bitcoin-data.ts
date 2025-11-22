"use client"

import { useQuery } from "@tanstack/react-query"
import { MempoolAPI } from "@/lib/mempool-api"
import type {
  Block,
  ProjectedBlock,
  BitcoinStats,
  DifficultyData,
  HalvingData,
} from "@/lib/types"

/**
 * Hook to get the current block height
 * Note: Real-time updates come via WebSocket, this is fallback polling
 */
export function useCurrentHeight() {
  return useQuery({
    queryKey: ["blockHeight"],
    queryFn: MempoolAPI.getCurrentHeight,
    refetchInterval: 120000, // Refetch every 2 minutes (WebSocket provides real-time updates)
  })
}

/**
 * Hook to get recent blocks with weights
 * Note: Real-time updates come via WebSocket, this is fallback polling
 */
export function useRecentBlocks() {
  return useQuery({
    queryKey: ["recentBlocks"],
    queryFn: async () => {
      const blocks = await MempoolAPI.getRecentBlocks()
      return MempoolAPI.getBlocksWithWeights(blocks)
    },
    refetchInterval: 120000, // Refetch every 2 minutes (WebSocket provides real-time updates)
  })
}

/**
 * Hook to get older blocks from a specific height
 */
export function useOlderBlocks(startHeight: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["olderBlocks", startHeight],
    queryFn: async () => {
      if (!startHeight) return []
      const blocks = await MempoolAPI.getBlocksFromHeight(startHeight - 1)
      return MempoolAPI.getBlocksWithWeights(blocks.slice(0, 10))
    },
    enabled: enabled && startHeight !== null,
    staleTime: 5 * 60 * 1000, // Older blocks don't change, keep them fresh for 5 minutes
  })
}

/**
 * Hook to get projected/mempool blocks
 * Note: Real-time updates come via WebSocket, this is fallback polling
 */
export function useProjectedBlocks() {
  return useQuery({
    queryKey: ["projectedBlocks"],
    queryFn: MempoolAPI.getProjectedBlocks,
    refetchInterval: 60000, // Refetch every 60 seconds (WebSocket provides real-time updates)
  })
}

/**
 * Hook to get Bitcoin stats (price, mempool, fees)
 * Note: Real-time updates come via WebSocket, this is fallback polling
 */
export function useBitcoinStats(): {
  data: BitcoinStats | undefined
  isLoading: boolean
  error: Error | null
} {
  const { data: prices, isLoading: isPricesLoading, error: pricesError } = useQuery({
    queryKey: ["prices"],
    queryFn: MempoolAPI.getPrices,
    refetchInterval: 60000, // Refetch every 60 seconds (WebSocket provides updates)
  })

  const { data: mempool, isLoading: isMempoolLoading, error: mempoolError } = useQuery({
    queryKey: ["mempool"],
    queryFn: MempoolAPI.getMempoolInfo,
    refetchInterval: 60000,
  })

  const { data: fees, isLoading: isFeesLoading, error: feesError } = useQuery({
    queryKey: ["fees"],
    queryFn: MempoolAPI.getRecommendedFees,
    refetchInterval: 60000,
  })

  const isLoading = isPricesLoading || isMempoolLoading || isFeesLoading
  const error = pricesError || mempoolError || feesError

  const stats: BitcoinStats | undefined =
    prices && mempool && fees
      ? {
        price: prices.USD,
        mempoolSize: mempool.vsize / 1000000,
        highPriority: fees.fastestFee,
        unconfirmed: mempool.count,
        prices,
        mempool,
        fees,
      }
      : undefined

  return { data: stats, isLoading, error }
}

/**
 * Hook to get difficulty adjustment data
 * Note: Updates on new blocks via WebSocket
 */
export function useDifficultyData() {
  return useQuery({
    queryKey: ["difficultyAdjustment"],
    queryFn: async () => {
      const data = await MempoolAPI.getDifficultyAdjustment()

      const blocksIntoEpoch = (data.progressPercent * 2016) / 100
      const retargetDate = new Date(data.estimatedRetargetDate)
      const now = new Date()
      const msUntil = retargetDate.getTime() - now.getTime()
      const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24))

      const timeString = retargetDate.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })

      const difficultyData: DifficultyData = {
        progressPercent: data.progressPercent,
        difficultyChange: data.difficultyChange,
        previousChange: data.previousRetarget || 0,
        averageBlockTime: data.timeAvg / 60000,
        estimatedRetarget: `In ~${daysUntil} days (${timeString})`,
        blocksIntoEpoch: Math.round(blocksIntoEpoch),
      }

      return difficultyData
    },
    refetchInterval: 120000, // Refetch every 2 minutes (updates on new blocks via WebSocket)
  })
}

/**
 * Hook to get halving countdown data
 * Note: Updates on new blocks via WebSocket
 */
export function useHalvingData() {
  return useQuery({
    queryKey: ["halvingData"],
    queryFn: async () => {
      const currentHeight = await MempoolAPI.getCurrentHeight()
      const now = new Date()

      const halvingInterval = 210000
      const currentHalvingEpoch = Math.floor(currentHeight / halvingInterval)
      const nextHalvingBlock = (currentHalvingEpoch + 1) * halvingInterval
      const blocksRemaining = nextHalvingBlock - currentHeight
      const blocksSinceLastHalving = currentHeight - currentHalvingEpoch * halvingInterval
      const progressPercent = (blocksSinceLastHalving / halvingInterval) * 100

      const currentSubsidy = 50 / Math.pow(2, currentHalvingEpoch)
      const newSubsidy = currentSubsidy / 2

      const minutesRemaining = blocksRemaining * 10
      const estimatedDate = new Date(Date.now() + minutesRemaining * 60 * 1000)
      const yearsUntil = Math.floor(
        (estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365),
      )
      const daysUntil = Math.floor(
        ((estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) % 365,
      )
      const dateString = estimatedDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      const halvingData: HalvingData = {
        progressPercent,
        blocksRemaining,
        estimatedDate: `${dateString} (In ~${yearsUntil} years, ${daysUntil} days)`,
        newSubsidy,
        currentSubsidy,
      }

      return halvingData
    },
    refetchInterval: 120000, // Refetch every 2 minutes (updates on new blocks via WebSocket)
  })
}
