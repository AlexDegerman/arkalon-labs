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
  PROBE_COST_RP
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
    description: '-50% repair time on failed scans (5m Unstable, 15m Void).',
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
  relicDropChance: number // 0-1
  failureDescription: string
}

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    zone: 'safe',
    label: 'Safe Sectors',
    description: 'Stable space with no risk. Guaranteed dust yield.',
    successRate: 1.0,
    durationSeconds: 3600, // 1 hour
    dustYieldMin: 15,
    dustYieldMax: 30,
    relicDropChance: 0,
    failureDescription: 'N/A'
  },
  {
    zone: 'unstable',
    label: 'Unstable Rifts',
    description:
      'Volatile sub-space region. Higher yield but risk of probe damage.',
    successRate: 0.75,
    durationSeconds: 14400, // 4 hours
    dustYieldMin: 80,
    dustYieldMax: 160,
    relicDropChance: 0.05,
    failureDescription: 'Probe enters 10-minute repair cycle.'
  },
  {
    zone: 'void',
    label: 'Void Depths',
    description:
      'Extreme Dust yield; 50% risk of heavy structural damage requiring 30m repair.',
    successRate: 0.5,
    durationSeconds: 43200, // 12 hours
    dustYieldMin: 450,
    dustYieldMax: 900,
    relicDropChance: 0.15,
    failureDescription:
      'Probe enters 30-minute structural repair cycle with partial salvage.'
  }
]

export const ZONE_MAP: Record<ExcavationZone, ZoneDefinition> =
  Object.fromEntries(ZONE_DEFINITIONS.map((z) => [z.zone, z])) as Record<
    ExcavationZone,
    ZoneDefinition
  >

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
export function canBuildProbe(state: {
  probes: ProbeState[]
  researchPoints: bigint
}): boolean {
  return (
    state.probes.length < MAX_PROBES && state.researchPoints >= PROBE_COST_RP
  )
}

// Generates a unique probe ID derived from existing probes in state
export function nextProbeId(existingProbes: ProbeState[] = []): number {
  const maxId = existingProbes.reduce((max, p) => Math.max(max, p.id), 0)
  return maxId + 1
}

// Rolls the result of a completed probe scan
export function rollProbeResult(
  probe: ProbeState,
  state: Pick<GameState, 'unlockedRelics' | 'lifetimePoints' | 'achievements'>
): ProbeResultPayload {
  if (!probe.zone) {
    return {
      probeId: probe.id,
      zone: 'safe',
      success: false,
      dustEarned: 0,
      relicDropped: 0,
      needsRepair: false,
      probeDestroyed: false
    }
  }

  const zoneDef = ZONE_MAP[probe.zone]
  const rankInfo = getVeteranRank(probe.expeditionsCompleted ?? 0)
  const effectiveSuccessRate = Math.min(
    0.95,
    zoneDef.successRate + rankInfo.successBonus
  )

  const success = Math.random() < effectiveSuccessRate

  if (!success) {
    const isVoid = probe.zone === 'void'
    const salvageDust = isVoid ? 75 : 0

    return {
      probeId: probe.id,
      zone: probe.zone,
      success: false,
      dustEarned: salvageDust,
      relicDropped: 0,
      needsRepair: true,
      probeDestroyed: false
    }
  }

  // Roll base dust yield
  let dustEarned =
    zoneDef.dustYieldMin +
    Math.floor(
      Math.random() * (zoneDef.dustYieldMax - zoneDef.dustYieldMin + 1)
    )

  // Apply veteran rank multiplier
  dustEarned = Math.floor(dustEarned * rankInfo.dustMultiplier)

  // Siphon subsystem: +50% dust; scale with Era and Relic Master capstone
  if (probe.subsystem === 'siphon') {
    dustEarned = Math.floor(dustEarned * 1.5)
  }
  const era = getCurrentEra(state.lifetimePoints).era
  dustEarned = Math.floor(dustEarned * (1 + 0.25 * Math.max(0, era - 1)))
  if (state.achievements?.includes('relic_all')) {
    dustEarned = Math.floor(dustEarned * 1.15)
  }

  // Roll relic drop (Relic 9 Void Compass is exclusive to excavation)
  let relicChance = zoneDef.relicDropChance
  if (probe.subsystem === 'siphon') {
    relicChance += 0.05
  }

  let relicDropped = 0
  if (Math.random() < relicChance) {
    if (!state.unlockedRelics.includes(9)) {
      relicDropped = 9
    } else {
      dustEarned += probe.zone === 'void' ? 200 : 75
    }
  }

  return {
    probeId: probe.id,
    zone: probe.zone,
    success: true,
    dustEarned,
    relicDropped,
    needsRepair: false,
    probeDestroyed: false
  }
}

// Returns the scan duration for a zone, applying subsystem and Dredger speedups
export function getScanDuration(
  zone: ExcavationZone,
  subsystem: ProbeSubsystem = 'none',
  probeSpeedBonus = 1
): number {
  const zoneDef = ZONE_MAP[zone]
  let duration = zoneDef.durationSeconds
  if (subsystem === 'thrusters') {
    duration = Math.round(duration * 0.65)
  }
  if (probeSpeedBonus > 1) {
    duration = Math.round(duration / probeSpeedBonus)
  }
  return Math.max(60, duration)
}
