"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data is fresh for 60 seconds (WebSocket provides real-time updates)
            refetchOnWindowFocus: false, // Don't refetch on window focus (3D scene might be running)
            retry: 2, // Retry failed requests twice
            // Reduced polling frequency since WebSocket provides real-time updates
            // Polling now serves as fallback only
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
