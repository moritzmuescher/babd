import React from "react"
import Home from "../../page"

export default function DeepLinkPage({ params }: { params: { slug: string } }) {
  const initialQuery = decodeURIComponent(params.slug)
  return <Home initialQuery={initialQuery} />
}
