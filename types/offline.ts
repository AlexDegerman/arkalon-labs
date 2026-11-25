// Intermediate shape produced by offlineCalc.ts and consumed by UI notification modals

export interface OfflineProgressPayload {
  // How long the player was offline, capped by their max offline window
  elapsedSeconds: number
  // Uncapped actual elapsed time for display purposes
  actualElapsedSeconds: number
  // RP earned during offline period (bigint serialized for transport)
  rpEarned: bigint
  // Offline efficiency applied (0.0-1.0)
  efficiencyApplied: number
  // Max offline window in seconds that was applied
  maxOfflineWindowSeconds: number
  // RP absorbed into active megaproject during offline window
  megaprojectRPEarned?: bigint
  // Raw RP siphoned from the player before absorption bonuses
  megaprojectRPSiphoned?: bigint
  // Megaproject ID if construction completed offline
  megaprojectCompletedId?: import('@/types/game').MegaprojectId | null
  // Labels of research nodes completed during offline window
  researchCompletedNames?: string[]
  // Number of probe scans finished during offline window
  probesCompletedCount?: number
  // Secondary resources synthesized during offline window
  dustEarned?: number
  operationPointsEarned?: number
  // Cached simulation snapshots to avoid running offline simulations twice
  cachedResearchResult?: {
    completedResearchNodes: string[]
    activeResearchSlots: import('@/types/game').ResearchSlotState[]
    researchQueue: string[]
    researchPointsAfterSpend: bigint
    newlyCompletedCount: number
  }
  cachedProbeResult?: {
    probes: import('@/types/game').ProbeState[]
    dustEarned: number
    newRelics: number[]
    relic9PityGain: number
  }
  cachedDysonSwarmLevel?: number
  cachedMegaprojectRPAbsorbed?: bigint
  cachedFinalAnomalyState?: {
    activeAnomalyType: import('@/types/game').AnomalyType | null
    anomalyTimeRemaining: number
    anomalySpawnRawDuration: number
    timeToNextAnomalyCheck: number
  }
  ec3CollapseTriggered?: boolean
  ec3CollapseCount?: number
  ec3FinalPrestigeTimeMs?: number
  ec3PostCollapseRunSeconds?: number
  anomaliesResolvedCount?: number
}
