"use client"

import { Card } from "@/components/ui/card"

export function SocialLink() {
  return (
    <div className="absolute right-4 top-[41rem] md:top-[40rem] z-10 hidden md:block">
      <div className="hud-panel-right">
        <Card className="bg-black/30 border-orange-500/25 backdrop-blur-md p-2 hover:bg-orange-500/10 transition-colors cursor-pointer">
          <a
            href="https://x.com/babdcs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <img src="/images/twitter.png" alt="X logo" className="h-5 w-5" />
            <span className="text-orange-400 text-xs font-medium">@babdcs</span>
          </a>
        </Card>
      </div>
    </div>
  )
}
