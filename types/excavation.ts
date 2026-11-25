import type { ExcavationZone } from '@/types/game'

// Intermediate payload produced by completed probe scans
// Consumed by reward handlers in excavationActions.ts

export interface ProbeResultPayload {
  probeId: number
  zone: ExcavationZone
  success: boolean
  dustEarned: number
  opEarned: number
  researchCutFraction: number
  triggerAnomaly: boolean
  relicDropped: number // 0 = no drop
  // On failed risk-zone scan: probe enters repair cycle
  needsRepair: boolean
}