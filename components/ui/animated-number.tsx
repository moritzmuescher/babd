"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  className?: string
  decimals?: number
  duration?: number
  formatFn?: (value: number) => string
}

export function AnimatedNumber({
  value,
  className = "",
  decimals = 0,
  duration = 1000,
  formatFn,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    if (Math.abs(endValue - startValue) > 0.01) {
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      setDisplayValue(endValue)
      prevValueRef.current = endValue
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration])

  const formattedValue = formatFn
    ? formatFn(displayValue)
    : displayValue.toFixed(decimals)

  return (
    <span className={`tabular-nums ${className}`}>
      {formattedValue}
    </span>
  )
}
