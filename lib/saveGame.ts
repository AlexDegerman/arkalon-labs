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
  OperationArtifactId,
  MegaprojectId,
  AnomalyType
} from '@/types/game'
import { makeInitialState } from '@/app/stores/gameStore'

const SAVE_KEY = 'arkalon_labs_save'
const SAVE_VERSION = 1

// Serialized save shape (all bigints as strings)
interface SerializedSave {
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
  completedResearchNodes: string[]
  activeResearchSlots: ResearchSlotState[]
  researchQueue: string[]
  infiniteResearchLevels: Record<string, number>
  arUpgrades: ARUpgrades
  cfUpgrades: CFUpgrades
  osUpgrades: OSUpgrades
  relicSlots: RelicSlotState[]
  unlockedRelics: number[]
  relicLevels: Record<string, number>
  probes: ProbeState[]
  activeMegaprojectId: MegaprojectId | null
  megaprojectAllocationPercent: number
  megaprojectRPAbsorbed: string
  completedMegaprojects: MegaprojectId[]
  activeAnomalyType: AnomalyType | null
  anomalyTimeRemaining: number
  anomalyInteractionValue: number
  timeToNextAnomalyCheck: number
  currentOperationPoints: number
  operationMultiplierLevel: number
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
    totalSessionPlaytime: number
    lastPrestigeTime: number
  }
  tutorial: TutorialState
  activeChallengeId: string | null
  challengeRecords: Record<string, { completedTiers: number; bestRP: string }>
  automation: AutomationState
  achievements: string[]
  cachedPointsPerSecond: string
  lastSavedTime: number
}

// Serialize full game state to a JSON-safe object
export function serialiseState(state: GameState): SerializedSave {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
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
    completedResearchNodes: state.completedResearchNodes,
    activeResearchSlots: state.activeResearchSlots,
    researchQueue: state.researchQueue,
    infiniteResearchLevels: state.infiniteResearchLevels,
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
    megaprojectRPAbsorbed: state.megaprojectRPAbsorbed.toString(),
    completedMegaprojects: state.completedMegaprojects,
    activeAnomalyType: state.activeAnomalyType,
    anomalyTimeRemaining: state.anomalyTimeRemaining,
    anomalyInteractionValue: state.anomalyInteractionValue,
    timeToNextAnomalyCheck: state.timeToNextAnomalyCheck,
    currentOperationPoints: state.currentOperationPoints,
    operationMultiplierLevel: state.operationMultiplierLevel,
    operationArtifactsUnlocked: state.operationArtifactsUnlocked,
    currentOperationCycle: state.currentOperationCycle,
    unlocks: state.unlocks,
    settings: state.settings,
    stats: {
      totalAnomaliesResolved: state.stats.totalAnomaliesResolved,
      totalPrestigesTier1: state.stats.totalPrestigesTier1,
      totalPrestigesTier2: state.stats.totalPrestigesTier2,
      totalPrestigesTier3: state.stats.totalPrestigesTier3,
      totalResearchNodesCompleted: state.stats.totalResearchNodesCompleted,
      peakRPPerSec: state.stats.peakRPPerSec.toString(),
      totalSessionPlaytime: state.stats.totalSessionPlaytime,
      lastPrestigeTime: state.stats.lastPrestigeTime
    },
    tutorial: state.tutorial,
    activeChallengeId: state.activeChallengeId,
    challengeRecords: Object.fromEntries(
      Object.entries(state.challengeRecords).map(([id, rec]) => [
        id,
        { completedTiers: rec.completedTiers, bestRP: rec.bestRP.toString() }
      ])
    ),
    automation: state.automation,
    achievements: state.achievements,
    cachedPointsPerSecond: state.cachedPointsPerSecond.toString(),
    lastSavedTime: Date.now()
  }
}

// Deserialize a saved object back into a full GameState
// Falls back to initial state values for any missing fields (migration safety)
export function deserialiseState(raw: unknown): GameState {
  const initial = makeInitialState()

  if (!raw || typeof raw !== 'object') return initial

  const s = raw as Partial<SerializedSave>

  // Helper: safely parse a bigint string
  function parseBigInt(v: unknown, fallback: bigint): bigint {
    try {
      if (typeof v === 'string') return BigInt(v)
      if (typeof v === 'number') return BigInt(Math.floor(v))
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

  const generators: GeneratorState[] =
    Array.isArray(s.generators) && s.generators.length === 20
      ? s.generators.map((g) => ({
          quantity: parseBigInt(g?.quantity, 0n),
          efficiencyLevel: parseNum(g?.efficiencyLevel, 0),
          costReductionLevel: parseNum(g?.costReductionLevel, 0),
          synergyLevel: parseNum(g?.synergyLevel, 0)
        }))
      : initial.generators

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
    totalSessionPlaytime: parseNum(s.stats?.totalSessionPlaytime, 0),
    lastPrestigeTime: parseNum(s.stats?.lastPrestigeTime, 0)
  }

  const challengeRecords: Record<string, ChallengeRecord> = {}
  if (s.challengeRecords && typeof s.challengeRecords === 'object') {
    for (const [id, rec] of Object.entries(s.challengeRecords)) {
      challengeRecords[id] = {
        completedTiers: parseNum((rec as any)?.completedTiers, 0),
        bestRP: parseBigInt((rec as any)?.bestRP, 0n)
      }
    }
  }

  const relicLevels: Record<number, number> = {}
  if (s.relicLevels && typeof s.relicLevels === 'object') {
    for (const [k, v] of Object.entries(s.relicLevels)) {
      relicLevels[Number(k)] = parseNum(v, 0)
    }
  }

  return {
    ...initial,
    researchPoints: parseBigInt(s.researchPoints, initial.researchPoints),
    lifetimePoints: parseBigInt(s.lifetimePoints, initial.lifetimePoints),
    arkalonResonance: parseNum(s.arkalonResonance, 0),
    chronalFractures: parseNum(s.chronalFractures, 0),
    omniSpars: parseNum(s.omniSpars, 0),
    artifactDust: parseNum(s.artifactDust, 0),
    generators,
    completedResearchNodes: Array.isArray(s.completedResearchNodes)
      ? s.completedResearchNodes
      : [],
    activeResearchSlots: Array.isArray(s.activeResearchSlots)
      ? s.activeResearchSlots
      : initial.activeResearchSlots,
    researchQueue: Array.isArray(s.researchQueue) ? s.researchQueue : [],
    infiniteResearchLevels:
      s.infiniteResearchLevels && typeof s.infiniteResearchLevels === 'object'
        ? (s.infiniteResearchLevels as Record<string, number>)
        : {},
    arUpgrades: { ...initial.arUpgrades, ...(s.arUpgrades ?? {}) },
    cfUpgrades: { ...initial.cfUpgrades, ...(s.cfUpgrades ?? {}) },
    osUpgrades: { ...initial.osUpgrades, ...(s.osUpgrades ?? {}) },
    relicSlots: Array.isArray(s.relicSlots) ? s.relicSlots : initial.relicSlots,
    unlockedRelics: Array.isArray(s.unlockedRelics) ? s.unlockedRelics : [],
    relicLevels,
    probes: Array.isArray(s.probes) ? (s.probes as ProbeState[]) : [],
    activeMegaprojectId:
      (s.activeMegaprojectId as MegaprojectId | null) ?? null,
    megaprojectAllocationPercent: parseNum(s.megaprojectAllocationPercent, 0),
    megaprojectRPAbsorbed: parseBigInt(s.megaprojectRPAbsorbed, 0n),
    completedMegaprojects: Array.isArray(s.completedMegaprojects)
      ? (s.completedMegaprojects as MegaprojectId[])
      : [],
    activeAnomalyType: (s.activeAnomalyType as AnomalyType | null) ?? null,
    anomalyTimeRemaining: parseNum(s.anomalyTimeRemaining, 0),
    anomalyInteractionValue: parseNum(s.anomalyInteractionValue, 0),
    timeToNextAnomalyCheck: parseNum(s.timeToNextAnomalyCheck, 480),
    currentOperationPoints: parseNum(s.currentOperationPoints, 0),
    operationMultiplierLevel: parseNum(s.operationMultiplierLevel, 0),
    operationArtifactsUnlocked: Array.isArray(s.operationArtifactsUnlocked)
      ? (s.operationArtifactsUnlocked as OperationArtifactId[])
      : [],
    currentOperationCycle: parseNum(s.currentOperationCycle, 1),
    unlocks: { ...initial.unlocks, ...(s.unlocks ?? {}) },
    settings: { ...initial.settings, ...(s.settings ?? {}) },
    stats,
    tutorial: s.tutorial
      ? { ...initial.tutorial, ...s.tutorial }
      : initial.tutorial,
    activeChallengeId: s.activeChallengeId ?? null,
    challengeRecords,
    automation: { ...initial.automation, ...(s.automation ?? {}) },
    achievements: Array.isArray(s.achievements) ? s.achievements : [],
    cachedPointsPerSecond: parseBigInt(s.cachedPointsPerSecond, 0n),
    activeChallengeRestrictions: null
  }
}

// Write current state to localStorage
export function saveToLocalStorage(state: GameState): void {
  try {
    const serialized = serialiseState(state)
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialized))
  } catch {
    // localStorage may be full or unavailable; fail silently
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
  return btoa(unescape(encodeURIComponent(json)))
}

// Import save from base64 string
// Returns deserialized state or null on failure
export function importSave(base64: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(base64.trim())))
    const parsed = JSON.parse(json)
    return deserialiseState(parsed)
  } catch {
    return null
  }
}

// Hard reset: clears localStorage save
export function clearLocalStorageSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}

// Returns the last save timestamp from localStorage without full deserialization
export function getLastSaveTime(): number | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.lastSavedTime === 'number'
      ? parsed.lastSavedTime
      : null
  } catch {
    return null
  }
}
