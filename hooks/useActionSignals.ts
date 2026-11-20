'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  getWorkspaceActionSignals,
  type ActionSignalMap
} from '@/lib/actionableSignals'

function mapsEqual(a: ActionSignalMap, b: ActionSignalMap): boolean {
  const keysA = Object.keys(a) as Array<keyof ActionSignalMap>
  const keysB = Object.keys(b) as Array<keyof ActionSignalMap>
  if (keysA.length !== keysB.length) return false
  return keysA.every((k) => a[k] === b[k])
}

// Polls actionable states at 1Hz without subscribing to 100ms RP ticks
export function useActionSignals(): ActionSignalMap {
  const [signals, setSignals] = useState<ActionSignalMap>(() =>
    getWorkspaceActionSignals(useGameStore.getState())
  )

  useEffect(() => {
    const update = () => {
      const next = getWorkspaceActionSignals(useGameStore.getState())
      setSignals((prev) => (mapsEqual(prev, next) ? prev : next))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return signals
}
