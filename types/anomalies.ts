// Intermediate payload produced by resolveAnomaly and consumed by
// UI overlays, alert queues, and relic drop checks

import type { AnomalyType } from '@/types/game'

export interface AnomalyResultPayload {
  anomalyType: AnomalyType
  // Base RP reward (may be 0 for non-RP anomalies)
  rpReward: bigint
  // Multiplier applied to passive PPS (0 = no multiplier)
  ppsMultiplier: number
  // Duration of the PPS multiplier in seconds (0 = instant)
  ppsMultiplierDuration: number
  // Research speed multiplier (1.0 = no change)
  researchSpeedMultiplier: number
  // Duration of research speed multiplier in seconds
  researchSpeedDuration: number
  // RP awarded as an instant payout (Containment Breach)
  instantRPPayout: bigint
  // Whether a 0-time research project is granted (Arkalon Resonance anomaly)
  grantFreeResearch: boolean
  // Tech cost reduction percentage (Arkalon Resonance anomaly)
  techCostReductionPercent: number
  // Artifact dust dropped
  dustDropped: number
  // Relic ID dropped (0 = no relic drop)
  relicDropped: number
  // Time subtracted from running research timers in seconds (R4 effect)
  researchTimeReduction: number
  // Whether the anomaly was resolved at maximum reward
  wasMaxReward: boolean
}
