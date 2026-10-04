'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useTabGuard } from '@/hooks/useTabGuard'

// Handles game initialization and starts the game loop
// Runs entirely client-side after hydration
export default function GameBootstrap() {
  const initialized = useGameStore((s) => s._initialized)
  const setInitialized = useGameStore((s) => s.setInitialized)
  const applyState = useGameStore((s) => s.applyState)
  const isDuplicate = useTabGuard()
  const bootedRef = useRef(false)

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    // Load from localStorage (cloud load wired in Commit 7.3)
    try {
      const saved = localStorage.getItem('arkalon_labs_save')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Deserialize bigint strings - full deserializer in Commit 7.1
        if (parsed.researchPoints) {
          applyState({
            researchPoints: BigInt(parsed.researchPoints),
            lifetimePoints: BigInt(parsed.lifetimePoints ?? '0')
          })
        }
      }
    } catch {
      // Corrupted save - start fresh
    }

    setInitialized(true)
  }, [applyState, setInitialized])

  // Start game loop once initialized and not a duplicate tab
  useGameLoop(initialized && !isDuplicate)

  // Duplicate tab overlay
  if (isDuplicate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--bg-primary)">
        <div className="glass rounded-lg border border-(--border-default) p-8 max-w-sm mx-4 text-center">
          <p className="text-sm font-mono text-(--text-accent) mb-2">
            Arkalon Laboratories is running in another tab.
          </p>
          <p className="text-xs text-(--text-secondary)">
            Close this tab or switch to the other one to continue.
          </p>
        </div>
      </div>
    )
  }

  return null
}
