'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { PROBE_COST_RP, UNSTABLE_RIFT_REPAIR_SECONDS } from '@/constants/game'
import {
  meetsProbeGateRequirements,
  canBuildProbe,
  nextProbeId,
  getScanDuration,
  rollProbeResult,
  ZONE_MAP
} from '@/lib/excavationDefs'
import { markAchievementsDirty } from '@/lib/dirtyFlags'
import type { ExcavationZone } from '@/types/game'

// Excavation actions

// Builds a new probe, deducting RP
export function buildProbe(): void {
  const store = useGameStore.getState()

  if (!meetsProbeGateRequirements(store)) return
  if (!canBuildProbe(store)) return

  const id = nextProbeId()

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - PROBE_COST_RP,
    probes: [
      ...s.probes,
      {
        id,
        status: 'idle' as const,
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: 0
      }
    ]
  }))
}

// Launches a probe to a specific zone
export function launchProbe(probeId: number, zone: ExcavationZone): void {
  const store = useGameStore.getState()
  const probe = store.probes.find((p) => p.id === probeId)
  if (!probe || probe.status !== 'idle') return

  const duration = getScanDuration(zone, store)

  useGameStore.setState((s) => ({
    probes: s.probes.map((p) =>
      p.id === probeId
        ? { ...p, status: 'scanning' as const, zone, timerRemaining: duration }
        : p
    )
  }))
}

// Processes probe completions - called from tick when timerRemaining hits 0
export function processProbeCompletions(): void {
  const store = useGameStore.getState()
  const completedProbes = store.probes.filter(
    (p) => p.status === 'scanning' && p.timerRemaining <= 0
  )

  if (completedProbes.length === 0) {
    // Check repairs
    const repairsComplete = store.probes.filter(
      (p) => p.status === 'repairing' && p.repairTimerRemaining <= 0
    )
    if (repairsComplete.length > 0) {
      useGameStore.setState((s) => ({
        probes: s.probes.map((p) =>
          p.status === 'repairing' && p.repairTimerRemaining <= 0
            ? {
                ...p,
                status: 'idle' as const,
                zone: null,
                repairTimerRemaining: 0
              }
            : p
        )
      }))
    }
    return
  }

  let totalDust = 0
  const newRelics: number[] = []
  const updatedProbes = [...store.probes]

  for (const probe of completedProbes) {
    const result = rollProbeResult(probe, store)
    const idx = updatedProbes.findIndex((p) => p.id === probe.id)
    if (idx === -1) continue

    totalDust += result.dustEarned

    if (
      result.relicDropped > 0 &&
      !store.unlockedRelics.includes(result.relicDropped)
    ) {
      newRelics.push(result.relicDropped)
    }

    if (result.probeDestroyed) {
      updatedProbes.splice(idx, 1)
    } else if (result.needsRepair) {
      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'repairing',
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: UNSTABLE_RIFT_REPAIR_SECONDS
      }
    } else {
      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'idle',
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: 0
      }
    }

    // Alert per probe
    if (result.success) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Returned',
        message: `${ZONE_MAP[probe.zone!].label} scan complete. +${result.dustEarned} Artifact Dust.`,
        autoDismissMs: 4000
      })
    } else if (result.probeDestroyed) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'anomaly',
        title: 'Probe Destroyed',
        message: 'Void Depth scan failed. The probe has been lost.',
        autoDismissMs: 5000
      })
    } else if (result.needsRepair) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Damaged',
        message:
          'Unstable Rift scan failed. Probe entering repair cycle (10 min).',
        autoDismissMs: 4000
      })
    }
  }

  useGameStore.setState((s) => ({
    probes: updatedProbes,
    artifactDust: s.artifactDust + totalDust,
    unlockedRelics:
      newRelics.length > 0
        ? [...new Set([...s.unlockedRelics, ...newRelics])]
        : s.unlockedRelics
  }))

  if (newRelics.length > 0) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Recovered',
      message: 'A relic has been recovered from the excavation scan.',
      autoDismissMs: 5000
    })
  }

  markAchievementsDirty()
}
