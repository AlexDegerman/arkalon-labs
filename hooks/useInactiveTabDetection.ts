'use client'

import { useEffect, useRef } from 'react'
import { INACTIVE_TAB_THRESHOLD_SECONDS } from '@/constants/game'
import { dispatchTabInactive } from '@/lib/dialogueDispatcher'

// Detects when the user returns to the tab after a period of inactivity
// and dispatches an appropriate Arkalon dialogue line
export function useInactiveTabDetection() {
  const lastActiveRef = useRef<number>(Date.now())
  const dispatchedRef = useRef(false)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const elapsed = (Date.now() - lastActiveRef.current) / 1000
        if (
          elapsed >= INACTIVE_TAB_THRESHOLD_SECONDS &&
          !dispatchedRef.current
        ) {
          dispatchedRef.current = true
          dispatchTabInactive(elapsed)
          setTimeout(() => {
            dispatchedRef.current = false
          }, 5000)
        }
        lastActiveRef.current = Date.now()
      }
      // Do not update lastActiveRef on hidden - it should reflect last active time
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
