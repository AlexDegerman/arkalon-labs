'use server'

import 'server-only'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import type { SerializedSave } from '@/lib/saveGame'
import { SAVE_SANITY_MULTIPLIER } from '@/constants/game'

interface SavePayload {
  save: SerializedSave
  lastSavedTime: number
  lifetimePoints: string
  currentPoints: string
  cachedPPS: string
}

// Server-side rate limit map: playerId -> last save timestamp ms
const rateLimitMap = new Map<string, number>()

function isRateLimited(playerId: string): boolean {
  const last = rateLimitMap.get(playerId)
  if (!last) return false
  const now = Date.now()
  // Prune stale entries
  if (now - last > 120_000) {
    rateLimitMap.delete(playerId)
    return false
  }
  return now - last < 30_000
}

function recordSave(playerId: string): void {
  rateLimitMap.set(playerId, Date.now())
}

// Generous ceiling to avoid false positives from anomaly bursts
// Uses pure BigInt arithmetic to avoid float overflow
function sanityCheckPoints(
  claimedPoints: bigint,
  cachedPPS: bigint,
  lastSavedTime: number,
  serverNow: number
): boolean {
  // Reject future timestamps
  if (lastSavedTime > serverNow + 5000) return false

  const elapsedSeconds = Math.max(0, (serverNow - lastSavedTime) / 1000)
  if (elapsedSeconds <= 0) return true

  // Max points that could have been earned = pps * elapsed * 1.5
  const elapsedBn = BigInt(Math.ceil(elapsedSeconds))
  const sanityBn = BigInt(Math.round(SAVE_SANITY_MULTIPLIER * 10))
  const maxEarnable = (cachedPPS * elapsedBn * sanityBn) / 10n

  // Base allowance of 10^12 handles early-game when PPS was 0
  const baseCeiling = 1_000_000_000_000n
  return claimedPoints <= maxEarnable + baseCeiling
}

export async function saveState(payload: SavePayload): Promise<{
  success: boolean
  error?: string
}> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('arkalon_core_id')?.value

  if (!playerId) {
    return { success: false, error: 'Unauthorized: No active Arkalon session' }
  }

  if (isRateLimited(playerId)) {
    return { success: false, error: 'Rate limited' }
  }

  const { save, lastSavedTime, lifetimePoints, currentPoints, cachedPPS } =
    payload

  const serverNow = Date.now()

  // Basic shape validation
  if (!save || typeof save !== 'object') {
    return { success: false, error: 'Invalid save payload' }
  }
  if (typeof lastSavedTime !== 'number' || lastSavedTime <= 0) {
    return { success: false, error: 'Invalid save timestamp' }
  }
  if (
    typeof lifetimePoints !== 'string' ||
    typeof currentPoints !== 'string' ||
    typeof cachedPPS !== 'string'
  ) {
    return { success: false, error: 'Invalid point value types' }
  }

  // Parse bigint values for sanity check
  let lpBigInt: bigint
  let cpBigInt: bigint
  let ppsBigInt: bigint
  try {
    lpBigInt = BigInt(lifetimePoints)
    cpBigInt = BigInt(currentPoints)
    ppsBigInt = BigInt(cachedPPS)
  } catch {
    return { success: false, error: 'Invalid point values' }
  }

  // Reject negative values
  if (lpBigInt < 0n || cpBigInt < 0n || ppsBigInt < 0n) {
    return { success: false, error: 'Negative point values rejected' }
  }

  if (!sanityCheckPoints(lpBigInt, ppsBigInt, lastSavedTime, serverNow)) {
    console.warn(`[saveState] sanity check failed for player ${playerId}`)
    return {
      success: false,
      error: 'Save rejected: values exceed theoretical ceiling'
    }
  }

  const client = await pool.connect()
  try {
    await client.query(
      `INSERT INTO game_states (
        player_id, updated_at, current_points, lifetime_points,
        generator_data, research_data, prestige_upgrades, relic_data,
        excavation_data, megaproject_data, anomaly_data, feature_flags,
        tutorial_data, challenge_data, automation_data, operation_data,
        achievements, stats_data, client_settings, last_saved_time,
        arkalon_resonance, chronal_fractures, omni_spars, artifact_dust
      ) VALUES (
        $1, now(), $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23
      )
      ON CONFLICT (player_id) DO UPDATE SET
        updated_at         = now(),
        current_points     = EXCLUDED.current_points,
        lifetime_points    = EXCLUDED.lifetime_points,
        generator_data     = EXCLUDED.generator_data,
        research_data      = EXCLUDED.research_data,
        prestige_upgrades  = EXCLUDED.prestige_upgrades,
        relic_data         = EXCLUDED.relic_data,
        excavation_data    = EXCLUDED.excavation_data,
        megaproject_data   = EXCLUDED.megaproject_data,
        anomaly_data       = EXCLUDED.anomaly_data,
        feature_flags      = EXCLUDED.feature_flags,
        tutorial_data      = EXCLUDED.tutorial_data,
        challenge_data     = EXCLUDED.challenge_data,
        automation_data    = EXCLUDED.automation_data,
        operation_data     = EXCLUDED.operation_data,
        achievements       = EXCLUDED.achievements,
        stats_data         = EXCLUDED.stats_data,
        client_settings    = EXCLUDED.client_settings,
        last_saved_time    = EXCLUDED.last_saved_time,
        arkalon_resonance  = EXCLUDED.arkalon_resonance,
        chronal_fractures  = EXCLUDED.chronal_fractures,
        omni_spars         = EXCLUDED.omni_spars,
        artifact_dust      = EXCLUDED.artifact_dust`,
      [
        playerId,
        currentPoints,
        lifetimePoints,
        JSON.stringify((save as any).generators ?? []),
        JSON.stringify({
          completedNodes: (save as any).completedResearchNodes ?? [],
          activeSlots: (save as any).activeResearchSlots ?? [],
          queue: (save as any).researchQueue ?? [],
          infiniteLevels: (save as any).infiniteResearchLevels ?? {}
        }),
        JSON.stringify({
          ar: (save as any).arUpgrades ?? {},
          cf: (save as any).cfUpgrades ?? {},
          os: (save as any).osUpgrades ?? {}
        }),
        JSON.stringify({
          slots: (save as any).relicSlots ?? [],
          unlocked: (save as any).unlockedRelics ?? [],
          levels: (save as any).relicLevels ?? {}
        }),
        JSON.stringify((save as any).probes ?? []),
        JSON.stringify({
          activeId: (save as any).activeMegaprojectId ?? null,
          allocationPercent: (save as any).megaprojectAllocationPercent ?? 0,
          rpAbsorbed: (save as any).megaprojectRPAbsorbed ?? '0',
          completed: (save as any).completedMegaprojects ?? []
        }),
        JSON.stringify({
          activeType: (save as any).activeAnomalyType ?? null,
          timeRemaining: (save as any).anomalyTimeRemaining ?? 0,
          interactionValue: (save as any).anomalyInteractionValue ?? 0,
          timeToNextCheck: (save as any).timeToNextAnomalyCheck ?? 480
        }),
        JSON.stringify((save as any).unlocks ?? {}),
        JSON.stringify((save as any).tutorial ?? {}),
        JSON.stringify({
          activeChallengeId: (save as any).activeChallengeId ?? null,
          records: (save as any).challengeRecords ?? {}
        }),
        JSON.stringify((save as any).automation ?? {}),
        JSON.stringify({
          points: (save as any).currentOperationPoints ?? 0,
          multiplierLevel: (save as any).operationMultiplierLevel ?? 0,
          artifactsUnlocked: (save as any).operationArtifactsUnlocked ?? [],
          currentCycle: (save as any).currentOperationCycle ?? 1
        }),
        (save as any).achievements ?? [],
        JSON.stringify((save as any).stats ?? {}),
        JSON.stringify((save as any).settings ?? {}),
        lastSavedTime,
        (save as any).arkalonResonance ?? 0,
        (save as any).chronalFractures ?? 0,
        (save as any).omniSpars ?? 0,
        (save as any).artifactDust ?? 0
      ]
    )

    recordSave(playerId)
    return { success: true }
  } catch (err) {
    console.error('[saveState] db error:', err)
    return { success: false, error: 'Database error' }
  } finally {
    client.release()
  }
}
