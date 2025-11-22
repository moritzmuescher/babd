// API service layer for mempool.space
import type {
  Block,
  ProjectedBlock,
  MempoolPriceResponse,
  MempoolInfoResponse,
  RecommendedFeesResponse,
  DifficultyAdjustmentResponse,
  BlockDetailResponse,
} from "./types"

const BASE_URL = "https://mempool.space/api"

class MempoolAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
  ) {
    super(message)
    this.name = "MempoolAPIError"
  }
}

async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new MempoolAPIError(
        `Failed to fetch from ${url}`,
        response.status,
        response.statusText,
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof MempoolAPIError) {
      throw error
    }
    throw new MempoolAPIError(
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export class MempoolAPI {
  /**
   * Get the current block height (tip of the chain)
   */
  static async getCurrentHeight(): Promise<number> {
    const heightText = await fetchWithErrorHandling<string>(`${BASE_URL}/blocks/tip/height`)
    return Number.parseInt(heightText, 10)
  }

  /**
   * Get the current block hash (tip of the chain)
   */
  static async getTipHash(): Promise<string> {
    return fetchWithErrorHandling<string>(`${BASE_URL}/blocks/tip/hash`)
  }

  /**
   * Get the most recent blocks (default: 10)
   */
  static async getRecentBlocks(): Promise<Block[]> {
    return fetchWithErrorHandling<Block[]>(`${BASE_URL}/blocks`)
  }

  /**
   * Get blocks starting from a specific height
   */
  static async getBlocksFromHeight(startHeight: number): Promise<Block[]> {
    return fetchWithErrorHandling<Block[]>(`${BASE_URL}/blocks/${startHeight}`)
  }

  /**
   * Get detailed information about a specific block by hash
   */
  static async getBlockDetails(blockHash: string): Promise<BlockDetailResponse> {
    return fetchWithErrorHandling<BlockDetailResponse>(`${BASE_URL}/block/${blockHash}`)
  }

  /**
   * Get projected/mempool blocks (future blocks)
   */
  static async getProjectedBlocks(): Promise<ProjectedBlock[]> {
    return fetchWithErrorHandling<ProjectedBlock[]>(`${BASE_URL}/v1/fees/mempool-blocks`)
  }

  /**
   * Get current Bitcoin price in various currencies
   */
  static async getPrices(): Promise<MempoolPriceResponse> {
    return fetchWithErrorHandling<MempoolPriceResponse>(`${BASE_URL}/v1/prices`)
  }

  /**
   * Get mempool information (size, count)
   */
  static async getMempoolInfo(): Promise<MempoolInfoResponse> {
    return fetchWithErrorHandling<MempoolInfoResponse>(`${BASE_URL}/mempool`)
  }

  /**
   * Get recommended fee rates
   */
  static async getRecommendedFees(): Promise<RecommendedFeesResponse> {
    return fetchWithErrorHandling<RecommendedFeesResponse>(`${BASE_URL}/v1/fees/recommended`)
  }

  /**
   * Get difficulty adjustment information
   */
  static async getDifficultyAdjustment(): Promise<DifficultyAdjustmentResponse> {
    return fetchWithErrorHandling<DifficultyAdjustmentResponse>(`${BASE_URL}/v1/difficulty-adjustment`)
  }

  /**
   * Fetch blocks with their weight information
   * This is a composite operation that fetches block list and details
   */
  static async getBlocksWithWeights(blocks: Block[]): Promise<Block[]> {
    return Promise.all(
      blocks.map(async (block) => {
        try {
          const details = await this.getBlockDetails(block.id)
          return {
            ...block,
            weight: typeof details.weight === "number" ? details.weight : 0,
          }
        } catch (error) {
          console.error(`Error fetching weight for block ${block.height}:`, error)
          return { ...block, weight: 0 }
        }
      }),
    )
  }
}
