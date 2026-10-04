// Intermediate payload produced by completed probe scans
// Consumed by dust/relic reward handlers in gameActions.ts

export interface ProbeResultPayload {
  probeId: number
  zone: 'safe' | 'unstable' | 'void'
  success: boolean
  dustEarned: number
  relicDropped: number // 0 = no drop
  // For Unstable Rift failure: probe enters repair mode
  needsRepair: boolean
  // For Void Depth failure: probe is destroyed
  probeDestroyed: boolean
}
