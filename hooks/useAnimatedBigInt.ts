'use client'

import { useRef, useEffect, useCallback } from 'react'
import { formatPoints, formatPointsShort, getAmountColor } from '@/lib/format'
import type { NotationMode } from '@/types/game'

interface AnimatedBigIntOptions {
  // Duration in ms for the number to animate toward the target
  duration?: number
  compact?: boolean
  notationMode?: NotationMode
}

// Zero-rerender animation of bigint display values via direct DOM ref writes
// Avoids React re-render overhead for high-frequency counters
export function useAnimatedBigInt(
  targetValue: bigint,
  options: AnimatedBigIntOptions = {}
) {
  const { duration = 150, compact = false, notationMode } = options

  const displayRef = useRef<HTMLElement | null>(null)
  const baseClassRef = useRef<string | null>(null)
  const rafRef = useRef<number>(0)
  const currentValRef = useRef<bigint>(targetValue)
  const startRef = useRef<bigint>(targetValue)
  const targetRef = useRef<bigint>(targetValue)
  const startTimeRef = useRef<number>(0)

  const animate = useCallback(
    (timestamp: number) => {
      if (!displayRef.current) return

      if (baseClassRef.current === null) {
        baseClassRef.current = displayRef.current.className || ''
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Cubic ease-out for smoother visual deceleration
      const eased = 1 - Math.pow(1 - progress, 3)

      const diff = targetRef.current - startRef.current
      // Pure bigint math prevents precision loss for values > Number.MAX_SAFE_INTEGER
      const current =
        startRef.current + (diff * BigInt(Math.floor(eased * 1000))) / 1000n

      currentValRef.current = current

      const formatted = compact
        ? formatPointsShort(current)
        : formatPoints(current)
      const colorClass = getAmountColor(current)

      displayRef.current.textContent = formatted
      displayRef.current.className = baseClassRef.current
        ? `${baseClassRef.current} ${colorClass}`.trim()
        : colorClass
      displayRef.current.setAttribute('data-text', formatted)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    },
    [duration, compact, notationMode]
  )

  useEffect(() => {
    startRef.current = currentValRef.current
    targetRef.current = targetValue
    startTimeRef.current = performance.now()

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [targetValue, animate])

  return displayRef
}
