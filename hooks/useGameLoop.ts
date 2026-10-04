'use client'

import { useEffect, useRef } from 'react'
import { tick } from '@/app/stores/gameActions'
import { TICK_INTERVAL_MS } from '@/constants/game'

// Maximum catch-up ticks per interval when the tab was inactive
// Caps at 5 seconds worth of missed ticks to prevent huge jumps
const MAX_CATCHUP_TICKS = 50

// Establishes the 100ms game loop via setInterval
// Handles missed ticks from tab inactivity via delta detection
export function useGameLoop(enabled: boolean) {
  // Track last tick time outside React state to avoid re-render on each tick
  const lastTickTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enabledRef = useRef(enabled)

  // Keep ref in sync with prop without triggering effect re-run
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) return

    lastTickTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      // Check enabled via ref to avoid stale closure
      if (!enabledRef.current) return

      const now = Date.now()
      const delta = now - lastTickTimeRef.current
      lastTickTimeRef.current = now

      // Normal case: delta close to TICK_INTERVAL_MS
      if (delta <= TICK_INTERVAL_MS * 1.5) {
        tick()
        return
      }

      // Tab was inactive: apply accumulated ticks (capped)
      const missedTicks = Math.floor(delta / TICK_INTERVAL_MS)
      const ticksToApply = Math.min(missedTicks, MAX_CATCHUP_TICKS)

      for (let i = 0; i < ticksToApply; i++) {
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
