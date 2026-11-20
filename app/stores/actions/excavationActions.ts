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
import type { ExcavationZone, ProbeSubsystem } from '@/types/game'
import { playSound } from '@/hooks/useSound'
import { getVeteranRank } from '@/lib/excavationDefs'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'

// Excavation actions

// Builds a new probe, deducting RP
export function buildProbe(): void {
  const store = useGameStore.getState()

  if (store.activeChallengeRestrictions?.excavationDisabled) return
  if (!meetsProbeGateRequirements(store)) return
  if (!canBuildProbe(store)) return

  const id = nextProbeId(store.probes)

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - PROBE_COST_RP,
    probes: [
      ...s.probes,
      {
        id,
        status: 'idle' as const,
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: 0,
        subsystem: 'none',
        veteranRank: 0,
        expeditionsCompleted: 0
      }
    ]
  }))
  playSound('build')
}

// Launches a probe to a specific zone with designated subsystem
export function launchProbe(
  probeId: number,
  zone: ExcavationZone,
  subsystem: ProbeSubsystem = 'none',
  silent = false
): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.excavationDisabled) return
  const probe = store.probes.find((p) => p.id === probeId)
  if (!probe || probe.status !== 'idle') return

  const speedBonus = getSynthesizerRates(store).probeSpeedBonus
  const duration = getScanDuration(zone, subsystem, speedBonus)

  useGameStore.setState((s) => ({
    probes: s.probes.map((p) =>
      p.id === probeId
        ? {
            ...p,
            status: 'scanning' as const,
            zone,
            subsystem,
            timerRemaining: duration,
            scanDuration: duration
          }
        : p
    )
  }))
  if (!silent) playSound('probe')
}

// Processes probe completions - called from tick when timerRemaining hits 0
export function processProbeCompletions(): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.excavationDisabled) return
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
  let pityIncrement = 0
  const currentRelic9Pity = store.stats.relic9PityCount ?? 0
  const newRelics: number[] = []
  const updatedProbes = [...store.probes]

  for (const probe of completedProbes) {
    const isRiskZone = probe.zone === 'unstable' || probe.zone === 'void'
    if (isRiskZone && !store.unlockedRelics.includes(9)) {
      pityIncrement++
    }
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

    // Deterministic pity for Void Compass (Relic 9) by 8th Unstable/Void scan regardless of scan outcome
    if (
      isRiskZone &&
      !store.unlockedRelics.includes(9) &&
      !newRelics.includes(9) &&
      currentRelic9Pity + pityIncrement >= 8
    ) {
      newRelics.push(9)
    }

    if (result.probeDestroyed) {
      updatedProbes.splice(idx, 1)
    } else if (result.needsRepair) {
      let repairDuration =
        probe.zone === 'void' ? 1800 : UNSTABLE_RIFT_REPAIR_SECONDS
      if (probe.subsystem === 'shielding') {
        repairDuration = Math.round(repairDuration * 0.5)
      }
      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'repairing',
        zone: null,
        timerRemaining: 0,
        scanDuration: undefined,
        repairTimerRemaining: repairDuration,
        repairDuration
      }
    } else {
      const currentExp = probe.expeditionsCompleted ?? 0
      const newExp = currentExp + 1
      const oldRank = getVeteranRank(currentExp).rank
      const newRankInfo = getVeteranRank(newExp)

      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'idle',
        zone: null,
        timerRemaining: 0,
        scanDuration: undefined,
        repairTimerRemaining: 0,
        expeditionsCompleted: newExp,
        veteranRank: newRankInfo.rank
      }

      if (newRankInfo.rank > oldRank) {
        useUIStore.getState().pushAlert({
          priority: 2,
          variant: 'unlock',
          title: `Probe #${probe.id} Promoted`,
          message: `Veteran Rank ${newRankInfo.rank} (${newRankInfo.title}) attained: +${Math.round(newRankInfo.successBonus * 100)}% Success, +${Math.round((newRankInfo.dustMultiplier - 1) * 100)}% Dust.`,
          autoDismissMs: 4500
        })
      }
    }

    // Alert per probe
    if (result.success) {
      playSound('success')
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Returned',
        message: `${ZONE_MAP[probe.zone!].label} scan complete. +${result.dustEarned} Artifact Dust.`,
        autoDismissMs: 4000
      })
    } else if (result.probeDestroyed) {
      playSound('fail')
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'anomaly',
        title: 'Probe Destroyed',
        message: 'Void Depth scan failed. The probe has been lost.',
        autoDismissMs: 5000
      })
    } else if (result.needsRepair) {
      playSound('fail')
      const zoneLabel = probe.zone ? ZONE_MAP[probe.zone].label : 'Expedition'
      const repairMins =
        probe.zone === 'void'
          ? probe.subsystem === 'shielding'
            ? 15
            : 30
          : probe.subsystem === 'shielding'
            ? 5
            : 10
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Damaged',
        message: `${zoneLabel} scan failed. Probe entering repair cycle (${repairMins} min).`,
        autoDismissMs: 4000
      })
    }
  }

  const newRelicLevels = { ...store.relicLevels }
  for (const rId of newRelics) {
    if (!newRelicLevels[rId]) {
      newRelicLevels[rId] = 1
    }
  }

  useGameStore.setState((s) => ({
    probes: updatedProbes,
    artifactDust: s.artifactDust + totalDust,
    unlockedRelics:
      newRelics.length > 0
        ? [...new Set([...s.unlockedRelics, ...newRelics])]
        : s.unlockedRelics,
    relicLevels: newRelicLevels,
    stats:
      totalDust > 0 || pityIncrement > 0
        ? {
            ...s.stats,
            allTimeDust: (s.stats.allTimeDust ?? s.artifactDust) + totalDust,
            relic9PityCount: (s.stats.relic9PityCount ?? 0) + pityIncrement
          }
        : s.stats
  }))
  if (newRelics.length > 0) {
    const highestRelic = Math.max(...newRelics)
    const rarity =
      highestRelic >= 17
        ? 'mythical'
        : highestRelic >= 13
          ? 'legendary'
          : highestRelic >= 9
            ? 'epic'
            : highestRelic >= 5
              ? 'rare'
              : 'common'
    playSound(`relic-${rarity}`)
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Recovered',
      message: `A ${rarity} relic has been recovered from the excavation scan.`,
      autoDismissMs: 5000
    })
  }

  markAchievementsDirty()
}
