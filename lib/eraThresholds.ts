import { ERA_THRESHOLDS } from '@/constants/game'

export interface EraInfo {
  era: number
  name: string
  threshold: bigint
}

// Returns the current era info based on lifetime points
export function getCurrentEra(lifetimePoints: bigint): EraInfo {
  let current = ERA_THRESHOLDS[0]
  for (const era of ERA_THRESHOLDS) {
    if (lifetimePoints >= era.threshold) {
      current = era
    } else {
      break
    }
  }
  return current
}

// Returns the next era info, or null if at max era
export function getNextEra(lifetimePoints: bigint): EraInfo | null {
  const currentEra = getCurrentEra(lifetimePoints)
  const next = ERA_THRESHOLDS.find((e) => e.era === currentEra.era + 1)
  return next ?? null
}

// Returns progress 0.0-1.0 toward the next era threshold
export function getEraProgress(lifetimePoints: bigint): number {
  const current = getCurrentEra(lifetimePoints)
  const next = getNextEra(lifetimePoints)
  if (!next) return 1

  const start = current.threshold
  const end = next.threshold
  const range = end - start
  if (range <= 0n) return 1

  const progress = lifetimePoints - start
  return Math.min(1, Number(progress) / Number(range))
}
