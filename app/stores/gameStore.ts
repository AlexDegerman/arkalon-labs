import { create } from 'zustand'
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
  SettingsState
} from '@/types/game'
import type { FeatureKey } from '@/lib/featureRegistry'
import { STARTING_RP, RELIC_SLOT_COUNT_BASE } from '@/constants/game'
import { recalculatePPS } from '@/lib/productionEngine'

// Default generator state for all 20 generators
function makeDefaultGenerators(): GeneratorState[] {
  return Array.from({ length: 20 }, () => ({
    quantity: 0n,
    efficiencyLevel: 0,
    costReductionLevel: 0,
    synergyLevel: 0
  }))
}

// Default research slots (1 slot base; R3 adds second, Deep Research Slots adds third)
function makeDefaultResearchSlots(): ResearchSlotState[] {
  return [{ nodeId: null, timerRemaining: 0 }]
}

// Default relic slots (3 base)
function makeDefaultRelicSlots(): RelicSlotState[] {
  return Array.from({ length: RELIC_SLOT_COUNT_BASE }, () => ({
    relicId: null,
    cooldownRemaining: 0
  }))
}

const DEFAULT_AR_UPGRADES: ARUpgrades = {
  chronal_anchor: 0,
  dimensional_blueprinting: 0,
  neural_pipeline: 0,
  super_symmetry: 0,
  auto_buy_basic: 0,
  auto_research_queue: 0,
  research_accelerant: 0,
  generator_priming: 0,
  anomaly_extender: 0,
  milestone_sharpener: 0,
  relic_resonance: 0,
  challenge_accelerant: 0
}

const DEFAULT_CF_UPGRADES: CFUpgrades = {
  temporal_compression: 0,
  quantum_memory: 0,
  resonance_amplification: 0,
  auto_module_buyer: 0,
  generator_transcendence: 0,
  deep_research_slots: 0,
  relic_preservation: 0,
  megaproject_efficiency: 0
}

const DEFAULT_OS_UPGRADES: OSUpgrades = {
  dimensional_transcendence: 0,
  exponential_catalyst: 0,
  the_automated_lab: 0,
  automated_timeline_severance: 0
}

const DEFAULT_AUTOMATION: AutomationState = {
  autoBuyBasic: false,
  autoBuyOptimal: false,
  autoResearchQueue: false,
  autoStabilizeAnomaly: false,
  autoPrestigeTierI: false,
  autoPrestigeTierII: false,
  autoEquipRelic: false,
  autoLaunchProbe: false,
  autoModuleBuy: false
}

const DEFAULT_UNLOCKS: UnlockFlags = {
  techMatrix: false,
  statistics: false,
  modules: false,
  anomalies: false,
  interactiveArkalon: false,
  achievements: false,
  relics: false,
  excavation: false,
  prestige: false,
  megaprojects: false,
  anomalousOperations: false
}

const DEFAULT_STATS: StatsState = {
  totalAnomaliesResolved: 0,
  totalPrestigesTier1: 0,
  totalPrestigesTier2: 0,
  totalPrestigesTier3: 0,
  totalResearchNodesCompleted: 0,
  peakRPPerSec: 0n,
  totalSessionPlaytime: 0,
  lastPrestigeTime: 0
}

const DEFAULT_TUTORIAL: TutorialState = {
  tutorialCompleted: false,
  tutorialBeatsCompleted: [],
  tutorialHighlightTarget: null
}

const DEFAULT_SETTINGS: SettingsState = {
  volumeMusic: 0.4,
  volumeSFX: 0.6,
  volumeVoice: 0.8,
  currentUITheme: 'default',
  notationMode: 'suffix',
  decimalPrecision: 2,
  reducedMotion: false,
  colorBlindMode: false,
  gamePaused: false
}

export function makeInitialState(): GameState {
  return {
    researchPoints: STARTING_RP,
    lifetimePoints: 0n,
    arkalonResonance: 0,
    chronalFractures: 0,
    omniSpars: 0,
    artifactDust: 0,

    generators: makeDefaultGenerators(),

    completedResearchNodes: [],
    activeResearchSlots: makeDefaultResearchSlots(),
    researchQueue: [],
    infiniteResearchLevels: {},

    arUpgrades: DEFAULT_AR_UPGRADES,
    cfUpgrades: DEFAULT_CF_UPGRADES,
    osUpgrades: DEFAULT_OS_UPGRADES,

    relicSlots: makeDefaultRelicSlots(),
    unlockedRelics: [],
    relicLevels: {},

    probes: [],

    activeMegaprojectId: null,
    megaprojectAllocationPercent: 0,
    megaprojectRPAbsorbed: 0n,
    completedMegaprojects: [],

    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    anomalyInteractionValue: 0,
    timeToNextAnomalyCheck: 480, // 8 min initial wait

    currentOperationPoints: 0,
    operationMultiplierLevel: 0,
    operationArtifactsUnlocked: [],
    currentOperationCycle: 1,

    unlocks: DEFAULT_UNLOCKS,
    settings: DEFAULT_SETTINGS,
    stats: DEFAULT_STATS,
    tutorial: DEFAULT_TUTORIAL,

    activeChallengeId: null,
    challengeRecords: {},

    automation: DEFAULT_AUTOMATION,

    cachedPointsPerSecond: 0n,

    activeChallengeRestrictions: null
  }
}

// Store type with actions appended in gameActions.ts via immer-style merges
export type GameStore = GameState & {
  _initialized: boolean
  setInitialized: (v: boolean) => void
  setUnlock: (key: FeatureKey, value: boolean) => void
  setCachedPPS: (pps: bigint) => void
  // Triggers a full PPS recalculation and updates cachedPointsPerSecond
  recalcPPS: () => void
  applyState: (partial: Partial<GameState>) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...makeInitialState(),
  _initialized: false,

  setInitialized: (v) => set({ _initialized: v }),

  setUnlock: (key, value) =>
    set((s) => ({ unlocks: { ...s.unlocks, [key]: value } })),

  setCachedPPS: (pps) => set({ cachedPointsPerSecond: pps }),

  recalcPPS: () => {
    const state = get()
    const pps = recalculatePPS(state)
    set({ cachedPointsPerSecond: pps })
  },

  // Bulk state replacement used by save/load and prestige resets
  applyState: (partial) =>
    set((s) => {
      const next = { ...s, ...partial }
      // Recalculate PPS whenever state is bulk-replaced
      next.cachedPointsPerSecond = recalculatePPS(next)
      return next
    })
}))