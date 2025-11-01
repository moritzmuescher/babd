import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Block, ProjectedBlock } from "@/components/block-explorer";

interface BlockItemProps {
  block: Block | ProjectedBlock;
  currentHeight: number;
  isProjected: boolean;
  scale: number;
  zIndex: number;
  onClick: (block: Block | ProjectedBlock) => void;
  formatTimeAgo?: (timestamp: number) => string;
  getEstimatedTime?: (indexInReversedArray: number) => string;
  getAverageFeeRate?: (feeRange: number[]) => string;
  getInterpolatedFeeColor?: (feeRate: number, alpha?: number) => string;
  index: number; // For projected blocks to calculate estimated time
  futureHeight?: number; // New optional prop for projected blocks
}

const MAX_BLOCK_WEIGHT_WU = 4000000;
const BYTES_TO_WU_RATIO = 4;

export const BlockItem = React.memo(
  ({
    block,
    currentHeight,
    isProjected,
    scale,
    zIndex,
    onClick,
    formatTimeAgo,
    getEstimatedTime,
    getAverageFeeRate,
    getInterpolatedFeeColor,
    index,
    futureHeight,
  }: BlockItemProps) => {
    const weightPercentage = (block as Block)
      ? ((block as Block).weight ? Math.min(((block as Block).weight / MAX_BLOCK_WEIGHT_WU) * 100, 100) : 0)
      : 0;

    if (isProjected) {
      const proj = block as ProjectedBlock;
      const displayHeight = futureHeight || currentHeight + (index || 0); // Fallback if futureHeight is not provided
      const estimatedWeightWU = proj.blockSize * BYTES_TO_WU_RATIO;
      const projectedWeightPercentage = estimatedWeightWU
        ? Math.min((estimatedWeightWU / MAX_BLOCK_WEIGHT_WU) * 100, 100)
        : 0;

      const estimatedFeeRate = Number.parseFloat(
        (getAverageFeeRate?.(proj.feeRange) || "~1").replace("~", "")
      );
      const interpolatedFillColor = getInterpolatedFeeColor?.(estimatedFeeRate, 0.4) || "rgba(0,0,0,0.4)";
      const interpolatedTextColor = getInterpolatedFeeColor?.(estimatedFeeRate) || "white";

      return (
        <div
          onClick={() => onClick(proj)}
          className="relative flex-shrink-0 p-3 rounded-lg text-center min-w-[100px] cursor-pointer overflow-hidden transition-all duration-100"
          title={`Click to view estimated details for future block ${displayHeight}`}
          style={{ transform: `scale(${scale})`, zIndex: zIndex }}
        >
          {/* Dynamic fill layer for future blocks */}
          <div
            className="absolute bottom-0 left-0 w-full transition-all duration-300"
            style={{
              height: `${projectedWeightPercentage}%`,
              backgroundColor: interpolatedFillColor,
            }}
          ></div>
          {/* Content layer */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-xl font-bold mb-1" style={{ color: interpolatedTextColor }}>
                {displayHeight}
              </div>
              <div className="text-xs text-white space-y-1">
                <div>{(proj.blockSize / 1000000).toFixed(2)} MB</div>
                <div>{proj.nTx.toLocaleString()} TX</div>
                <div className="text-gray-400">
                  {getAverageFeeRate?.(proj.feeRange) || "~1"} sat/vB
                </div>
              </div>
            </div>
            <Badge
              className="mt-2 text-white text-xs self-center"
              style={{ backgroundColor: interpolatedTextColor }}
            >
              in {getEstimatedTime?.(index || 0)}
            </Badge>
          </div>
        </div>
      );
    } else {
      // Past blocks
      const blockData = block as Block;
      return (
        <div
          onClick={() => onClick(blockData)}
          className={`relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden transition-all duration-200 ${
            blockData.height === currentHeight
              ? "border-blue-400 bg-black/50 shadow-lg shadow-blue-500/30 current-block hover:shadow-blue-500/50"
              : "border-blue-500/30 bg-black/50 hover:border-blue-400/50"
          }`}
          title={`Click to view details for block ${blockData.height}`}
          style={{ transform: `scale(${scale})`, zIndex: zIndex }}
        >
          {/* Blue fill layer */}
          <div
            className="absolute bottom-0 left-0 w-full bg-blue-500/40 transition-all duration-300"
            style={{ height: `${weightPercentage}%` }}
          ></div>
          {/* Content layer */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-xl font-bold text-blue-400 mb-1">{blockData.height}</div>
              <div className="text-xs text-white space-y-1">
                <div>{(blockData.size / 1000000).toFixed(2)} MB</div>
                <div>{blockData.tx_count.toLocaleString()} TX</div>
                <div className="text-gray-400">
                  {blockData.weight ? `${(blockData.weight / 1000000).toFixed(2)} MWU` : "-- MWU"}
                </div>
              </div>
            </div>
            <Badge className="mt-2 bg-blue-500 text-white text-xs self-center hover:bg-blue-500">
              {formatTimeAgo?.(blockData.timestamp)}
            </Badge>
          </div>
        </div>
      );
    }
  }
);

BlockItem.displayName = "BlockItem";
