// WebSocket service for real-time mempool.space updates

type WebSocketMessage = {
  action?: string
  data?: any
  block?: any
  mempool?: any
  'mempool-blocks'?: any
  conversions?: any
}

type WebSocketCallback = (data: any) => void

type Subscription = {
  channel: string
  callback: WebSocketCallback
}

class MempoolWebSocketService {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, Set<WebSocketCallback>> = new Map()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 3000
  private isIntentionallyClosed = false
  private url = "wss://mempool.space/api/v1/ws"

  constructor() {
    if (typeof window !== "undefined") {
      this.connect()
    }
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected to mempool.space")
        this.reconnectAttempts = 0

        // Subscribe to all channels we're interested in
        this.send({
          action: "want",
          data: ["blocks", "stats", "mempool-blocks"],
        })

        // Resubscribe all existing subscriptions
        this.subscriptions.forEach((_, channel) => {
          this.send({ action: "want", data: [channel] })
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      this.ws.onclose = () => {
        console.log("WebSocket disconnected")
        this.ws = null

        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max WebSocket reconnection attempts reached")
      return
    }

    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})...`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle block updates
    if (message.block) {
      this.notify("blocks", message.block)
    }

    // Handle mempool-blocks updates
    if (message["mempool-blocks"]) {
      this.notify("mempool-blocks", message["mempool-blocks"])
    }

    // Handle stats updates
    if (message.conversions) {
      this.notify("stats", {
        conversions: message.conversions,
      })
    }

    // Handle raw data messages
    if (message.data) {
      this.notify("data", message.data)
    }
  }

  private notify(channel: string, data: any) {
    const callbacks = this.subscriptions.get(channel)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket callback for channel ${channel}:`, error)
        }
      })
    }
  }

  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  public subscribe(channel: string, callback: WebSocketCallback): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }

    this.subscriptions.get(channel)!.add(callback)

    // If WebSocket is already connected, subscribe to this channel
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ action: "want", data: [channel] })
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel)
        }
      }
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.subscriptions.clear()
  }

  public reconnect() {
    this.disconnect()
    this.isIntentionallyClosed = false
    this.reconnectAttempts = 0
    this.connect()
  }

  public getConnectionState(): number | null {
    return this.ws?.readyState ?? null
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsService: MempoolWebSocketService | null = null

export function getMempoolWebSocket(): MempoolWebSocketService {
  if (typeof window === "undefined") {
    // Return a mock service for SSR
    return {
      subscribe: () => () => {},
      disconnect: () => {},
      reconnect: () => {},
      getConnectionState: () => null,
      isConnected: () => false,
    } as any
  }

  if (!wsService) {
    wsService = new MempoolWebSocketService()
  }

  return wsService
}

export function disconnectMempoolWebSocket() {
  if (wsService) {
    wsService.disconnect()
    wsService = null
  }
}
