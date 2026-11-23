'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  OPERATION_ARTIFACT_MAP,
  getCurrentCycle,
  getAttunementCost,
  getTemporalCost
} from '@/lib/operationDefs'
import {
  dispatchOperationArtifact,
  dispatchOperationStart
} from '@/lib/dialogueDispatcher'
import type { OperationArtifactId } from '@/types/game'
import { playSound } from '@/hooks/useSound'
import { awardRelic } from './relicActions'

// Operations actions

export function retuneCosmicEpoch(cycleNumber: number): void {
  const store = useGameStore.getState()
  if (!store.unlocks.anomalousOperations) return

  const cycle = getCurrentCycle(cycleNumber)
  const effectiveCycle =
    store.manualOperationCycle ??
    getCurrentCycle(store.currentOperationCycle).cycleNumber
  if (effectiveCycle === cycle.cycleNumber) {
    return
  }
  useGameStore.setState({ manualOperationCycle: cycle.cycleNumber })
  playSound('success')

  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'unlock',
    title: 'Observation Epoch Retuned',
    message: `Facility aligned with ${cycle.name}. Future Operation Anomalies will use this phase.`,
    autoDismissMs: 5000
  })
}

export function buyRepeatableCosmicSink(type: 'attunement' | 'temporal'): void {
  const store = useGameStore.getState()
  const points = store.currentOperationPoints

  if (type === 'attunement') {
    const currentLevel = store.cosmicAttunementLevel ?? 0
    const cost = getAttunementCost(currentLevel)
    if (points < cost) return

    useGameStore.setState({
      currentOperationPoints: points - cost,
      cosmicAttunementLevel: currentLevel + 1
    })

    playSound('purchase')
    useGameStore.getState().recalcPPS()
  } else {
    const currentLevel = store.cosmicTemporalLevel ?? 0
    const cost = getTemporalCost(currentLevel)
    if (cost <= 0 || points < cost) return

    useGameStore.setState({
      currentOperationPoints: points - cost,
      cosmicTemporalLevel: currentLevel + 1
    })

    playSound('purchase')
  }
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

  playSound('purchase')
  useGameStore.getState().recalcPPS()
  useUIStore.getState().pushAlert({
    priority: 2,
    variant: 'unlock',
    title: 'Operation Artifact Acquired',
    message: `${def.name}: ${def.effect}`,
    autoDismissMs: 5000
  })
  dispatchOperationArtifact()

  if (store.operationArtifactsUnlocked.length + 1 >= 3) {
    awardRelic(13)
  }
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

  // Silently sync cycle before Anomalous Operations is unlocked
  if (!store.unlocks.anomalousOperations) return

  dispatchOperationStart()
  useUIStore.getState().pushAlert({
    priority: 2,
    variant: 'unlock',
    title: 'New Operation Cycle',
    message: `${getCurrentCycle(serverCycleNumber).name} operation has begun.`,
    autoDismissMs: 6000
  })
}
