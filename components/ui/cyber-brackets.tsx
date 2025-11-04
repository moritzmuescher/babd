import type React from "react"

interface CyberBracketsProps {
  children: React.ReactNode
  className?: string
}

export function CyberBrackets({ children, className = "" }: CyberBracketsProps) {
  return (
    <div className={`cyber-brackets hover-lift ${className}`}>
      {children}
    </div>
  )
}
