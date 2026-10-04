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
}
