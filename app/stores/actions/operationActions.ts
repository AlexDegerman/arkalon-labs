'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  calculateOperationPoints,
  OPERATION_ARTIFACT_MAP,
  getCurrentCycle
} from '@/lib/operationDefs'
import {
  dispatchOperationArtifact,
  dispatchOperationStart
} from '@/lib/dialogueDispatcher'
import type { OperationArtifactId } from '@/types/game'

// Operations actions

// Awards operation points from a resolved operation anomaly
export function earnOperationPoints(
  anomalyType: string,
  interactionScore: number
): void {
  const points = calculateOperationPoints(anomalyType, interactionScore)
  if (points <= 0) return

  useGameStore.setState((s) => ({
    currentOperationPoints: s.currentOperationPoints + points
  }))
}

// Purchases an operation artifact with operation points
export function buyOperationArtifact(artifactId: OperationArtifactId): void {
  const store = useGameStore.getState()
  const def = OPERATION_ARTIFACT_MAP[artifactId]
  if (!def) return

  if (store.operationArtifactsUnlocked.includes(artifactId)) return
  if (store.currentOperationPoints < def.cost) return

  useGameStore.setState((s) => ({
    currentOperationPoints: s.currentOperationPoints - def.cost,
    operationArtifactsUnlocked: [...s.operationArtifactsUnlocked, artifactId]
  }))

  useGameStore.getState().recalcPPS()
  useUIStore.getState().pushAlert({
    priority: 2,
    variant: 'unlock',
    title: 'Operation Artifact Acquired',
    message: `${def.name}: ${def.effect}`,
    autoDismissMs: 5000
  })
  dispatchOperationArtifact()
}

// Checks if the operation cycle has advanced and initializes new cycle state
// Called on game load from loadState Server Action
export function checkOperationCycle(serverCycleNumber: number): void {
  const store = useGameStore.getState()
  if (store.currentOperationCycle === serverCycleNumber) return

  // New cycle started
  useGameStore.setState((s) => ({
    currentOperationCycle: serverCycleNumber
    // Carry over points but reset to new cycle context
    // Operation artifacts are permanent - do not reset
  }))

  dispatchOperationStart()
  useUIStore.getState().pushAlert({
    priority: 2,
    variant: 'unlock',
    title: 'New Operation Cycle',
    message: `${getCurrentCycle(serverCycleNumber).name} operation has begun.`,
    autoDismissMs: 6000
  })
}
