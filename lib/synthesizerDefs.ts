import type { GameState } from '@/types/game'
import type { FeatureKey } from '@/lib/featureRegistry'
import { getCurrentEra } from '@/lib/eraThresholds'

export interface SynthesizerDefinition {
  index: number
  id:
    | 'dust_condenser'
    | 'subspace_dredger'
    | 'telemetry_array'
    | 'entropic_crucible'
  name: string
  description: string
  unlockFeature: FeatureKey
  baseCost: bigint
  growthFactor: number
  dustPerMin: number
  opPerMin: number
}

export const SYNTHESIZERS: SynthesizerDefinition[] = [
  {
    index: 0,
    id: 'dust_condenser',
    name: 'Dust Condenser',
    description:
      '+0.5 Artifact Dust/min per unit (used to upgrade Relics and power the Particle Collider).',
    unlockFeature: 'relics',
    baseCost: 10_000n,
    growthFactor: 1.35,
    dustPerMin: 0.5,
    opPerMin: 0
  },
  {
    index: 1,
    id: 'subspace_dredger',
    name: 'Sub-Space Dredger',
    description: '+3 Artifact Dust/min and +5% Probe scan speed per unit.',
    unlockFeature: 'excavation',
    baseCost: 5_000_000n,
    growthFactor: 1.45,
    dustPerMin: 3,
    opPerMin: 0
  },
  {
    index: 2,
    id: 'telemetry_array',
    name: 'Cosmic Telemetry Array',
    description:
      '+2 Operation Points/min per unit for the Operations Artifact Shop (3x faster during Operation Anomalies).',
    unlockFeature: 'anomalousOperations',
    baseCost: 100_000_000n,
    growthFactor: 1.5,
    dustPerMin: 0,
    opPerMin: 2
  },
  {
    index: 3,
    id: 'entropic_crucible',
    name: 'Entropic Crucible',
    description:
      '+25 Dust/min, +10 Operation Points/min, and +25% output to all Synthesizers per unit.',
    unlockFeature: 'megaprojects',
    baseCost: 10n ** 15n,
    growthFactor: 1.65,
    dustPerMin: 25,
    opPerMin: 10
  }
]

export function isSynthesizersDisabled(state: GameState): boolean {
  return Boolean(
    state.activeChallengeRestrictions?.relicsDisabled &&
    state.activeChallengeRestrictions?.excavationDisabled
  )
}

export function isSynthesizerUnlocked(
  index: number,
  state: GameState
): boolean {
  const def = SYNTHESIZERS[index]
  if (!def) return false
  if (isSynthesizersDisabled(state)) return false
  return Boolean(state.unlocks[def.unlockFeature])
}

export function getSynthesizerCost(index: number, quantity: number): bigint {
  const def = SYNTHESIZERS[index]
  if (!def) return 0n

  const log10Total =
    Math.log10(Number(def.baseCost)) + quantity * Math.log10(def.growthFactor)
  if (log10Total > 15) {
    const exp = Math.floor(log10Total)
    const mantissa = Math.pow(10, log10Total - exp)
    const scaled = BigInt(Math.ceil(mantissa * 1e12))
    return scaled * 10n ** BigInt(Math.max(0, exp - 12))
  }

  return BigInt(
    Math.ceil(Number(def.baseCost) * Math.pow(def.growthFactor, quantity))
  )
}

export function getSynthesizerCostToBuyN(
  index: number,
  amount: number,
  currentQty: number
): bigint {
  let total = 0n
  for (let i = 0; i < amount; i++) {
    total += getSynthesizerCost(index, currentQty + i)
  }
  return total
}

export function getSynthesizerMaxAffordable(
  index: number,
  state: GameState
): number {
  const def = SYNTHESIZERS[index]
  if (!def) return 0

  let remaining = state.researchPoints
  let qty = state.synthesizers[index] ?? 0
  let count = 0

  while (count < 500) {
    const next = getSynthesizerCost(index, qty)
    if (remaining < next) break
    remaining -= next
    qty++
    count++
  }
  return count
}

export interface SynthesizerRates {
  dustPerMin: number
  opPerMin: number
  dustPerSec: number
  opPerSec: number
  probeSpeedBonus: number
}

export function getDustGlobalMultiplier(
  state: Pick<GameState, 'lifetimePoints' | 'dysonSwarmLevel' | 'achievements'>
): number {
  const era = getCurrentEra(state.lifetimePoints).era
  const eraDustMult = 1 + 0.5 * Math.max(0, era - 1)
  const swarmDustMult = 1 + 0.25 * (state.dysonSwarmLevel ?? 0)
  const relicMasterMult = state.achievements?.includes('relic_all') ? 1.15 : 1
  return eraDustMult * swarmDustMult * relicMasterMult
}

export function getSynthesizerRates(state: GameState): SynthesizerRates {
  if (isSynthesizersDisabled(state)) {
    return {
      dustPerMin: 0,
      opPerMin: 0,
      dustPerSec: 0,
      opPerSec: 0,
      probeSpeedBonus: 1
    }
  }

  const counts = state.synthesizers ?? [0, 0, 0, 0]
  const opsActive = state.unlocks.anomalousOperations

  const crucibleMult = 1 + 0.25 * (counts[3] ?? 0)
  const opAnomalyMult = state.activeAnomalyType?.startsWith('operation_')
    ? 3
    : 1

  const rawDustPerMin =
    (counts[0] ?? 0) * SYNTHESIZERS[0].dustPerMin +
    (counts[1] ?? 0) * SYNTHESIZERS[1].dustPerMin +
    (counts[3] ?? 0) * SYNTHESIZERS[3].dustPerMin

  let rawOpPerMin = 0
  if (opsActive) {
    rawOpPerMin =
      (counts[2] ?? 0) * SYNTHESIZERS[2].opPerMin * opAnomalyMult +
      (counts[3] ?? 0) * SYNTHESIZERS[3].opPerMin
  }

  const dustPerMin =
    rawDustPerMin * crucibleMult * getDustGlobalMultiplier(state)
  const opPerMin = rawOpPerMin * crucibleMult

  return {
    dustPerMin,
    opPerMin,
    dustPerSec: dustPerMin / 60,
    opPerSec: opPerMin / 60,
    probeSpeedBonus: 1 + 0.05 * (counts[1] ?? 0)
  }
}

// Particle Collider ignition cost: 10 minutes of current Dust income, floor 25
export function getColliderCost(state: GameState): number {
  return Math.max(25, Math.ceil(getSynthesizerRates(state).dustPerSec * 600))
}
