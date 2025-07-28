"use client"

import { Card } from "@/components/ui/card"

export function SocialLink() {
  return (
    <div className="absolute left-4 bottom-20 md:top-1/2 md:bottom-auto md:transform md:-translate-y-1/2 z-10">
      <Card className="bg-black/50 border-orange-500/25 backdrop-blur-sm">
        <a
          href="https://x.com/babdcs"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 hover:bg-orange-500/10 transition-colors rounded-lg"
        >
          <img
            src="/images/twitter.png"
            alt="Follow @babdcs on X (Twitter)"
            className="w-12 h-12 hover:opacity-80 transition-opacity"
          />
        </a>
      </Card>
    </div>
  )
}

