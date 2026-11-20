'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  getEffectiveConstructionCost,
  meetsMegaprojectRequirements,
  MEGAPROJECT_MAP
} from '@/lib/megaprojectDefs'
import { markUnlocksDirty } from '@/lib/dirtyFlags'
import { dispatchMegaprojectComplete } from '@/lib/dialogueDispatcher'
import type { MegaprojectId } from '@/types/game'
import { playSound } from '@/hooks/useSound'

// Megaproject actions

// Activates a megaproject - begins absorbing passive RP toward construction
export function activateMegaproject(id: MegaprojectId): void {
  const store = useGameStore.getState()

  if (store.activeChallengeId) return
  if (!meetsMegaprojectRequirements(id, store)) return
  if (store.activeMegaprojectId === id) return

  const rememberedAlloc =
    store.lastMegaprojectAllocationPercent > 0
      ? store.lastMegaprojectAllocationPercent
      : 10

  playSound('click')
  useGameStore.setState({
    activeMegaprojectId: id,
    megaprojectRPAbsorbed: 0n,
    megaprojectAllocationPercent: rememberedAlloc
  })
}

// Updates the allocation percentage (0-100)
export function setMegaprojectAllocation(percent: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  useGameStore.setState({
    megaprojectAllocationPercent: clamped,
    ...(clamped > 0 ? { lastMegaprojectAllocationPercent: clamped } : {})
  })
}

// Deactivates the current megaproject without completing it
// (progress is lost)
export function deactivateMegaproject(): void {
  playSound('fail')
  useGameStore.setState({
    activeMegaprojectId: null,
    megaprojectRPAbsorbed: 0n,
    megaprojectAllocationPercent: 0
  })
}

// Checks if the active megaproject has received enough RP to complete
// Called from the tick loop
export function checkMegaprojectCompletion(): void {
  const store = useGameStore.getState()
  if (store.activeChallengeId) return
  if (!store.activeMegaprojectId) return

  const id = store.activeMegaprojectId
  const cost = getEffectiveConstructionCost(id, store)
  if (store.megaprojectRPAbsorbed < cost) return

  const def = MEGAPROJECT_MAP[id]

  if (id === 'dyson_swarm') {
    const nextLevel = (store.dysonSwarmLevel ?? 0) + 1
    useGameStore.setState({
      dysonSwarmLevel: nextLevel,
      megaprojectRPAbsorbed: 0n
    })

    playSound('fanfare')
    useGameStore.getState().recalcPPS()

    useUIStore.getState().pushAlert({
      priority: 0,
      variant: 'unlock',
      title: 'Dyson Swarm Array Completed',
      message: `Swarm Level ${nextLevel} operational (Asymptotic Exponent & +10% Global RP). Constructing next satellite array.`,
      autoDismissMs: 6000
    })
    return
  }

  useGameStore.setState((s) => ({
    activeMegaprojectId: null,
    megaprojectRPAbsorbed: 0n,
    megaprojectAllocationPercent: 0,
    completedMegaprojects: [...s.completedMegaprojects, id]
  }))

  playSound('fanfare')
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  dispatchMegaprojectComplete(id)

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'unlock',
    title: `${def?.name ?? 'Megaproject'} Complete`,
    message: def?.reward ?? 'Megaproject reward applied.',
    autoDismissMs: 8000
  })
}
