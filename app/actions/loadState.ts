'use server'

import 'server-only'
import { cookies } from 'next/headers'
import pool from '@/lib/db'

interface LoadResult {
  success: boolean
  state?: Record<string, unknown>
  error?: string
}

export async function loadState(): Promise<LoadResult> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('arkalon_core_id')?.value

  if (!playerId) {
    return { success: false, error: 'Unauthorized: No active Arkalon session' }
  }

  const client = await pool.connect()
  try {
    const result = await client.query<{
      current_points: string
      lifetime_points: string
      arkalon_resonance: number
      chronal_fractures: number
      omni_spars: number
      artifact_dust: number
      generator_data: unknown
      research_data: unknown
      prestige_upgrades: unknown
      relic_data: unknown
      excavation_data: unknown
      megaproject_data: unknown
      anomaly_data: unknown
      feature_flags: unknown
      tutorial_data: unknown
      challenge_data: unknown
      automation_data: unknown
      operation_data: unknown
      achievements: string[]
      stats_data: unknown
      client_settings: unknown
      last_saved_time: string
    }>(`SELECT * FROM game_states WHERE player_id = $1`, [playerId])

    if (result.rows.length === 0) {
      return { success: true, state: undefined }
    }

    const row = result.rows[0]

    // Reconstruct serialized save shape for client-side hydration
    const researchData = (row.research_data as any) ?? {}
    const prestigeData = (row.prestige_upgrades as any) ?? {}
    const relicData = (row.relic_data as any) ?? {}
    const megaData = (row.megaproject_data as any) ?? {}
    const anomalyData = (row.anomaly_data as any) ?? {}
    const challengeData = (row.challenge_data as any) ?? {}
    const opData = (row.operation_data as any) ?? {}
    const statsData = (row.stats_data as any) ?? {}

    const reconstructed: Record<string, unknown> = {
      researchPoints: row.current_points,
      lifetimePoints: row.lifetime_points,
      arkalonResonance: row.arkalon_resonance,
      chronalFractures: row.chronal_fractures,
      omniSpars: row.omni_spars,
      artifactDust: row.artifact_dust,
      generators: row.generator_data,
      completedResearchNodes: researchData.completedNodes ?? [],
      activeResearchSlots: researchData.activeSlots ?? [],
      researchQueue: researchData.queue ?? [],
      infiniteResearchLevels: researchData.infiniteLevels ?? {},
      arUpgrades: prestigeData.ar ?? {},
      cfUpgrades: prestigeData.cf ?? {},
      osUpgrades: prestigeData.os ?? {},
      relicSlots: relicData.slots ?? [],
      unlockedRelics: relicData.unlocked ?? [],
      relicLevels: relicData.levels ?? {},
      probes: row.excavation_data,
      activeMegaprojectId: megaData.activeId ?? null,
      megaprojectAllocationPercent: megaData.allocationPercent ?? 0,
      megaprojectRPAbsorbed: megaData.rpAbsorbed ?? '0',
      completedMegaprojects: megaData.completed ?? [],
      activeAnomalyType: anomalyData.activeType ?? null,
      anomalyTimeRemaining: anomalyData.timeRemaining ?? 0,
      anomalyInteractionValue: anomalyData.interactionValue ?? 0,
      timeToNextAnomalyCheck: anomalyData.timeToNextCheck ?? 480,
      unlocks: row.feature_flags,
      tutorial: row.tutorial_data,
      activeChallengeId: challengeData.activeChallengeId ?? null,
      challengeRecords: challengeData.records ?? {},
      automation: row.automation_data,
      currentOperationPoints: opData.points ?? 0,
      operationMultiplierLevel: opData.multiplierLevel ?? 0,
      operationArtifactsUnlocked: opData.artifactsUnlocked ?? [],
      currentOperationCycle: opData.currentCycle ?? 1,
      achievements: row.achievements ?? [],
      stats: {
        totalAnomaliesResolved: statsData.totalAnomaliesResolved ?? 0,
        totalPrestigesTier1: statsData.totalPrestigesTier1 ?? 0,
        totalPrestigesTier2: statsData.totalPrestigesTier2 ?? 0,
        totalPrestigesTier3: statsData.totalPrestigesTier3 ?? 0,
        totalResearchNodesCompleted: statsData.totalResearchNodesCompleted ?? 0,
        peakRPPerSec: statsData.peakRPPerSec ?? '0',
        totalSessionPlaytime: statsData.totalSessionPlaytime ?? 0,
        lastPrestigeTime: statsData.lastPrestigeTime ?? 0
      },
      settings: row.client_settings,
      cachedPointsPerSecond: '0',
      lastSavedTime: Number(row.last_saved_time)
    }

    return { success: true, state: reconstructed }
  } catch (err) {
    console.error('[loadState] db error:', err)
    return { success: false, error: 'Database error' }
  } finally {
    client.release()
  }
}
