import type {
  ExcavationZone,
  GameState,
  ProbeState,
  ProbeSubsystem
} from '@/types/game'
import { getCurrentEra } from '@/lib/eraThresholds'
import type { ProbeResultPayload } from '@/types/excavation'
import {
  PROBE_GATE_SERVER_CLUSTERS,
  PROBE_GATE_QUANTUM_COMPUTERS,
  MAX_PROBES,
  PROBE_COST_RP,
  UNSTABLE_RIFT_REPAIR_SECONDS
} from '@/constants/game'

export interface SubsystemDefinition {
  id: ProbeSubsystem
  label: string
  description: string
  icon: string
}

export const SUBSYSTEM_DEFINITIONS: SubsystemDefinition[] = [
  {
    id: 'none',
    label: 'Standard',
    description: 'Baseline telemetry without specialized hardware.',
    icon: '○'
  },
  {
    id: 'shielding',
    label: 'Aegis Shielding',
    description:
      '-50% repair time on failed scans (1.5m Unstable, 6m Void, 15m Singularity, 30m Omega).',
    icon: '🛡'
  },
  {
    id: 'thrusters',
    label: 'Tachyon Thrusters',
    description: '-35% mission scan duration across all sectors.',
    icon: '⚡'
  },
  {
    id: 'siphon',
    label: 'Deep-Core Siphon',
    description: '+50% Artifact Dust yield and +5% flat relic drop chance.',
    icon: '⚗'
  }
]

export interface VeteranRankDefinition {
  rank: number
  title: string
  expRequired: number
  successBonus: number
  dustMultiplier: number
}

export const VETERAN_RANKS: VeteranRankDefinition[] = [
  {
    rank: 0,
    title: 'Rookie',
    expRequired: 0,
    successBonus: 0,
    dustMultiplier: 1.0
  },
  {
    rank: 1,
    title: 'Explorer',
    expRequired: 1,
    successBonus: 0.05,
    dustMultiplier: 1.1
  },
  {
    rank: 2,
    title: 'Pathfinder',
    expRequired: 3,
    successBonus: 0.1,
    dustMultiplier: 1.2
  },
  {
    rank: 3,
    title: 'Vanguard',
    expRequired: 6,
    successBonus: 0.15,
    dustMultiplier: 1.3
  },
  {
    rank: 4,
    title: 'Voidwalker',
    expRequired: 10,
    successBonus: 0.2,
    dustMultiplier: 1.4
  },
  {
    rank: 5,
    title: 'Apex Drone',
    expRequired: 15,
    successBonus: 0.25,
    dustMultiplier: 1.5
  }
]

export function getVeteranRank(exp: number): VeteranRankDefinition {
  let highest = VETERAN_RANKS[0]
  for (const r of VETERAN_RANKS) {
    if (exp >= r.expRequired) highest = r
    else break
  }
  return highest
}

export interface ZoneDefinition {
  zone: ExcavationZone
  label: string
  description: string
  successRate: number // 0-1
  durationSeconds: number
  dustYieldMin: number
  dustYieldMax: number
  opYieldMin: number
  opYieldMax: number
  researchCutFraction: number
  anomalyIgniteChance: number
  relicDropChance: number // 0-1
  repairSeconds: number
  salvageDust: number
  duplicateRelicDust: number
  unlockHint?: string
  failureDescription: string
}

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    zone: 'safe',
    label: 'Safe Sectors',
    description: 'Stable space with no risk. Fast-turnaround reconnaissance.',
    successRate: 1.0,
    durationSeconds: 300, // 5 minutes
    dustYieldMin: 8,
    dustYieldMax: 16,
    opYieldMin: 0,
    opYieldMax: 0,
    researchCutFraction: 0,
    anomalyIgniteChance: 0,
    relicDropChance: 0,
    repairSeconds: 0,
    salvageDust: 0,
    duplicateRelicDust: 0,
    failureDescription: 'N/A'
  },
  {
    zone: 'unstable',
    label: 'Unstable Rifts',
    description:
      'Volatile sub-space rift. Moderate Dust, Operation Points, and Relic 9 drops.',
    successRate: 0.75,
    durationSeconds: 1200, // 20 minutes
    dustYieldMin: 45,
    dustYieldMax: 90,
    opYieldMin: 2,
    opYieldMax: 6,
    researchCutFraction: 0,
    anomalyIgniteChance: 0,
    relicDropChance: 0.05,
    repairSeconds: UNSTABLE_RIFT_REPAIR_SECONDS,
    salvageDust: 0,
    duplicateRelicDust: 75,
    failureDescription: 'Probe enters 3-minute repair cycle.'
  },
  {
    zone: 'void',
    label: 'Void Depths',
    description:
      'Medium-range survey. High Dust, Operation Points, and -5% active Research skips.',
    successRate: 0.6,
    durationSeconds: 7200, // 2 hours
    dustYieldMin: 300,
    dustYieldMax: 600,
    opYieldMin: 20,
    opYieldMax: 45,
    researchCutFraction: 0.05,
    anomalyIgniteChance: 0,
    relicDropChance: 0.15,
    repairSeconds: 720,
    salvageDust: 40,
    duplicateRelicDust: 200,
    unlockHint: 'Requires Tier I Prestige or 10M RP',
    failureDescription:
      'Probe enters 12-minute structural repair cycle with partial salvage.'
  },
  {
    zone: 'singularity',
    label: 'Singularity Rift',
    description:
      'Deep-space collapse zone. Heavy Dust, Operation Points, and -10% Research skips.',
    successRate: 0.5,
    durationSeconds: 28800, // 8 hours (overnight/workday)
    dustYieldMin: 1600,
    dustYieldMax: 3200,
    opYieldMin: 80,
    opYieldMax: 160,
    researchCutFraction: 0.1,
    anomalyIgniteChance: 0,
    relicDropChance: 0.2,
    repairSeconds: 1800,
    salvageDust: 150,
    duplicateRelicDust: 500,
    unlockHint: 'Requires Tier II Prestige or Era 4 (10^35 RP)',
    failureDescription:
      'Probe enters 30-minute repair cycle with 150 salvage Dust.'
  },
  {
    zone: 'omega',
    label: 'Omega Horizon',
    description:
      'Endgame boundary survey: massive Dust/PTS, -25% Research skips, and 25% Anomaly ignition.',
    successRate: 0.45,
    durationSeconds: 86400, // 24 hours (daily cycle)
    dustYieldMin: 6000,
    dustYieldMax: 12000,
    opYieldMin: 250,
    opYieldMax: 500,
    researchCutFraction: 0.25,
    anomalyIgniteChance: 0.25,
    relicDropChance: 0.3,
    repairSeconds: 3600,
    salvageDust: 600,
    duplicateRelicDust: 1200,
    unlockHint: 'Requires Tier III Prestige or Era 6 (10^85 RP)',
    failureDescription:
      'Probe enters 60-minute repair cycle with 600 salvage Dust.'
  }
]

export const ZONE_MAP: Record<ExcavationZone, ZoneDefinition> =
  Object.fromEntries(ZONE_DEFINITIONS.map((z) => [z.zone, z])) as Record<
    ExcavationZone,
    ZoneDefinition
  >

export function isZoneUnlocked(
  zone: ExcavationZone,
  state: Pick<GameState, 'lifetimePoints' | 'stats'>
): boolean {
  const peakRP =
    (state.stats?.peakLifetimePoints ?? 0n) > (state.lifetimePoints ?? 0n)
      ? (state.stats?.peakLifetimePoints ?? 0n)
      : (state.lifetimePoints ?? 0n)

  if (zone === 'void') {
    return (state.stats?.totalPrestigesTier1 ?? 0) > 0 || peakRP >= 10_000_000n
  }
  if (zone === 'singularity') {
    return (state.stats?.totalPrestigesTier2 ?? 0) > 0 || peakRP >= 10n ** 35n
  }
  if (zone === 'omega') {
    return (state.stats?.totalPrestigesTier3 ?? 0) > 0 || peakRP >= 10n ** 85n
  }
  return true
}

export function getMaxProbes(
  state: Partial<
    Pick<GameState, 'lifetimePoints' | 'stats' | 'completedResearchNodes'>
  >
): number {
  const peakRP =
    (state.stats?.peakLifetimePoints ?? 0n) > (state.lifetimePoints ?? 0n)
      ? (state.stats?.peakLifetimePoints ?? 0n)
      : (state.lifetimePoints ?? 0n)

  let max = MAX_PROBES
  if ((state.stats?.totalPrestigesTier2 ?? 0) > 0 || peakRP >= 10n ** 35n) {
    max = 6
  }
  if ((state.stats?.totalPrestigesTier3 ?? 0) > 0 || peakRP >= 10n ** 85n) {
    max = 7
  }
  if (
    state.stats?.o10EverCompleted ||
    state.completedResearchNodes?.includes('O10') ||
    peakRP >= 10n ** 140n
  ) {
    max = 8
  }
  return max
}

const PROBE_COSTS: readonly bigint[] = [
  PROBE_COST_RP,
  250_000n,
  5_000_000n,
  100_000_000n,
  2_500_000_000n,
  10n ** 36n,
  10n ** 86n,
  10n ** 142n
]

export function getProbeCost(currentProbeCount: number): bigint {
  return PROBE_COSTS[currentProbeCount] ?? 10n ** 142n
}

// Returns true if the player meets the gate requirements to build a probe
export function meetsProbeGateRequirements(state: {
  generators: Array<{ quantity: bigint }>
}): boolean {
  const serverClusters = state.generators[1]?.quantity ?? 0n
  const quantumComputers = state.generators[2]?.quantity ?? 0n
  return (
    serverClusters >= PROBE_GATE_SERVER_CLUSTERS &&
    quantumComputers >= PROBE_GATE_QUANTUM_COMPUTERS
  )
}

// Returns true if a new probe can be built
export function canBuildProbe(
  state: Pick<GameState, 'probes' | 'researchPoints'> &
    Partial<
      Pick<GameState, 'lifetimePoints' | 'stats' | 'completedResearchNodes'>
    >
): boolean {
  return (
    state.probes.length < getMaxProbes(state) &&
    state.researchPoints >= getProbeCost(state.probes.length)
  )
}

// Generates a unique probe ID derived from existing probes in state
export function nextProbeId(existingProbes: ProbeState[] = []): number {
  const maxId = existingProbes.reduce((max, p) => Math.max(max, p.id), 0)
  return maxId + 1
}

export function getRawScanDuration(
  zone: ExcavationZone,
  subsystem: ProbeSubsystem = 'none',
  probeSpeedBonus = 1
): number {
  const zoneDef = ZONE_MAP[zone]
  let duration = zoneDef.durationSeconds
  if (subsystem === 'thrusters') {
    duration *= 0.65
  }
  if (probeSpeedBonus > 1) {
    duration /= probeSpeedBonus
  }
  return Math.max(0.1, duration)
}

// Converts Dredger/Thruster speed past the 60s timer floor into a multi-scan yield multiplier
export function getProbeSpeedOverflowMultiplier(
  zone: ExcavationZone,
  subsystem: ProbeSubsystem = 'none',
  probeSpeedBonus = 1
): number {
  const raw = getRawScanDuration(zone, subsystem, probeSpeedBonus)
  return raw < 60 ? 60 / raw : 1
}

// Rolls the result of a completed probe scan
export function rollProbeResult(
  probe: ProbeState,
  state: Pick<GameState, 'unlockedRelics' | 'lifetimePoints' | 'achievements'> &
    Partial<Pick<GameState, 'dysonSwarmLevel' | 'unlocks'>>,
  probeSpeedBonus = 1
): ProbeResultPayload {
  if (!probe.zone) {
    return {
      probeId: probe.id,
      zone: 'safe',
      success: false,
      dustEarned: 0,
      opEarned: 0,
      researchCutFraction: 0,
      triggerAnomaly: false,
      relicDropped: 0,
      needsRepair: false
    }
  }

  const zoneDef = ZONE_MAP[probe.zone]
  const rankInfo = getVeteranRank(probe.expeditionsCompleted ?? 0)
  const effectiveSuccessRate = Math.min(
    0.95,
    zoneDef.successRate + rankInfo.successBonus
  )

  const success = Math.random() < effectiveSuccessRate
  const era = getCurrentEra(state.lifetimePoints).era
  const swarmMult = 1 + 0.25 * (state.dysonSwarmLevel ?? 0)
  const overflowMult = getProbeSpeedOverflowMultiplier(
    probe.zone,
    probe.subsystem ?? 'none',
    probeSpeedBonus
  )

  if (!success) {
    const salvageDust = Math.floor(
      zoneDef.salvageDust *
        (1 + 0.5 * Math.max(0, era - 1)) *
        swarmMult *
        overflowMult
    )

    return {
      probeId: probe.id,
      zone: probe.zone,
      success: false,
      dustEarned: salvageDust,
      opEarned: 0,
      researchCutFraction: 0,
      triggerAnomaly: false,
      relicDropped: 0,
      needsRepair: true
    }
  }

  // Roll base dust yield
  let dustEarned =
    zoneDef.dustYieldMin +
    Math.floor(
      Math.random() * (zoneDef.dustYieldMax - zoneDef.dustYieldMin + 1)
    )

  dustEarned = Math.floor(dustEarned * rankInfo.dustMultiplier)

  if (probe.subsystem === 'siphon') {
    dustEarned = Math.floor(dustEarned * 1.5)
  }
  dustEarned = Math.floor(
    dustEarned * (1 + 0.5 * Math.max(0, era - 1)) * swarmMult * overflowMult
  )
  if (state.achievements?.includes('relic_all')) {
    dustEarned = Math.floor(dustEarned * 1.15)
  }

  // Operation Points earned once Anomalous Operations is unlocked
  let opEarned = 0
  if (state.unlocks?.anomalousOperations && zoneDef.opYieldMax > 0) {
    const baseOp =
      zoneDef.opYieldMin +
      Math.floor(Math.random() * (zoneDef.opYieldMax - zoneDef.opYieldMin + 1))
    opEarned = Math.floor(baseOp * rankInfo.dustMultiplier * overflowMult)
  }

  // Roll relic drop (Relic 9 Void Compass is exclusive to excavation)
  let relicChance = zoneDef.relicDropChance
  if (probe.subsystem === 'siphon') {
    relicChance += 0.05
  }

  let relicDropped = 0
  if (zoneDef.relicDropChance > 0 && Math.random() < relicChance) {
    if (!state.unlockedRelics.includes(9)) {
      relicDropped = 9
    } else {
      dustEarned += Math.floor(zoneDef.duplicateRelicDust * overflowMult)
    }
  }

  const triggerAnomaly =
    zoneDef.anomalyIgniteChance > 0 &&
    Math.random() < zoneDef.anomalyIgniteChance

  return {
    probeId: probe.id,
    zone: probe.zone,
    success: true,
    dustEarned,
    opEarned,
    researchCutFraction: zoneDef.researchCutFraction,
    triggerAnomaly,
    relicDropped,
    needsRepair: false
  }
}

// Returns the scan duration for a zone, applying subsystem and Dredger speedups
export function getScanDuration(
  zone: ExcavationZone,
  subsystem: ProbeSubsystem = 'none',
  probeSpeedBonus = 1
): number {
  return Math.max(
    60,
    Math.round(getRawScanDuration(zone, subsystem, probeSpeedBonus))
  )
}
