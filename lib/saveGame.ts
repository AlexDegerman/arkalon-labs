// Save/load utilities for localStorage and export/import
// BigInt values are serialized as strings at the boundary

import type {
  GameState,
  GeneratorState,
  ResearchSlotState,
  ProbeState,
  RelicSlotState,
  ARUpgrades,
  CFUpgrades,
  OSUpgrades,
  AutomationState,
  UnlockFlags,
  StatsState,
  TutorialState,
  SettingsState,
  ChallengeRecord,
  ChallengeRestrictions,
  PreChallengeSnapshot,
  OperationArtifactId,
  MegaprojectId,
  AnomalyType
} from '@/types/game'
import { makeInitialState } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { CHALLENGE_BALANCE_MAP } from './challengeDefs'
import { RELIC_MAP } from '@/constants/relics'
import { RESEARCH_NODE_MAP } from '@/constants/research'

let lastSaveErrorAlertMs = 0

const SAVE_KEY = 'arkalon_labs_save'
const SAVE_VERSION = 2

// Serialized save shape (all bigints as strings)
export interface SerializedSave {
  version: number
  savedAt: number
  researchPoints: string
  lifetimePoints: string
  arkalonResonance: number
  chronalFractures: number
  omniSpars: number
  artifactDust: number
  generators: Array<{
    quantity: string
    efficiencyLevel: number
    costReductionLevel: number
    synergyLevel: number
  }>
  synthesizers?: number[]
  completedResearchNodes: string[]
  activeResearchSlots: ResearchSlotState[]
  researchQueue: string[]
  infiniteResearchLevels: Record<string, number>
  o6BypassUsed?: boolean
  resonanceMemoryAR?: number
  arUpgrades: ARUpgrades
  cfUpgrades: CFUpgrades
  osUpgrades: OSUpgrades
  relicSlots: RelicSlotState[]
  unlockedRelics: number[]
  relicLevels: Record<string, number>
  probes: ProbeState[]
  activeMegaprojectId: MegaprojectId | null
  megaprojectAllocationPercent: number
  lastMegaprojectAllocationPercent?: number
  megaprojectRPAbsorbed: string
  completedMegaprojects: MegaprojectId[]
  activeAnomalyType: AnomalyType | null
  anomalyTimeRemaining: number
  timeToNextAnomalyCheck: number
  currentOperationPoints: number
  operationArtifactsUnlocked: OperationArtifactId[]
  currentOperationCycle: number
  unlocks: UnlockFlags
  settings: SettingsState
  stats: {
    totalAnomaliesResolved: number
    totalPrestigesTier1: number
    totalPrestigesTier2: number
    totalPrestigesTier3: number
    totalResearchNodesCompleted: number
    peakRPPerSec: string
    peakLifetimePoints: string
    allTimePoints?: string
    allTimeDust?: number
    o10EverCompleted?: boolean
    bestChallengeTimes?: Record<string, number>
    relic4PityCount?: number
    relic9PityCount?: number
    totalSessionPlaytime: number
    totalOfflineTime: number
    lastPrestigeTime: number
    currentRunSeconds?: number
  }
  tutorial: TutorialState
  activeChallengeId: string | null
  challengeActiveSeconds?: number
  activeChallengeRestrictions?:
    | (Omit<ChallengeRestrictions, 'maxGeneratorQuantity'> & {
        maxGeneratorQuantity: string | null
      })
    | null
  preChallengeSnapshot?: PreChallengeSnapshot | null
  challengeRecords: Record<string, { completedTiers: number; bestRP: string }>
  automation: AutomationState
  achievements: string[]
  cachedPointsPerSecond: string
  lastSavedTime: number
  dysonSwarmLevel: number
  manualOperationCycle: number | null
  cosmicAttunementLevel: number
  cosmicTemporalLevel: number
  sandboxTargetRP: string
  sandboxBestRP: string
  sandboxCompletions: number
  autoPrestigeMode: string
  autoPrestigeTargetAR: number
  autoPrestigeRatio: number
  autoPrestigeTargetCF?: number
  autoPrestigeTargetOS?: number
  autoPrestigeWaitForHigher?: boolean
  autoPrestigeHoldForDyson?: boolean
  autoBuyOptimalReservePercent?: number
  autoRelicTargetLevel?: number
  autoRelicDustReserve?: number
  relicPresets: (number | null)[][]
}

// Serialize full game state to a JSON-safe object
export function serialiseState(state: GameState): SerializedSave {
  const now = Date.now()
  return {
    version: SAVE_VERSION,
    savedAt: now,
    researchPoints: state.researchPoints.toString(),
    lifetimePoints: state.lifetimePoints.toString(),
    arkalonResonance: state.arkalonResonance,
    chronalFractures: state.chronalFractures,
    omniSpars: state.omniSpars,
    artifactDust: state.artifactDust,
    generators: state.generators.map((g) => ({
      quantity: g.quantity.toString(),
      efficiencyLevel: g.efficiencyLevel,
      costReductionLevel: g.costReductionLevel,
      synergyLevel: g.synergyLevel
    })),
    synthesizers: state.synthesizers,
    completedResearchNodes: state.completedResearchNodes,
    activeResearchSlots: state.activeResearchSlots,
    researchQueue: state.researchQueue,
    infiniteResearchLevels: state.infiniteResearchLevels,
    o6BypassUsed: Boolean(state.o6BypassUsed),
    resonanceMemoryAR: state.resonanceMemoryAR ?? 0,
    arUpgrades: state.arUpgrades,
    cfUpgrades: state.cfUpgrades,
    osUpgrades: state.osUpgrades,
    relicSlots: state.relicSlots,
    unlockedRelics: state.unlockedRelics,
    relicLevels: Object.fromEntries(
      Object.entries(state.relicLevels).map(([k, v]) => [k, v])
    ),
    probes: state.probes,
    activeMegaprojectId: state.activeMegaprojectId,
    megaprojectAllocationPercent: state.megaprojectAllocationPercent,
    lastMegaprojectAllocationPercent:
      state.lastMegaprojectAllocationPercent ?? 10,
    megaprojectRPAbsorbed: state.megaprojectRPAbsorbed.toString(),
    completedMegaprojects: state.completedMegaprojects,
    dysonSwarmLevel: state.dysonSwarmLevel ?? 0,
    activeAnomalyType: state.activeAnomalyType,
    anomalyTimeRemaining: state.anomalyTimeRemaining,
    timeToNextAnomalyCheck: state.timeToNextAnomalyCheck,
    currentOperationPoints: state.currentOperationPoints,
    operationArtifactsUnlocked: state.operationArtifactsUnlocked,
    currentOperationCycle: state.currentOperationCycle,
    manualOperationCycle: state.manualOperationCycle,
    cosmicAttunementLevel: state.cosmicAttunementLevel ?? 0,
    cosmicTemporalLevel: state.cosmicTemporalLevel ?? 0,
    unlocks: state.unlocks,
    settings: state.settings,
    stats: {
      totalAnomaliesResolved: state.stats.totalAnomaliesResolved,
      totalPrestigesTier1: state.stats.totalPrestigesTier1,
      totalPrestigesTier2: state.stats.totalPrestigesTier2,
      totalPrestigesTier3: state.stats.totalPrestigesTier3,
      totalResearchNodesCompleted: state.stats.totalResearchNodesCompleted,
      peakRPPerSec: state.stats.peakRPPerSec.toString(),
      peakLifetimePoints: (
        state.stats.peakLifetimePoints ?? state.lifetimePoints
      ).toString(),
      allTimePoints: (
        state.stats.allTimePoints ?? state.lifetimePoints
      ).toString(),
      allTimeDust: state.stats.allTimeDust ?? state.artifactDust,
      o10EverCompleted: Boolean(state.stats.o10EverCompleted),
      bestChallengeTimes: state.stats.bestChallengeTimes ?? {},
      relic4PityCount: state.stats.relic4PityCount ?? 0,
      relic9PityCount: state.stats.relic9PityCount ?? 0,
      totalSessionPlaytime: state.stats.totalSessionPlaytime,
      totalOfflineTime: state.stats.totalOfflineTime ?? 0,
      lastPrestigeTime: state.stats.lastPrestigeTime,
      currentRunSeconds: state.stats.currentRunSeconds ?? 0
    },
    tutorial: state.tutorial,
    activeChallengeId: state.activeChallengeId,
    challengeActiveSeconds: state.challengeActiveSeconds ?? 0,
    activeChallengeRestrictions: state.activeChallengeRestrictions
      ? {
          ...state.activeChallengeRestrictions,
          maxGeneratorQuantity:
            state.activeChallengeRestrictions.maxGeneratorQuantity !== null
              ? state.activeChallengeRestrictions.maxGeneratorQuantity.toString()
              : null
        }
      : null,
    preChallengeSnapshot: state.preChallengeSnapshot ?? null,
    sandboxTargetRP: (state.sandboxTargetRP ?? 0n).toString(),
    sandboxBestRP: (state.sandboxBestRP ?? 0n).toString(),
    sandboxCompletions: state.sandboxCompletions ?? 0,
    challengeRecords: Object.fromEntries(
      Object.entries(state.challengeRecords).map(([id, rec]) => [
        id,
        { completedTiers: rec.completedTiers, bestRP: rec.bestRP.toString() }
      ])
    ),
    automation: state.automation,
    autoPrestigeMode: state.autoPrestigeMode ?? 'ratio',
    autoPrestigeTargetAR: state.autoPrestigeTargetAR ?? 1000,
    autoPrestigeRatio: state.autoPrestigeRatio ?? 2,
    autoPrestigeTargetCF: state.autoPrestigeTargetCF ?? 10,
    autoPrestigeTargetOS: state.autoPrestigeTargetOS ?? 10,
    autoPrestigeWaitForHigher: state.autoPrestigeWaitForHigher ?? true,
    autoPrestigeHoldForDyson: state.autoPrestigeHoldForDyson ?? false,
    autoBuyOptimalReservePercent: state.autoBuyOptimalReservePercent ?? 25,
    autoRelicTargetLevel: state.autoRelicTargetLevel ?? 20,
    autoRelicDustReserve: state.autoRelicDustReserve ?? 25,
    achievements: state.achievements,
    cachedPointsPerSecond: state.cachedPointsPerSecond.toString(),
    lastSavedTime: now,
    relicPresets: state.relicPresets
  }
}

function migrateRawSave(raw: Record<string, unknown>): Partial<SerializedSave> {
  const version =
    typeof raw.version === 'number' && Number.isFinite(raw.version)
      ? raw.version
      : 1
  const migrated: Record<string, unknown> = { ...raw }

  if (version < 2) {
    if (
      migrated.lastSavedTime === undefined &&
      typeof migrated.savedAt === 'number'
    ) {
      migrated.lastSavedTime = migrated.savedAt
    }
    if (
      migrated.activeChallengeId &&
      (!migrated.preChallengeSnapshot ||
        typeof migrated.preChallengeSnapshot !== 'object')
    ) {
      migrated.activeChallengeId = null
      migrated.activeChallengeRestrictions = null
    }
    migrated.version = 2
  }

  return migrated as Partial<SerializedSave>
}

// Deserialize a saved object back into a full GameState
// Falls back to initial state values for any missing fields (migration safety)
export function deserialiseState(raw: unknown): GameState {
  const initial = makeInitialState()

  if (!raw || typeof raw !== 'object') return initial

  const s = migrateRawSave(raw as Record<string, unknown>)

  // Helper: safely parse a bigint string
  function parseBigInt(v: unknown, fallback: bigint): bigint {
    try {
      if (typeof v === 'string') return BigInt(v)
      if (typeof v === 'number' && isFinite(v)) return BigInt(Math.floor(v))
      return fallback
    } catch {
      return fallback
    }
  }

  // Helper: safely parse a number with fallback
  function parseNum(v: unknown, fallback: number): number {
    if (typeof v === 'number' && isFinite(v)) return v
    return fallback
  }

  const generators: GeneratorState[] = Array.isArray(s.generators)
    ? initial.generators.map((fallback, i) => {
        const g = s.generators![i]
        if (!g || typeof g !== 'object') return fallback
        const qty = parseBigInt(g.quantity, 0n)
        return {
          quantity: qty < 0n ? 0n : qty,
          efficiencyLevel: Math.max(
            0,
            Math.floor(parseNum(g.efficiencyLevel, 0))
          ),
          costReductionLevel: Math.max(
            0,
            Math.floor(parseNum(g.costReductionLevel, 0))
          ),
          synergyLevel: Math.max(0, Math.floor(parseNum(g.synergyLevel, 0)))
        }
      })
    : initial.generators

  const rawBestTimes = s.stats?.bestChallengeTimes
  const bestChallengeTimes: Record<string, number> = {}
  if (rawBestTimes && typeof rawBestTimes === 'object') {
    for (const [k, v] of Object.entries(rawBestTimes)) {
      if (typeof v === 'number' && isFinite(v) && v >= 0) {
        bestChallengeTimes[k] = v
      }
    }
  }

  const parsedPeakLifetime = parseBigInt(
    s.stats?.peakLifetimePoints,
    parseBigInt(s.lifetimePoints, 0n)
  )

  const stats: StatsState = {
    totalAnomaliesResolved: parseNum(s.stats?.totalAnomaliesResolved, 0),
    totalPrestigesTier1: parseNum(s.stats?.totalPrestigesTier1, 0),
    totalPrestigesTier2: parseNum(s.stats?.totalPrestigesTier2, 0),
    totalPrestigesTier3: parseNum(s.stats?.totalPrestigesTier3, 0),
    totalResearchNodesCompleted: parseNum(
      s.stats?.totalResearchNodesCompleted,
      0
    ),
    peakRPPerSec: parseBigInt(s.stats?.peakRPPerSec, 0n),
    peakLifetimePoints: parsedPeakLifetime,
    allTimePoints: parseBigInt(s.stats?.allTimePoints, parsedPeakLifetime),
    allTimeDust: parseNum(s.stats?.allTimeDust, parseNum(s.artifactDust, 0)),
    o10EverCompleted:
      Boolean(s.stats?.o10EverCompleted) ||
      (Array.isArray(s.completedResearchNodes) &&
        s.completedResearchNodes.includes('O10')),
    bestChallengeTimes,
    relic4PityCount: parseNum(s.stats?.relic4PityCount, 0),
    relic9PityCount: parseNum(s.stats?.relic9PityCount, 0),
    totalSessionPlaytime: parseNum(s.stats?.totalSessionPlaytime, 0),
    totalOfflineTime: parseNum(s.stats?.totalOfflineTime, 0),
    lastPrestigeTime: parseNum(s.stats?.lastPrestigeTime, 0),
    currentRunSeconds: Math.max(
      0,
      parseNum(
        s.stats?.currentRunSeconds,
        s.stats?.lastPrestigeTime
          ? Math.floor((Date.now() - s.stats.lastPrestigeTime) / 1000)
          : parseNum(s.stats?.totalSessionPlaytime, 0)
      )
    )
  }
  
  function parseChallengeRestrictions(
    rawRest: unknown
  ): ChallengeRestrictions | null {
    if (!rawRest || typeof rawRest !== 'object') return null
    const r = rawRest as Record<string, unknown>
    return {
      maxGeneratorTier:
        typeof r.maxGeneratorTier === 'number' ? r.maxGeneratorTier : null,
      maxGeneratorQuantity:
        r.maxGeneratorQuantity !== null && r.maxGeneratorQuantity !== undefined
          ? parseBigInt(r.maxGeneratorQuantity, 0n)
          : null,
      techMatrixDisabled: Boolean(r.techMatrixDisabled),
      modulesDisabled: Boolean(r.modulesDisabled),
      anomaliesDisabled: Boolean(r.anomaliesDisabled),
      excavationDisabled: Boolean(r.excavationDisabled),
      generatorCostMultiplier: parseNum(r.generatorCostMultiplier, 1),
      researchTimerMultiplier: parseNum(r.researchTimerMultiplier, 1),
      milestonesDisabled: Boolean(r.milestonesDisabled),
      energyBranchLocked: Boolean(r.energyBranchLocked),
      arkalonBranchLocked: Boolean(r.arkalonBranchLocked),
      singleBranchOnly: Boolean(r.singleBranchOnly),
      singleResearchSlot: Boolean(r.singleResearchSlot),
      relicsDisabled: Boolean(r.relicsDisabled),
      generatorProductionMultiplier: parseNum(
        r.generatorProductionMultiplier,
        1
      ),
      moduleLevelCapOverride:
        typeof r.moduleLevelCapOverride === 'number'
          ? r.moduleLevelCapOverride
          : null,
      onlyGeneratorType:
        typeof r.onlyGeneratorType === 'number' ? r.onlyGeneratorType : null,
      autoPrestigeIntervalSeconds:
        typeof r.autoPrestigeIntervalSeconds === 'number'
          ? r.autoPrestigeIntervalSeconds
          : null,
      anomalySpawnIntervalSeconds:
        typeof r.anomalySpawnIntervalSeconds === 'number'
          ? r.anomalySpawnIntervalSeconds
          : null,
      anomalyDurationOverrideSeconds:
        typeof r.anomalyDurationOverrideSeconds === 'number'
          ? r.anomalyDurationOverrideSeconds
          : null,
      noResearchTimerTick: Boolean(r.noResearchTimerTick),
      noBaseGeneratorOutput: Boolean(r.noBaseGeneratorOutput),
      productionOnlyWhileResearching: Boolean(r.productionOnlyWhileResearching),
      prestigeUpgradesDisabled: Boolean(r.prestigeUpgradesDisabled)
    }
  }

  const challengeRecords: Record<string, ChallengeRecord> = {}
  if (s.challengeRecords && typeof s.challengeRecords === 'object') {
    for (const [id, rec] of Object.entries(s.challengeRecords)) {
      challengeRecords[id] = {
        completedTiers: parseNum(rec?.completedTiers, 0),
        bestRP: parseBigInt(rec?.bestRP, 0n)
      }
    }
  }

  const relicLevels: Record<number, number> = {}
  if (s.relicLevels && typeof s.relicLevels === 'object') {
    for (const [k, v] of Object.entries(s.relicLevels)) {
      const id = Number(k)
      if (!Number.isInteger(id) || !RELIC_MAP[id]) continue
      const maxLv = RELIC_MAP[id].maxLevel ?? 100
      relicLevels[id] = Math.min(maxLv, Math.max(0, Math.floor(parseNum(v, 0))))
    }
  }

  const rawRelicSlots: RelicSlotState[] = Array.isArray(s.relicSlots)
    ? s.relicSlots.map((slot) => {
        if (!slot || typeof slot !== 'object') {
          return { relicId: null }
        }
        const rawId = (slot as { relicId?: unknown }).relicId
        const relicId =
          typeof rawId === 'number' &&
          Number.isInteger(rawId) &&
          rawId >= 1 &&
          rawId <= 20
            ? rawId
            : null
        return { relicId }
      })
    : initial.relicSlots
  const sc11Tiers = parseNum(s.challengeRecords?.['SC11']?.completedTiers, 0)
  const targetSlotCount = Math.min(6, 3 + sc11Tiers)
  const relicSlots: RelicSlotState[] = [...rawRelicSlots]
  while (relicSlots.length < targetSlotCount) {
    relicSlots.push({ relicId: null })
  }

  const synthesizers: number[] = Array.isArray(s.synthesizers)
    ? initial.synthesizers.map((fallback, i) =>
        Math.max(0, Math.floor(parseNum(s.synthesizers![i], fallback)))
      )
    : initial.synthesizers

  const activeResearchSlots: ResearchSlotState[] =
    Array.isArray(s.activeResearchSlots) && s.activeResearchSlots.length > 0
      ? s.activeResearchSlots.map((slot) => {
          if (!slot || typeof slot !== 'object') {
            return { nodeId: null, timerRemaining: 0 }
          }
          const rawNodeId = (slot as { nodeId?: unknown }).nodeId
          const nodeId =
            typeof rawNodeId === 'string' && rawNodeId.length > 0
              ? rawNodeId
              : null
          const timerRemaining = nodeId
            ? Math.max(
                0,
                parseNum(
                  (slot as { timerRemaining?: unknown }).timerRemaining,
                  0
                )
              )
            : 0
          return { nodeId, timerRemaining }
        })
      : initial.activeResearchSlots

  const validStatuses = new Set(['idle', 'scanning', 'repairing'])
  const validZones = new Set(['safe', 'unstable', 'void'])
  const validSubsystems = new Set(['none', 'shielding', 'thrusters', 'siphon'])

  const probes: ProbeState[] = Array.isArray(s.probes)
    ? s.probes.flatMap((rawProbe, idx) => {
        if (!rawProbe || typeof rawProbe !== 'object') return []
        const p = rawProbe as Partial<ProbeState>
        const rawStatus =
          typeof p.status === 'string' && validStatuses.has(p.status)
            ? p.status
            : 'idle'
        const zone =
          typeof p.zone === 'string' && validZones.has(p.zone) ? p.zone : null
        const status = rawStatus === 'scanning' && !zone ? 'idle' : rawStatus
        const timerRemaining =
          status === 'scanning' ? Math.max(0, parseNum(p.timerRemaining, 0)) : 0
        const repairTimerRemaining =
          status === 'repairing'
            ? Math.max(0, parseNum(p.repairTimerRemaining, 0))
            : 0
        const subsystem =
          typeof p.subsystem === 'string' && validSubsystems.has(p.subsystem)
            ? p.subsystem
            : 'none'
        const scanDuration =
          typeof p.scanDuration === 'number' &&
          isFinite(p.scanDuration) &&
          p.scanDuration > 0
            ? p.scanDuration
            : undefined
        const repairDuration =
          typeof p.repairDuration === 'number' &&
          isFinite(p.repairDuration) &&
          p.repairDuration > 0
            ? p.repairDuration
            : undefined

        return [
          {
            id: Math.max(1, Math.floor(parseNum(p.id, idx + 1))),
            status,
            zone: status === 'scanning' ? zone : null,
            timerRemaining,
            ...(scanDuration !== undefined ? { scanDuration } : {}),
            repairTimerRemaining,
            ...(repairDuration !== undefined ? { repairDuration } : {}),
            subsystem,
            veteranRank: Math.max(
              0,
              Math.min(5, Math.floor(parseNum(p.veteranRank, 0)))
            ),
            expeditionsCompleted: Math.max(
              0,
              Math.floor(parseNum(p.expeditionsCompleted, 0))
            )
          }
        ]
      })
    : []

  const parsedChallengeRestrictions = parseChallengeRestrictions(
    s.activeChallengeRestrictions
  )

  const completedResearchNodes: string[] = Array.isArray(
    s.completedResearchNodes
  )
    ? Array.from(
        new Set(
          s.completedResearchNodes.filter(
            (id): id is string =>
              typeof id === 'string' && Boolean(RESEARCH_NODE_MAP[id])
          )
        )
      )
    : []

  const researchQueue: string[] = Array.isArray(s.researchQueue)
    ? Array.from(
        new Set(
          s.researchQueue.filter(
            (id): id is string =>
              typeof id === 'string' &&
              Boolean(RESEARCH_NODE_MAP[id]) &&
              !RESEARCH_NODE_MAP[id].isInfinite
          )
        )
      )
    : []

  const infiniteResearchLevels: Record<string, number> = {}
  if (
    s.infiniteResearchLevels &&
    typeof s.infiniteResearchLevels === 'object'
  ) {
    for (const [k, v] of Object.entries(s.infiniteResearchLevels)) {
      if (!RESEARCH_NODE_MAP[k]?.isInfinite) continue
      const lvl = Math.max(0, Math.floor(parseNum(v, 0)))
      infiniteResearchLevels[k] = k === 'R_INF' ? Math.min(299, lvl) : lvl
    }
  }

  const unlockedRelics: number[] = Array.isArray(s.unlockedRelics)
    ? Array.from(
        new Set(
          s.unlockedRelics.filter(
            (id): id is number =>
              typeof id === 'number' &&
              Number.isInteger(id) &&
              Boolean(RELIC_MAP[id])
          )
        )
      )
    : []

  const relicPresets: (number | null)[][] = Array.isArray(s.relicPresets)
    ? [0, 1, 2].map((idx) => {
        const preset = s.relicPresets![idx]
        if (!Array.isArray(preset)) return []
        return preset.map((entry) =>
          typeof entry === 'number' &&
          Number.isInteger(entry) &&
          Boolean(RELIC_MAP[entry])
            ? entry
            : null
        )
      })
    : [[], [], []]

  const rawSnapshot = s.preChallengeSnapshot
  let parsedSnapshot: PreChallengeSnapshot | null = null
  if (
    rawSnapshot &&
    typeof rawSnapshot === 'object' &&
    typeof rawSnapshot.researchPoints === 'string' &&
    typeof rawSnapshot.lifetimePoints === 'string' &&
    Array.isArray(rawSnapshot.generators) &&
    Array.isArray(rawSnapshot.completedResearchNodes) &&
    Array.isArray(rawSnapshot.activeResearchSlots) &&
    Array.isArray(rawSnapshot.researchQueue) &&
    typeof rawSnapshot.lastPrestigeTime === 'number'
  ) {
    try {
      BigInt(rawSnapshot.researchPoints)
      BigInt(rawSnapshot.lifetimePoints)
      parsedSnapshot = rawSnapshot
    } catch {
      parsedSnapshot = null
    }
  }

  return {
    ...initial,
    researchPoints: parseBigInt(s.researchPoints, initial.researchPoints),
    lifetimePoints: parseBigInt(s.lifetimePoints, initial.lifetimePoints),
    arkalonResonance: parseNum(s.arkalonResonance, 0),
    chronalFractures: parseNum(s.chronalFractures, 0),
    omniSpars: parseNum(s.omniSpars, 0),
    artifactDust: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(0, Math.floor(parseNum(s.artifactDust, 0)))
    ),
    generators,
    synthesizers,
    completedResearchNodes,
    activeResearchSlots,
    researchQueue,
    infiniteResearchLevels,
    o6BypassUsed: Boolean(s.o6BypassUsed),
    resonanceMemoryAR: parseNum(s.resonanceMemoryAR, 0),
    arUpgrades: { ...initial.arUpgrades, ...(s.arUpgrades ?? {}) },
    cfUpgrades: { ...initial.cfUpgrades, ...(s.cfUpgrades ?? {}) },
    osUpgrades: { ...initial.osUpgrades, ...(s.osUpgrades ?? {}) },
    relicSlots,
    unlockedRelics,
    relicLevels,
    relicPresets,
    probes,
    activeMegaprojectId:
      (s.activeMegaprojectId as MegaprojectId | null) ?? null,
    megaprojectAllocationPercent: parseNum(s.megaprojectAllocationPercent, 0),
    lastMegaprojectAllocationPercent: parseNum(
      s.lastMegaprojectAllocationPercent,
      10
    ),
    megaprojectRPAbsorbed: parseBigInt(s.megaprojectRPAbsorbed, 0n),
    completedMegaprojects: Array.isArray(s.completedMegaprojects)
      ? (s.completedMegaprojects as MegaprojectId[])
      : [],
    dysonSwarmLevel:
      typeof s.dysonSwarmLevel === 'number' ? s.dysonSwarmLevel : 0,
    activeAnomalyType: (s.activeAnomalyType as AnomalyType | null) ?? null,
    anomalyTimeRemaining: parseNum(s.anomalyTimeRemaining, 0),
    timeToNextAnomalyCheck: parseNum(s.timeToNextAnomalyCheck, 180),
    currentOperationPoints: parseNum(s.currentOperationPoints, 0),
    operationArtifactsUnlocked: Array.isArray(s.operationArtifactsUnlocked)
      ? (s.operationArtifactsUnlocked as OperationArtifactId[])
      : [],
    currentOperationCycle: parseNum(s.currentOperationCycle, 1),
    manualOperationCycle:
      typeof s.manualOperationCycle === 'number'
        ? s.manualOperationCycle
        : null,
    cosmicAttunementLevel: parseNum(s.cosmicAttunementLevel, 0),
    cosmicTemporalLevel: parseNum(s.cosmicTemporalLevel, 0),
    unlocks: { ...initial.unlocks, ...(s.unlocks ?? {}) },
    settings: {
      ...initial.settings,
      ...(s.settings ?? {}),
      neonBloom: s.settings?.neonBloom ?? true,
      crtScanlines: s.settings?.crtScanlines ?? false,
      reducedMotion: s.settings?.reducedMotion ?? false
    },
    stats,
    tutorial: s.tutorial
      ? { ...initial.tutorial, ...s.tutorial }
      : initial.tutorial,
    activeChallengeId:
      s.activeChallengeId === 'SANDBOX' && !parsedChallengeRestrictions
        ? null
        : (s.activeChallengeId ?? null),
    challengeActiveSeconds: parseNum(s.challengeActiveSeconds, 0),
    preChallengeSnapshot: parsedSnapshot,
    sandboxTargetRP: parseBigInt(s.sandboxTargetRP, 0n),
    sandboxBestRP: parseBigInt(s.sandboxBestRP, 0n),
    sandboxCompletions: parseNum(s.sandboxCompletions, 0),
    challengeRecords,
    automation: { ...initial.automation, ...(s.automation ?? {}) },
    autoPrestigeMode:
      s.autoPrestigeMode === 'target' ||
      s.autoPrestigeMode === 'ratio' ||
      s.autoPrestigeMode === 'stall'
        ? s.autoPrestigeMode
        : 'ratio',
    autoPrestigeTargetAR: parseNum(s.autoPrestigeTargetAR, 1000),
    autoPrestigeRatio: parseNum(s.autoPrestigeRatio, 2),
    autoPrestigeTargetCF: parseNum(s.autoPrestigeTargetCF, 10),
    autoPrestigeTargetOS: parseNum(s.autoPrestigeTargetOS, 10),
    autoPrestigeWaitForHigher: s.autoPrestigeWaitForHigher ?? true,
    autoPrestigeHoldForDyson: s.autoPrestigeHoldForDyson ?? false,
    autoBuyOptimalReservePercent: parseNum(s.autoBuyOptimalReservePercent, 25),
    autoRelicTargetLevel: parseNum(s.autoRelicTargetLevel, 20),
    autoRelicDustReserve: parseNum(s.autoRelicDustReserve, 25),
    achievements: Array.isArray(s.achievements) ? s.achievements : [],
    cachedPointsPerSecond: parseBigInt(s.cachedPointsPerSecond, 0n),
    lastSavedTime: Math.max(0, parseNum(s.lastSavedTime ?? s.savedAt, 0)),
    activeChallengeRestrictions:
      s.activeChallengeId === 'SANDBOX'
        ? parsedChallengeRestrictions
        : s.activeChallengeId
          ? (parsedChallengeRestrictions ??
            CHALLENGE_BALANCE_MAP[s.activeChallengeId]?.buildRestrictions() ??
            null)
          : null
  }
}

// Write current state to localStorage
export function saveToLocalStorage(state: GameState): void {
  try {
    const serialized = serialiseState(state)
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialized))
    setLastSaveTime(serialized.lastSavedTime)
  } catch {
    const now = Date.now()
    if (typeof window !== 'undefined' && now - lastSaveErrorAlertMs >= 60_000) {
      lastSaveErrorAlertMs = now
      useUIStore.getState().pushAlert({
        priority: 0,
        variant: 'anomaly',
        title: 'Local Save Failed',
        message:
          'Browser storage is full or blocked. Export your save in Settings or sync to cloud.',
        autoDismissMs: 8000
      })
    }
  }
}

// Read and deserialize state from localStorage
// Returns null if no save found or if save is corrupt
export function loadFromLocalStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return deserialiseState(parsed)
  } catch {
    return null
  }
}

// Export save as base64 string for clipboard copy
export function exportSave(state: GameState): string {
  const serialized = serialiseState(state)
  const json = JSON.stringify(serialized)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function isValidSerializedSave(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== 'object') return false
  const s = parsed as Partial<SerializedSave>
  if (
    !Array.isArray(s.generators) ||
    typeof s.researchPoints !== 'string' ||
    typeof s.lifetimePoints !== 'string'
  ) {
    return false
  }
  if (
    s.activeChallengeId &&
    (!s.preChallengeSnapshot || typeof s.preChallengeSnapshot !== 'object')
  ) {
    return false
  }
  return true
}

// Import save from base64 string
// Returns deserialized state or null on failure
export function importSave(base64: string): GameState | null {
  try {
    const binary = atob(base64.trim())
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const json = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(json)
    if (!isValidSerializedSave(parsed)) return null
    return deserialiseState(parsed)
  } catch {
    try {
      const json = decodeURIComponent(escape(atob(base64.trim())))
      const parsed = JSON.parse(json)
      if (!isValidSerializedSave(parsed)) return null
      return deserialiseState(parsed)
    } catch {
      return null
    }
  }
}

// Hard reset: clears localStorage save
export function clearLocalStorageSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(LAST_SAVE_KEY)
  } catch {
    // Storage unavailable
  }
}

// Returns the last save timestamp from localStorage without full deserialization
const LAST_SAVE_KEY = 'arkalon_labs_last_save_time'

export function getLastSaveTime(): number {
  try {
    const raw = localStorage.getItem(LAST_SAVE_KEY)
    if (!raw) return 0
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export function setLastSaveTime(ms: number): void {
  try {
    localStorage.setItem(LAST_SAVE_KEY, String(ms))
  } catch {
    // Storage full or blocked
  }
}