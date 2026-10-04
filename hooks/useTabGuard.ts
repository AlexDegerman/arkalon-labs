'use client'

import { useEffect, useState } from 'react'

// Detects duplicate browser tabs using BroadcastChannel.
// Returns boolean flag and calls optional callback when another active tab is detected.
export function useTabGuard(onDuplicateTab?: () => void): boolean {
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel('arkalon_labs_tab')

    channel.postMessage({ type: 'tab-open' })

    channel.onmessage = (event) => {
      if (event.data?.type === 'tab-open') {
        channel.postMessage({ type: 'tab-exists' })
      }
      if (event.data?.type === 'tab-exists') {
        setIsDuplicate(true)
        onDuplicateTab?.()
      }
    }

    return () => {
      channel.close()
    }
  }, [onDuplicateTab])

  return isDuplicate
}
