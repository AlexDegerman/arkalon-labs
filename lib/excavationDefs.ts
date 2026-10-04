import type { ExcavationZone, ProbeState } from '@/types/game'
import type { ProbeResultPayload } from '@/types/excavation'
import {
  UNSTABLE_RIFT_REPAIR_SECONDS,
  PROBE_GATE_SERVER_CLUSTERS,
  PROBE_GATE_QUANTUM_COMPUTERS,
  MAX_PROBES,
  PROBE_COST_RP
} from '@/constants/game'

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
    dustYieldMin: 1,
    dustYieldMax: 5,
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
    dustYieldMin: 10,
    dustYieldMax: 30,
    relicDropChance: 0.05,
    failureDescription: 'Probe enters 10-minute repair cycle.'
  },
  {
    zone: 'void',
    label: 'Void Depths',
    description: 'Extreme yield but high probability of permanent probe loss.',
    successRate: 0.4,
    durationSeconds: 43200, // 12 hours
    dustYieldMin: 100,
    dustYieldMax: 250,
    relicDropChance: 0.15,
    failureDescription: 'Probe destroyed. Must be rebuilt.'
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
  const activeProbes = state.probes.filter((p) => p.status !== 'idle').length
  return activeProbes < MAX_PROBES && state.researchPoints >= PROBE_COST_RP
}

// Generates a unique probe ID
let probeIdCounter = 1
export function nextProbeId(): number {
  return probeIdCounter++
}

// Rolls the result of a completed probe scan
export function rollProbeResult(
  probe: ProbeState,
  state: {
    unlockedRelics: number[]
  }
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
  const success = Math.random() < zoneDef.successRate

  if (!success) {
    const needsRepair = probe.zone === 'unstable'
    const probeDestroyed = probe.zone === 'void'
    return {
      probeId: probe.id,
      zone: probe.zone,
      success: false,
      dustEarned: 0,
      relicDropped: 0,
      needsRepair,
      probeDestroyed
    }
  }

  // Roll dust yield
  const dustEarned =
    zoneDef.dustYieldMin +
    Math.floor(
      Math.random() * (zoneDef.dustYieldMax - zoneDef.dustYieldMin + 1)
    )

  // Roll relic drop
  // Only drop relics not already unlocked
  // Relic 9 (Void Compass) has a 3% drop from Empty Coordinates (void zone)
  let relicDropped = 0
  if (Math.random() < zoneDef.relicDropChance) {
    if (probe.zone === 'void' && !state.unlockedRelics.includes(9)) {
      relicDropped = 9
    }
    // Other zone-based relic drops can be added here
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

// Returns the scan duration for a zone, applying any modifiers
export function getScanDuration(zone: ExcavationZone, _state: object): number {
  const zoneDef = ZONE_MAP[zone]
  // Future modifiers (e.g. artifacts, research) applied here
  return zoneDef.durationSeconds
}
