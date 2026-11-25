'use server'

import 'server-only'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import type { SerializedSave } from '@/lib/saveGame'

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
  const now = Date.now()
  rateLimitMap.set(playerId, now)
  if (rateLimitMap.size > 1000) {
    for (const [id, ts] of rateLimitMap) {
      if (now - ts > 120_000) rateLimitMap.delete(id)
    }
  }
}

// Uses pure BigInt arithmetic to validate state sanity without blocking banked progression
function sanityCheckPoints(
  currentPoints: bigint,
  lifetimePoints: bigint,
  lastSavedTime: number,
  serverNow: number
): boolean {
  // Reject future timestamps
  if (lastSavedTime > serverNow + 300_000) return false

  // Current balance can never exceed lifetime points with starting buffer
  if (currentPoints > lifetimePoints + 1000n) return false

  return true
}

export async function resetCloudState(): Promise<{
  success: boolean
  error?: string
}> {
  const cookieStore = await cookies()
  let playerId = cookieStore.get('arkalon_core_id')?.value

  if (!playerId && process.env.NODE_ENV === 'development') {
    playerId = '11111111-1111-4111-8111-111111111111'
  }

  if (!playerId) {
    return { success: false, error: 'Unauthorized: No active Arkalon session' }
  }

  if (!process.env.DATABASE_URL) {
    return { success: false, error: 'Database offline' }
  }

  let client
  try {
    client = await pool.connect()
    await client.query('DELETE FROM game_states WHERE player_id = $1', [
      playerId
    ])
    rateLimitMap.delete(playerId)
    return { success: true }
  } catch (err) {
    console.error('[resetCloudState] db error:', err)
    return { success: false, error: 'Database error' }
  } finally {
    client?.release()
  }
}

export async function saveState(payload: SavePayload): Promise<{
  success: boolean
  error?: string
}> {
  const cookieStore = await cookies()
  let playerId = cookieStore.get('arkalon_core_id')?.value

  // Local development mock fallback when running without Network Hub
  if (!playerId && process.env.NODE_ENV === 'development') {
    playerId = '11111111-1111-4111-8111-111111111111'
  }

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

  if (!sanityCheckPoints(cpBigInt, lpBigInt, lastSavedTime, serverNow)) {
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
        JSON.stringify(save.generators ?? []),
        JSON.stringify({
          completedNodes: save.completedResearchNodes ?? [],
          activeSlots: save.activeResearchSlots ?? [],
          queue: save.researchQueue ?? [],
          infiniteLevels: save.infiniteResearchLevels ?? {},
          o6BypassUsed: Boolean(save.o6BypassUsed)
        }),
        JSON.stringify({
          ar: save.arUpgrades ?? {},
          cf: save.cfUpgrades ?? {},
          os: save.osUpgrades ?? {},
          resonanceMemoryAR: save.resonanceMemoryAR ?? 0,
          autoPrestigeMode: save.autoPrestigeMode ?? 'ratio',
          autoPrestigeTargetAR: save.autoPrestigeTargetAR ?? 1000,
          autoPrestigeRatio: save.autoPrestigeRatio ?? 2,
          autoPrestigeTargetCF: save.autoPrestigeTargetCF ?? 10,
          autoPrestigeTargetOS: save.autoPrestigeTargetOS ?? 10,
          autoPrestigeWaitForHigher: save.autoPrestigeWaitForHigher ?? true,
          autoPrestigeHoldForDyson: save.autoPrestigeHoldForDyson ?? true,
          autoBuyOptimalReservePercent: save.autoBuyOptimalReservePercent ?? 25,
          autoRelicTargetLevel: save.autoRelicTargetLevel ?? 20,
          autoRelicDustReserve: save.autoRelicDustReserve ?? 25,
          autoLaunchZone: save.autoLaunchZone ?? 'safe'
        }),
        JSON.stringify({
          slots: save.relicSlots ?? [],
          unlocked: save.unlockedRelics ?? [],
          levels: save.relicLevels ?? {},
          presets: save.relicPresets ?? [[], [], []],
          synthesizers: save.synthesizers ?? [0, 0, 0, 0],
          artifactDust: Math.min(
            Number.MAX_SAFE_INTEGER,
            Math.max(0, Math.floor(save.artifactDust ?? 0))
          )
        }),
        JSON.stringify(save.probes ?? []),
        JSON.stringify({
          activeId: save.activeMegaprojectId ?? null,
          allocationPercent: save.megaprojectAllocationPercent ?? 0,
          lastAllocationPercent: save.lastMegaprojectAllocationPercent ?? 10,
          rpAbsorbed: save.megaprojectRPAbsorbed ?? '0',
          completed: save.completedMegaprojects ?? [],
          dysonSwarmLevel: save.dysonSwarmLevel ?? 0
        }),
        JSON.stringify({
          activeType: save.activeAnomalyType ?? null,
          timeRemaining: save.anomalyTimeRemaining ?? 0,
          timeToNextCheck: save.timeToNextAnomalyCheck ?? 180
        }),
        JSON.stringify(save.unlocks ?? {}),
        JSON.stringify(save.tutorial ?? {}),
        JSON.stringify({
          activeChallengeId: save.activeChallengeId ?? null,
          challengeActiveSeconds: save.challengeActiveSeconds ?? 0,
          activeChallengeRestrictions: save.activeChallengeRestrictions ?? null,
          preChallengeSnapshot: save.preChallengeSnapshot ?? null,
          records: save.challengeRecords ?? {},
          sandboxTargetRP: save.sandboxTargetRP ?? '0',
          sandboxBestRP: save.sandboxBestRP ?? '0',
          sandboxCompletions: save.sandboxCompletions ?? 0
        }),
        JSON.stringify(save.automation ?? {}),
        JSON.stringify({
          points: save.currentOperationPoints ?? 0,
          artifactsUnlocked: save.operationArtifactsUnlocked ?? [],
          currentCycle: save.currentOperationCycle ?? 1,
          manualCycle: save.manualOperationCycle ?? null,
          cosmicAttunementLevel: save.cosmicAttunementLevel ?? 0,
          cosmicTemporalLevel: save.cosmicTemporalLevel ?? 0
        }),
        save.achievements ?? [],
        JSON.stringify(save.stats ?? {}),
        JSON.stringify(save.settings ?? {}),
        lastSavedTime,
        Math.min(
          2_147_483_647,
          Math.max(0, Math.floor(save.arkalonResonance ?? 0))
        ),
        Math.min(
          2_147_483_647,
          Math.max(0, Math.floor(save.chronalFractures ?? 0))
        ),
        Math.min(2_147_483_647, Math.max(0, Math.floor(save.omniSpars ?? 0))),
        Math.min(2_147_483_647, Math.max(0, Math.floor(save.artifactDust ?? 0)))
      ]
    )

    recordSave(playerId)
    return { success: true }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      process.env.NODE_ENV === 'development'
    ) {
      return { success: false, error: 'Database offline' }
    }
    console.error('[saveState] db error:', err)
    return { success: false, error: 'Database error' }
  } finally {
    client?.release()
  }
}
