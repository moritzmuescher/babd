// Shared TypeScript types for the Bitcoin Timechain Explorer

export interface Block {
  height: number
  size: number
  tx_count: number
  timestamp: number
  id: string
  weight: number
  extras?: {
    totalFees: number
    pool: {
      id: number
      name: string
    }
  }
}

export interface ProjectedBlock {
  blockSize: number
  nTx: number
  feeRange: number[]
}

export interface BitcoinStats {
  price: number
  mempoolSize: number
  highPriority: number
  unconfirmed: number
}

export interface DifficultyData {
  progressPercent: number
  difficultyChange: number
  previousChange: number
  averageBlockTime: number
  estimatedRetarget: string
  blocksIntoEpoch: number
}

export interface HalvingData {
  progressPercent: number
  blocksRemaining: number
  estimatedDate: string
  newSubsidy: number
  currentSubsidy: number
}

// API Response types from mempool.space
export interface MempoolPriceResponse {
  USD: number
  EUR: number
  GBP: number
  CAD: number
  CHF: number
  AUD: number
  JPY: number
}

export interface MempoolInfoResponse {
  vsize: number
  count: number
  size: number
}

export interface RecommendedFeesResponse {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}

export interface DifficultyAdjustmentResponse {
  progressPercent: number
  difficultyChange: number
  previousRetarget: number
  timeAvg: number
  estimatedRetargetDate: number
}

export interface BlockDetailResponse {
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
  extras?: {
    totalFees: number
    medianFee: number
    feeRange: number[]
    reward: number
    pool: {
      id: number
      name: string
      slug: string
    }
  }
}
