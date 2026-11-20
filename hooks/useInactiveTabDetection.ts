'use client'

import { useEffect, useRef } from 'react'
import { INACTIVE_TAB_THRESHOLD_SECONDS } from '@/constants/game'
import { dispatchTabInactive } from '@/lib/dialogueDispatcher'

// Detects when the user returns to the tab after a period of inactivity
// and dispatches an appropriate Arkalon dialogue line
export function useInactiveTabDetection() {
  const hiddenTimeRef = useRef<number | null>(null)
  const dispatchedRef = useRef(false)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenTimeRef.current = Date.now()
        return
      }

      if (document.visibilityState === 'visible') {
        if (hiddenTimeRef.current !== null) {
          const elapsed = (Date.now() - hiddenTimeRef.current) / 1000
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
          hiddenTimeRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
