import React from "react"
import Home from "../../page"

export default async function DeepLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const initialQuery = decodeURIComponent(slug)
  return <Home initialQuery={initialQuery} />
}
