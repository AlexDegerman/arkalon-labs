'use client'

import { useEffect, useRef } from 'react'
import { tick } from '@/app/stores/gameActions'
import { TICK_INTERVAL_MS } from '@/constants/game'

// Establishes the 100ms game loop via setInterval
// Handles missed ticks when the tab is inactive by detecting large deltas
export function useGameLoop(enabled: boolean) {
  const lastTickTimeRef = useRef<number>(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) return

    lastTickTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickTimeRef.current
      lastTickTimeRef.current = now

      // If delta is much larger than expected (tab was inactive/sleeping),
      // apply accumulated ticks to prevent huge state jumps in a single frame
      const expectedTicks = Math.floor(delta / TICK_INTERVAL_MS)
      const ticksToApply = Math.min(expectedTicks, 50) // cap at 5 seconds catch-up

      for (let i = 0; i < ticksToApply; i++) {
        tick()
      }

      // Always apply at least one tick
      if (ticksToApply === 0) {
        tick()
      }
    }, TICK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled])
}
