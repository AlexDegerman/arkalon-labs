'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  applyMegaprojectReward,
  getEffectiveConstructionCost,
  meetsMegaprojectRequirements,
  MEGAPROJECT_MAP
} from '@/lib/megaprojectDefs'
import { markUnlocksDirty } from '@/lib/dirtyFlags'
import { dispatchMegaprojectComplete } from '@/lib/dialogueDispatcher'
import type { MegaprojectId } from '@/types/game'

// Megaproject actions

// Activates a megaproject - begins absorbing passive RP toward construction
export function activateMegaproject(id: MegaprojectId): void {
  const store = useGameStore.getState()

  if (!meetsMegaprojectRequirements(id, store)) return
  if (store.activeMegaprojectId === id) return

  useGameStore.setState({
    activeMegaprojectId: id,
    megaprojectRPAbsorbed: 0n,
    megaprojectAllocationPercent: 10 // Default 10% allocation
  })
}

// Updates the allocation percentage (0-100)
export function setMegaprojectAllocation(percent: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  useGameStore.setState({ megaprojectAllocationPercent: clamped })
}

// Deactivates the current megaproject without completing it
// (progress is lost)
export function deactivateMegaproject(): void {
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
  if (!store.activeMegaprojectId) return

  const cost = getEffectiveConstructionCost(store.activeMegaprojectId, store)
  if (store.megaprojectRPAbsorbed < cost) return

  const id = store.activeMegaprojectId
  const rewardPatch = applyMegaprojectReward(id, store)

  useGameStore.setState((s) => ({
    ...rewardPatch,
    activeMegaprojectId: null,
    megaprojectRPAbsorbed: 0n,
    megaprojectAllocationPercent: 0,
    completedMegaprojects: [...s.completedMegaprojects, id]
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  dispatchMegaprojectComplete(id)

  const def = MEGAPROJECT_MAP[id]
  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'unlock',
    title: `${def?.name ?? 'Megaproject'} Complete`,
    message: def?.reward ?? 'Megaproject reward applied.',
    autoDismissMs: 8000
  })
}
