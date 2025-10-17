import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Babd Timechain Explorer",
  description: "Bitcoin blockchain explorer with 3D visualization",
  icons: {
    icon: "/images/logo2.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/images/logo2.png" type="image/png" />
      </head>
      <body className={`${inter.className} bg-black`}>{children}</body>
    </html>
  )
}


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}
