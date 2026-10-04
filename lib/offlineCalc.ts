import type { GameState } from '@/types/game'
import type { OfflineProgressPayload } from '@/types/offline'
import {
  DEFAULT_OFFLINE_EFFICIENCY,
  DEFAULT_MAX_OFFLINE_SECONDS,
  CHRONOS_LOOM_OFFLINE_SECONDS,
  MAX_OFFLINE_SECONDS_HARD_CAP
} from '@/constants/game'

// Returns the player's current max offline window in seconds
// based on which upgrades and research nodes are active
function getMaxOfflineSeconds(state: GameState): number {
  // R9: expands to 24 hours
  if (state.completedResearchNodes.includes('R9')) {
    return MAX_OFFLINE_SECONDS_HARD_CAP
  }

  // Chronos Loom operation artifact: expands to 12 hours
  if (state.operationArtifactsUnlocked.includes('chronos_loom')) {
    return CHRONOS_LOOM_OFFLINE_SECONDS
  }

  return DEFAULT_MAX_OFFLINE_SECONDS
}

// Returns the offline efficiency multiplier (0.0 - 1.0)
function getOfflineEfficiency(state: GameState): number {
  const completed = state.completedResearchNodes;

  // E2: 100% efficiency
  if (completed.includes('E2')) return 1.0;

  // E1: 75%
  if (completed.includes('E1')) {
    const { getRelicOfflineEfficiencyBonus } = require('@/lib/relicEffects');
    const relicBonus = getRelicOfflineEfficiencyBonus(state);
    return Math.min(1.0, 0.75 + relicBonus);
  }

  // Base + Entropic Anchor relic
  const { getRelicOfflineEfficiencyBonus } = require('@/lib/relicEffects');
  const relicBonus = getRelicOfflineEfficiencyBonus(state);
  return Math.min(1.0, DEFAULT_OFFLINE_EFFICIENCY + relicBonus);
}

// Calculates offline RP accumulation between lastSavedTime and now
// Called once on game load before the tick loop starts
export function calculateOfflineProgress(
  state: GameState,
  lastSavedTimeMs: number,
  nowMs: number
): OfflineProgressPayload {
  const actualElapsed = Math.max(0, (nowMs - lastSavedTimeMs) / 1000)
  const maxOffline = getMaxOfflineSeconds(state)
  const cappedElapsed = Math.min(actualElapsed, maxOffline)
  const efficiency = getOfflineEfficiency(state)

  // PPS from cached value (already computed on last save)
  const pps = state.cachedPointsPerSecond

  // RP earned = PPS * elapsed * efficiency
  const rpEarned = BigInt(Math.floor(Number(pps) * cappedElapsed * efficiency))

  return {
    elapsedSeconds: cappedElapsed,
    actualElapsedSeconds: actualElapsed,
    rpEarned,
    efficiencyApplied: efficiency,
    maxOfflineWindowSeconds: maxOffline
  }
}

// Applies offline progress payload to state and returns updated currency values
export function applyOfflineProgress(
  state: GameState,
  payload: OfflineProgressPayload
): Pick<GameState, 'researchPoints' | 'lifetimePoints'> {
  return {
    researchPoints: state.researchPoints + payload.rpEarned,
    lifetimePoints: state.lifetimePoints + payload.rpEarned
  }
}
