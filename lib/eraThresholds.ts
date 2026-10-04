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