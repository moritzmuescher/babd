"use client"

import { Card } from "@/components/ui/card"
import { useWebSocketStatus } from "@/hooks/use-websocket"

export function WebSocketStatus() {
  const { isConnected } = useWebSocketStatus()

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <Card className="bg-black/30 border-orange-500/25 backdrop-blur-md px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
          />
          <span className={isConnected ? "text-green-400" : "text-gray-400"}>
            {isConnected ? "Live Updates" : "Polling"}
          </span>
        </div>
      </Card>
    </div>
  )
}
