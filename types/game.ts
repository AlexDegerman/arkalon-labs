import type { FeatureKey } from '@/lib/featureRegistry'

// Prestige tier identifiers
export type PrestigeTier = 'tier1' | 'tier2' | 'tier3'

// Challenge category identifiers
export type ChallengeCategory = 'standard' | 'advanced' | 'extreme'

// Anomaly type identifiers
export type AnomalyType =
  | 'quantum_surge'
  | 'temporal_distortion'
  | 'containment_breach'
  | 'arkalon_resonance'
  | 'operation_chrono_freeze'
  | 'operation_solar_flare'
  | 'operation_gravity_sink'
  | 'operation_matrix_inversion'

// Excavation zone identifiers
export type ExcavationZone = 'safe' | 'unstable' | 'void'

// Probe status
export type ProbeStatus = 'idle' | 'scanning' | 'returning' | 'repairing'

// Megaproject identifiers
export type MegaprojectId =
  | 'chronos_array'
  | 'arkalon_matrix_mirror'
  | 'omega_singularity_sphere'

// Research branch identifiers
export type ResearchBranch = 'computation' | 'energy' | 'reality' | 'arkalon'

// Module type identifiers
export type ModuleType = 'efficiency' | 'cost_reduction' | 'synergy'

// Notation mode for number display
export type NotationMode = 'suffix' | 'scientific' | 'engineering' | 'logarithm'

// BGM context
export type BGMContext = 'idle' | 'anomaly' | 'prestige' | 'operation'

// Single generator state
export interface GeneratorState {
  quantity: bigint
  efficiencyLevel: number // 0-5
  costReductionLevel: number // 0-5
  synergyLevel: number // 0-5
}

// Single research slot state
export interface ResearchSlotState {
  nodeId: string | null
  timerRemaining: number // seconds
}

// Single probe state
export interface ProbeState {
  id: number
  status: ProbeStatus
  zone: ExcavationZone | null
  timerRemaining: number // seconds
  repairTimerRemaining: number // seconds (for Unstable Rift repair)
}

// Relic slot state
export interface RelicSlotState {
  relicId: number | null
  cooldownRemaining: number // seconds
}

// AR upgrade levels
export interface ARUpgrades {
  chronal_anchor: number // 0 or 1
  dimensional_blueprinting: number // 0 or 1
  neural_pipeline: number // 0-5
  super_symmetry: number // 0 or 1
  auto_buy_basic: number // 0 or 1
  auto_research_queue: number // 0 or 1
  research_accelerant: number // 0-10
  generator_priming: number // 0-20
  anomaly_extender: number // 0-5
  milestone_sharpener: number // 0-5
  relic_resonance: number // 0-10
  challenge_accelerant: number // 0 or 1
}

// CF upgrade levels
export interface CFUpgrades {
  temporal_compression: number // 0 or 1
  quantum_memory: number // 0 or 1
  resonance_amplification: number // 0 or 1
  auto_module_buyer: number // 0 or 1
  generator_transcendence: number // 0-5
  deep_research_slots: number // 0 or 1
  relic_preservation: number // 0 or 1
  megaproject_efficiency: number // 0-3
}

// OS upgrade levels
export interface OSUpgrades {
  dimensional_transcendence: number // 0 or 1
  exponential_catalyst: number // 0 or 1
  the_automated_lab: number // 0 or 1
  automated_timeline_severance: number // 0 or 1
}

// Automation feature toggles
export interface AutomationState {
  autoBuyBasic: boolean
  autoBuyOptimal: boolean
  autoResearchQueue: boolean
  autoStabilizeAnomaly: boolean
  autoPrestigeTierI: boolean
  autoPrestigeTierII: boolean
  autoEquipRelic: boolean
  autoLaunchProbe: boolean
  autoModuleBuy: boolean
}

// Feature unlock flags
export type UnlockFlags = Record<FeatureKey, boolean>

// Stats slice
export interface StatsState {
  totalAnomaliesResolved: number
  totalPrestigesTier1: number
  totalPrestigesTier2: number
  totalPrestigesTier3: number
  totalResearchNodesCompleted: number
  peakRPPerSec: bigint
  totalSessionPlaytime: number // seconds
  lastPrestigeTime: number // unix ms, 0 if never
}

// Tutorial slice
export interface TutorialState {
  tutorialCompleted: boolean
  tutorialBeatsCompleted: string[]
  tutorialHighlightTarget: string | null
}

// Challenge completion tracking
export interface ChallengeRecord {
  completedTiers: number // 0-5
  bestRP: bigint
}

// Operation artifact unlock
export type OperationArtifactId =
  | 'empirical_compass'
  | 'chronos_loom'
  | 'anomalous_lens'
  | 'arkalon_core_synapse'

// Settings slice
export interface SettingsState {
  volumeMusic: number
  volumeSFX: number
  volumeVoice: number
  currentUITheme: string
  notationMode: NotationMode
  decimalPrecision: 1 | 2 | 3
  reducedMotion: boolean
  colorBlindMode: boolean
  gamePaused: boolean
}

// Full Zustand store state shape
export interface GameState {
  // Currencies
  researchPoints: bigint
  lifetimePoints: bigint
  arkalonResonance: number
  chronalFractures: number
  omniSpars: number
  artifactDust: number

  // Generators: 20 entries indexed 0-19
  generators: GeneratorState[]

  // Research
  completedResearchNodes: string[]
  activeResearchSlots: ResearchSlotState[] // length 1-3
  researchQueue: string[] // max 4 node IDs
  infiniteResearchLevels: Record<string, number>

  // Prestige
  arUpgrades: ARUpgrades
  cfUpgrades: CFUpgrades
  osUpgrades: OSUpgrades

  // Relics
  relicSlots: RelicSlotState[] // length 3 base, expandable to 6
  unlockedRelics: number[] // relic IDs 1-20
  relicLevels: Record<number, number>

  // Excavation
  probes: ProbeState[]

  // Megaprojects
  activeMegaprojectId: MegaprojectId | null
  megaprojectAllocationPercent: number // 0-100
  megaprojectRPAbsorbed: bigint
  completedMegaprojects: MegaprojectId[]

  // Anomalies
  activeAnomalyType: AnomalyType | null
  anomalyTimeRemaining: number // seconds
  anomalyInteractionValue: number // anomaly-specific interaction state
  timeToNextAnomalyCheck: number // seconds

  // Operations
  currentOperationPoints: number
  operationMultiplierLevel: number
  operationArtifactsUnlocked: OperationArtifactId[]
  currentOperationCycle: number

  // Unlocks
  unlocks: UnlockFlags

  // Settings
  settings: SettingsState

  // Stats
  stats: StatsState

  // Tutorial
  tutorial: TutorialState

  // Challenges
  activeChallengeId: string | null
  challengeRecords: Record<string, ChallengeRecord>

  // Automation
  automation: AutomationState

  // Cached (read-only for tick loop)
  cachedPointsPerSecond: bigint

  // Active challenge restriction flags (set when challenge is active)
  activeChallengeRestrictions: ChallengeRestrictions | null
}

// Challenge restriction flags applied during a challenge run
export interface ChallengeRestrictions {
  maxGeneratorTier: number | null // null = no limit
  techMatrixDisabled: boolean
  arkalonClickDisabled: boolean
  modulesDisabled: boolean
  anomaliesDisabled: boolean
  generatorCostMultiplier: number // 1.0 = normal
  researchTimerMultiplier: number // 1.0 = normal
  milestonesDisabled: boolean
  energyBranchLocked: boolean
  singleResearchSlot: boolean
  relicsDisabled: boolean
  generatorProductionMultiplier: number // 1.0 = normal
  moduleLevelCapOverride: number | null // null = normal cap
  onlyGeneratorType: number | null // null = no restriction
  autoPrestigeIntervalSeconds: number | null // null = no forced prestige
  noResearchTimerTick: boolean
  noBaseGeneratorOutput: boolean
}

// Save payload sent to Server Action (bigints serialized as strings)
export interface SavePayload {
  sessionToken: string
  researchPoints: string
  lifetimePoints: string
  arkalonResonance: number
  chronalFractures: number
  omniSpars: number
  artifactDust: number
  generatorData: GeneratorState[]
  researchData: {
    completedNodes: string[]
    activeSlots: ResearchSlotState[]
    queue: string[]
    infiniteLevels: Record<string, number>
  }
  prestigeUpgrades: {
    ar: ARUpgrades
    cf: CFUpgrades
    os: OSUpgrades
  }
  relicData: {
    slots: RelicSlotState[]
    unlocked: number[]
    levels: Record<number, number>
  }
  excavationData: ProbeState[]
  megaprojectData: {
    activeId: MegaprojectId | null
    allocationPercent: number
    rpAbsorbed: string
    completed: MegaprojectId[]
  }
  anomalyData: {
    activeType: AnomalyType | null
    timeRemaining: number
    interactionValue: number
    timeToNextCheck: number
  }
  featureFlags: UnlockFlags
  tutorialData: TutorialState
  challengeData: {
    activeChallengeId: string | null
    records: Record<string, { completedTiers: number; bestRP: string }>
  }
  automationData: AutomationState
  operationData: {
    points: number
    multiplierLevel: number
    artifactsUnlocked: OperationArtifactId[]
    currentCycle: number
  }
  achievements: string[]
  statsData: {
    totalAnomaliesResolved: number
    totalPrestigesTier1: number
    totalPrestigesTier2: number
    totalPrestigesTier3: number
    totalResearchNodesCompleted: number
    peakRPPerSec: string
    totalSessionPlaytime: number
    lastPrestigeTime: number
  }
  clientSettings: SettingsState
  lastSavedTime: number
}

export interface TierThreshold {
  readonly label: string
  readonly cls: string
  readonly min: bigint
}