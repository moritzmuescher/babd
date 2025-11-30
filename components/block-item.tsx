import React from "react";
import { Badge } from "@/components/ui/badge";
import { Block, ProjectedBlock } from "@/lib/types";
import { motion } from "framer-motion";

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
  blockCenterX?: number; // Block's center X position
  viewportCenterX?: number; // Viewport center X position
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
    blockCenterX,
    viewportCenterX,
  }: BlockItemProps) => {
    const weightPercentage = (block as Block)
      ? ((block as Block).weight ? Math.min(((block as Block).weight / MAX_BLOCK_WEIGHT_WU) * 100, 100) : 0)
      : 0;

    // Calculate 3D depth direction based on position relative to center
    const calculate3DDepth = () => {
      if (blockCenterX === undefined || viewportCenterX === undefined) {
        return { x: 6, y: 6 }; // Default depth
      }

      const distanceFromCenter = blockCenterX - viewportCenterX;
      const maxOffsetX = 6; // Maximum horizontal shadow offset in pixels
      const baseOffsetY = 6; // Base vertical shadow offset

      // Normalize distance (assuming max relevant distance is ~500px from center)
      const normalizedDistance = Math.max(-1, Math.min(1, distanceFromCenter / 500));

      // Calculate shadow offsets to create perspective toward center
      // Blocks on left (negative distance): shadow on right side (positive X)
      // Blocks on right (positive distance): shadow on left side (negative X)
      const shadowX = -normalizedDistance * maxOffsetX;
      const shadowY = baseOffsetY; // Consistent downward depth

      return {
        x: Math.round(shadowX),
        y: shadowY
      };
    };

    const depth = calculate3DDepth();

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
      const interpolatedShadowColor = getInterpolatedFeeColor?.(estimatedFeeRate, 0.5) || "rgba(0,0,0,0.5)";

      return (
        <motion.div
          layoutId={`block-${displayHeight}`}
          onClick={() => onClick(proj)}
          className="relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden scanline-container scanline-container-block-future bg-black/50"
          title={`Click to view estimated details for future block ${displayHeight}`}
          style={{
            zIndex: zIndex,
            transformStyle: "preserve-3d",
            perspective: 1000,
            borderColor: `${interpolatedFillColor.replace('0.4)', '0.5)')}`,
            boxShadow: `${depth.x}px ${depth.y}px 0px ${interpolatedShadowColor}, inset -1px -1px 0px rgba(255, 255, 255, 0.1), inset 1px 1px 0px rgba(0, 0, 0, 0.3)`
          }}
          animate={{ scale: scale }}
          whileHover={{
            scale: scale * 1.05,
            zIndex: zIndex + 10,
            rotateX: -2,
            rotateY: 1,
            y: -4,
            boxShadow: `${depth.x * 1.3}px ${depth.y * 1.3}px 0px ${interpolatedShadowColor.replace('0.5)', '0.6)')}, 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 20px ${interpolatedFillColor}, inset -1px -1px 0px rgba(255, 255, 255, 0.1), inset 1px 1px 0px rgba(0, 0, 0, 0.3)`,
          }}
          whileTap={{ scale: scale * 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Dynamic fill layer for future blocks */}
          <motion.div
            className="absolute bottom-0 left-0 w-full"
            initial={{ height: 0 }}
            animate={{
              height: `${projectedWeightPercentage}%`,
              backgroundColor: interpolatedFillColor
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
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
        </motion.div>
      );
    } else {
      // Past blocks
      const blockData = block as Block;
      const isCurrentBlock = blockData.height === currentHeight;

      return (
        <motion.div
          layoutId={`block-${blockData.height}`}
          onClick={() => onClick(blockData)}
          className={`relative flex-shrink-0 p-3 rounded-lg border text-center min-w-[100px] cursor-pointer overflow-hidden scanline-container scanline-container-block-past bg-black/50 ${isCurrentBlock ? "current-block current-block-pulse" : ""}`}
          title={`Click to view details for block ${blockData.height}`}
          style={{
            zIndex: zIndex,
            transformStyle: "preserve-3d",
            perspective: 1000,
            borderColor: isCurrentBlock ? "rgba(96, 165, 250, 0.8)" : "rgba(59, 130, 246, 0.3)",
            boxShadow: isCurrentBlock
              ? `${depth.x}px ${depth.y}px 0px rgba(29, 78, 216, 0.4), 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), inset -1px -1px 0px rgba(96, 165, 250, 0.2), inset 1px 1px 0px rgba(0, 0, 0, 0.3)`
              : `${depth.x}px ${depth.y}px 0px rgba(29, 78, 216, 0.4), inset -1px -1px 0px rgba(96, 165, 250, 0.2), inset 1px 1px 0px rgba(0, 0, 0, 0.3)`,
            // @ts-ignore - CSS variables for animation
            '--depth-x': `${depth.x}px`,
            '--depth-y': `${depth.y}px`,
            '--depth-x-hover': `${depth.x * 1.3}px`,
            '--depth-y-hover': `${depth.y * 1.3}px`
          }}
          animate={{ scale: scale }}
          whileHover={{
            scale: scale * 1.05,
            zIndex: zIndex + 10,
            rotateX: -2,
            rotateY: -1,
            y: -4,
            borderColor: "rgba(96, 165, 250, 1)",
            boxShadow: `${depth.x * 1.3}px ${depth.y * 1.3}px 0px rgba(29, 78, 216, 0.5), 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 25px rgba(59, 130, 246, 0.6), inset -1px -1px 0px rgba(96, 165, 250, 0.2), inset 1px 1px 0px rgba(0, 0, 0, 0.3)`
          }}
          whileTap={{ scale: scale * 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Blue fill layer */}
          <motion.div
            className="absolute bottom-0 left-0 w-full bg-blue-500/40"
            initial={{ height: 0 }}
            animate={{ height: `${weightPercentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
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
        </motion.div>
      );
    }
  }
);

BlockItem.displayName = "BlockItem";
