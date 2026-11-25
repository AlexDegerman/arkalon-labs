'use server'

import 'server-only'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import type {
  ARUpgrades,
  CFUpgrades,
  OSUpgrades,
  ResearchSlotState,
  RelicSlotState,
  MegaprojectId,
  AnomalyType,
  PreChallengeSnapshot,
  OperationArtifactId
} from '@/types/game'

interface LoadResult {
  success: boolean
  state?: Record<string, unknown>
  error?: string
}

export async function loadState(): Promise<LoadResult> {
  const cookieStore = await cookies()
  let playerId = cookieStore.get('arkalon_core_id')?.value

  // Local development mock fallback when running without Network Hub
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
    const result = await client.query<{
      current_points: string
      lifetime_points: string
      arkalon_resonance: number
      chronal_fractures: number
      omni_spars: number
      artifact_dust: number
      generator_data: unknown
      research_data: {
        completedNodes?: string[]
        activeSlots?: ResearchSlotState[]
        queue?: string[]
        infiniteLevels?: Record<string, number>
        o6BypassUsed?: boolean
      } | null
      prestige_upgrades: {
        ar?: Partial<ARUpgrades>
        cf?: Partial<CFUpgrades>
        os?: Partial<OSUpgrades>
        resonanceMemoryAR?: number
        autoPrestigeMode?: string
        autoPrestigeTargetAR?: number
        autoPrestigeRatio?: number
        autoPrestigeTargetCF?: number
        autoPrestigeTargetOS?: number
        autoPrestigeWaitForHigher?: boolean
        autoPrestigeHoldForDyson?: boolean
        autoBuyOptimalReservePercent?: number
        autoRelicTargetLevel?: number
        autoRelicDustReserve?: number
        autoLaunchZone?: string
      } | null
      relic_data: {
        slots?: RelicSlotState[]
        unlocked?: number[]
        levels?: Record<string, number>
        presets?: (number | null)[][]
        synthesizers?: number[]
        artifactDust?: number
      } | null
      excavation_data: unknown
      megaproject_data: {
        activeId?: MegaprojectId | null
        allocationPercent?: number
        lastAllocationPercent?: number
        rpAbsorbed?: string
        completed?: MegaprojectId[]
        dysonSwarmLevel?: number
      } | null
      anomaly_data: {
        activeType?: AnomalyType | null
        timeRemaining?: number
        spawnRawDuration?: number
        timeToNextCheck?: number
      } | null
      feature_flags: unknown
      tutorial_data: unknown
      challenge_data: {
        activeChallengeId?: string | null
        challengeActiveSeconds?: number
        activeChallengeRestrictions?: unknown
        preChallengeSnapshot?: PreChallengeSnapshot | null
        records?: Record<string, { completedTiers: number; bestRP: string }>
        sandboxTargetRP?: string
        sandboxBestRP?: string
        sandboxCompletions?: number
      } | null
      automation_data: unknown
      operation_data: {
        points?: number
        artifactsUnlocked?: OperationArtifactId[]
        currentCycle?: number
        manualCycle?: number | null
        cosmicAttunementLevel?: number
        cosmicTemporalLevel?: number
      } | null
      achievements: string[]
      stats_data: {
        totalAnomaliesResolved?: number
        totalPrestigesTier1?: number
        totalPrestigesTier2?: number
        totalPrestigesTier3?: number
        totalResearchNodesCompleted?: number
        peakRPPerSec?: string
        peakLifetimePoints?: string
        allTimePoints?: string
        allTimeDust?: number
        o10EverCompleted?: boolean
        bestChallengeTimes?: Record<string, number>
        relic4PityCount?: number
        relic9PityCount?: number
        totalSessionPlaytime?: number
        totalOfflineTime?: number
        lastPrestigeTime?: number
        currentRunSeconds?: number
      } | null
      client_settings: unknown
      last_saved_time: string
    }>(`SELECT * FROM game_states WHERE player_id = $1`, [playerId])

    if (result.rows.length === 0) {
      return { success: true, state: undefined }
    }

    const row = result.rows[0]

    // Reconstruct serialized save shape for client-side hydration
    const researchData = row.research_data ?? {}
    const prestigeData = row.prestige_upgrades ?? {}
    const relicData = row.relic_data ?? {}
    const megaData = row.megaproject_data ?? {}
    const anomalyData = row.anomaly_data ?? {}
    const challengeData = row.challenge_data ?? {}
    const opData = row.operation_data ?? {}
    const statsData = row.stats_data ?? {}

    const reconstructed: Record<string, unknown> = {
      researchPoints: row.current_points,
      lifetimePoints: row.lifetime_points,
      arkalonResonance: row.arkalon_resonance,
      chronalFractures: row.chronal_fractures,
      omniSpars: row.omni_spars,
      artifactDust: relicData.artifactDust ?? row.artifact_dust,
      generators: row.generator_data,
      completedResearchNodes: researchData.completedNodes ?? [],
      activeResearchSlots: researchData.activeSlots ?? [],
      researchQueue: researchData.queue ?? [],
      infiniteResearchLevels: researchData.infiniteLevels ?? {},
      o6BypassUsed: Boolean(researchData.o6BypassUsed),
      resonanceMemoryAR: prestigeData.resonanceMemoryAR ?? 0,
      arUpgrades: prestigeData.ar ?? {},
      cfUpgrades: prestigeData.cf ?? {},
      osUpgrades: prestigeData.os ?? {},
      autoPrestigeMode: prestigeData.autoPrestigeMode ?? 'ratio',
      autoPrestigeTargetAR: prestigeData.autoPrestigeTargetAR ?? 1000,
      autoPrestigeRatio: prestigeData.autoPrestigeRatio ?? 2,
      autoPrestigeTargetCF: prestigeData.autoPrestigeTargetCF ?? 10,
      autoPrestigeTargetOS: prestigeData.autoPrestigeTargetOS ?? 10,
      autoPrestigeWaitForHigher: prestigeData.autoPrestigeWaitForHigher ?? true,
      autoPrestigeHoldForDyson: prestigeData.autoPrestigeHoldForDyson ?? false,
      autoBuyOptimalReservePercent:
        prestigeData.autoBuyOptimalReservePercent ?? 25,
      autoRelicTargetLevel: prestigeData.autoRelicTargetLevel ?? 20,
      autoRelicDustReserve: prestigeData.autoRelicDustReserve ?? 25,
      autoLaunchZone: prestigeData.autoLaunchZone ?? 'safe',
      relicSlots: relicData.slots ?? [],
      unlockedRelics: relicData.unlocked ?? [],
      relicLevels: relicData.levels ?? {},
      relicPresets: relicData.presets ?? [[], [], []],
      synthesizers: relicData.synthesizers ?? [0, 0, 0, 0],
      probes: row.excavation_data,
      activeMegaprojectId: megaData.activeId ?? null,
      megaprojectAllocationPercent: megaData.allocationPercent ?? 0,
      lastMegaprojectAllocationPercent: megaData.lastAllocationPercent ?? 10,
      megaprojectRPAbsorbed: megaData.rpAbsorbed ?? '0',
      completedMegaprojects: megaData.completed ?? [],
      dysonSwarmLevel: megaData.dysonSwarmLevel ?? 0,
      activeAnomalyType: anomalyData.activeType ?? null,
      anomalyTimeRemaining: anomalyData.timeRemaining ?? 0,
      anomalySpawnRawDuration: anomalyData.spawnRawDuration ?? 0,
      timeToNextAnomalyCheck: anomalyData.timeToNextCheck ?? 180,
      unlocks: row.feature_flags,
      tutorial: row.tutorial_data,
      activeChallengeId: challengeData.activeChallengeId ?? null,
      challengeActiveSeconds: challengeData.challengeActiveSeconds ?? 0,
      activeChallengeRestrictions:
        challengeData.activeChallengeRestrictions ?? null,
      preChallengeSnapshot: challengeData.preChallengeSnapshot ?? null,
      challengeRecords: challengeData.records ?? {},
      sandboxTargetRP: challengeData.sandboxTargetRP ?? '0',
      sandboxBestRP: challengeData.sandboxBestRP ?? '0',
      sandboxCompletions: challengeData.sandboxCompletions ?? 0,
      automation: row.automation_data,
      currentOperationPoints: opData.points ?? 0,
      operationArtifactsUnlocked: opData.artifactsUnlocked ?? [],
      currentOperationCycle: opData.currentCycle ?? 1,
      manualOperationCycle: opData.manualCycle ?? null,
      cosmicAttunementLevel: opData.cosmicAttunementLevel ?? 0,
      cosmicTemporalLevel: opData.cosmicTemporalLevel ?? 0,
      achievements: row.achievements ?? [],
      stats: {
        totalAnomaliesResolved: statsData.totalAnomaliesResolved ?? 0,
        totalPrestigesTier1: statsData.totalPrestigesTier1 ?? 0,
        totalPrestigesTier2: statsData.totalPrestigesTier2 ?? 0,
        totalPrestigesTier3: statsData.totalPrestigesTier3 ?? 0,
        totalResearchNodesCompleted: statsData.totalResearchNodesCompleted ?? 0,
        peakRPPerSec: statsData.peakRPPerSec ?? '0',
        peakLifetimePoints:
          statsData.peakLifetimePoints ?? row.lifetime_points ?? '0',
        allTimePoints:
          statsData.allTimePoints ??
          statsData.peakLifetimePoints ??
          row.lifetime_points ??
          '0',
        allTimeDust: statsData.allTimeDust ?? row.artifact_dust ?? 0,
        o10EverCompleted:
          Boolean(statsData.o10EverCompleted) ||
          Boolean(researchData.completedNodes?.includes('O10')),
        bestChallengeTimes: statsData.bestChallengeTimes ?? {},
        relic4PityCount: statsData.relic4PityCount ?? 0,
        relic9PityCount: statsData.relic9PityCount ?? 0,
        totalSessionPlaytime: statsData.totalSessionPlaytime ?? 0,
        totalOfflineTime: statsData.totalOfflineTime ?? 0,
        lastPrestigeTime: statsData.lastPrestigeTime ?? 0,
        currentRunSeconds: statsData.currentRunSeconds
      },
      settings: row.client_settings,
      cachedPointsPerSecond: '0',
      lastSavedTime: Number(row.last_saved_time)
    }

    // Determine if a new operation cycle has started
    // A cycle is 90 days; compute from epoch
    const CYCLE_DURATION_MS = 90 * 24 * 3600 * 1000
    const serverCycleNumber = Math.floor(Date.now() / CYCLE_DURATION_MS) + 1
    
    // Attach server cycle number to the state for client to process
    reconstructed._serverCycleNumber = serverCycleNumber

    return { success: true, state: reconstructed }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      process.env.NODE_ENV === 'development'
    ) {
      return { success: false, error: 'Database offline' }
    }
    console.error('[loadState] db error:', err)
    return { success: false, error: 'Database error' }
  } finally {
    client?.release()
  }
}
