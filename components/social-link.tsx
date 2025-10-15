"use client"

import { Card } from "@/components/ui/card"

export function SocialLink() {
  return (
    <div className="absolute right-4 top-[41rem] md:top-[40rem] z-10">
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
