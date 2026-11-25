import type { FeatureKey } from '@/lib/featureRegistry'

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
  | 'fused_singularity_surge'
  | 'fused_chronal_breach'

// Excavation zone identifiers
export type ExcavationZone =
  | 'safe'
  | 'unstable'
  | 'void'
  | 'singularity'
  | 'omega'

// Probe status
export type ProbeStatus = 'idle' | 'scanning' | 'repairing'

// Megaproject identifiers
export type MegaprojectId =
  | 'chronos_array'
  | 'arkalon_matrix_mirror'
  | 'omega_singularity_sphere'
  | 'dyson_swarm'

// Research branch identifiers
export type ResearchBranch = 'computation' | 'energy' | 'reality' | 'arkalon'

// Module type identifiers
export type ModuleType = 'efficiency' | 'cost_reduction' | 'synergy'

// Notation mode for number display
// Single source of truth - imported by lib/format.ts
export type NotationMode = 'suffix' | 'scientific'

// Single generator state
export interface GeneratorState {
  quantity: bigint
  efficiencyLevel: number // 0-cap (base 5, AC5 raises)
  costReductionLevel: number // 0-cap (base 5, AC5 raises)
  synergyLevel: number // 0-cap (base 5, AC5 raises)
}

// Single research slot state
export interface ResearchSlotState {
  nodeId: string | null
  timerRemaining: number // seconds
}

export type ProbeSubsystem = 'none' | 'shielding' | 'thrusters' | 'siphon'

// Single probe state
export interface ProbeState {
  id: number
  status: ProbeStatus
  zone: ExcavationZone | null
  timerRemaining: number // seconds
  scanDuration?: number // total scan duration locked at launch
  repairTimerRemaining: number // seconds (for Unstable Rift repair)
  repairDuration?: number // total repair time for progress display
  subsystem?: ProbeSubsystem
  veteranRank?: number // 0-5
  expeditionsCompleted?: number
}

// Relic slot state
export interface RelicSlotState {
  relicId: number | null
}

// AR upgrade levels
export interface ARUpgrades {
  chronal_anchor: number // 0 or 1
  dimensional_blueprinting: number // 0 or 1
  bulk_procurement: number // 0 or 1
  neural_pipeline: number // 0-5
  super_symmetry: number // 0 or 1
  auto_buy_basic: number // 0 or 1
  auto_research_queue: number // 0 or 1
  research_accelerant: number // 0-10
  generator_priming: number // 0-30
  anomaly_extender: number // 0-5
  milestone_sharpener: number // 0-5
  relic_resonance: number // 0-10
  challenge_accelerant: number // 0 or 1
  quantum_overdrive: number // 0-20
  arkalon_harmonic_cap: number // 0-10
  resonance_compression: number // 0-5
}

// CF upgrade levels
export interface CFUpgrades {
  temporal_compression: number // 0 or 1
  quantum_memory: number // 0 or 1
  resonance_amplification: number // 0 or 1
  auto_module_buyer: number // 0 or 1
  auto_buy_synthesizers: number // 0 or 1
  auto_upgrade_relics: number // 0 or 1
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
  auto_dyson_swarm: number // 0 or 1
  automated_singular_synthesis: number // 0 or 1
}

// Automation feature toggles
export interface AutomationState {
  autoBuyBasic: boolean
  autoBuyOptimal: boolean
  autoBuySynthesizers: boolean
  autoResearchQueue: boolean
  autoPrestigeTierI: boolean
  autoPrestigeTierII: boolean
  autoPrestigeTierIII: boolean
  autoEquipRelic: boolean
  autoUpgradeRelics: boolean
  autoLaunchProbe: boolean
  autoModuleBuy: boolean
  autoDysonSwarm: boolean
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
  peakLifetimePoints: bigint
  allTimePoints: bigint
  allTimeDust: number
  o10EverCompleted: boolean
  bestChallengeTimes: Record<string, number>
  relic4PityCount: number
  relic9PityCount: number
  totalSessionPlaytime: number // seconds
  totalOfflineTime: number // seconds
  lastPrestigeTime: number // unix ms, 0 if never
  currentRunSeconds: number // monotonic active/offline run timer
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

export interface PreChallengeSnapshot {
  researchPoints: string
  lifetimePoints: string
  generators: Array<{
    quantity: string
    efficiencyLevel?: number
    costReductionLevel?: number
    synergyLevel?: number
  }>
  synthesizers: number[]
  completedResearchNodes: string[]
  activeResearchSlots: ResearchSlotState[]
  researchQueue: string[]
  infiniteResearchLevels: Record<string, number>
  o6BypassUsed?: boolean
  activeMegaprojectId: MegaprojectId | null
  megaprojectAllocationPercent: number
  megaprojectRPAbsorbed: string
  activeAnomalyType: AnomalyType | null
  anomalyTimeRemaining: number
  anomalySpawnRawDuration?: number
  timeToNextAnomalyCheck: number
  manualOperationCycle: number | null
  lastPrestigeTime: number
  currentRunSeconds?: number
  startedAt?: number
}

// Operation artifact unlock
export type OperationArtifactId =
  | 'empirical_compass'
  | 'chronos_loom'
  | 'anomalous_lens'
  | 'arkalon_core_synapse'

export type UITheme = 'default' | 'matrix' | 'vaporwave' | 'solar' | 'void'

// Settings slice
export interface SettingsState {
  volumeMusic: number
  volumeSFX: number
  volumeVoice: number
  voiceEnabled: boolean
  currentUITheme: string
  notationMode: NotationMode
  neonBloom: boolean
  crtScanlines: boolean
  reducedMotion: boolean
  audioMuted: boolean
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

  // Synthesizers: 4 non-RP buildings indexed 0-3
  synthesizers: number[]

  // Research
  completedResearchNodes: string[]
  activeResearchSlots: ResearchSlotState[] // length 1-3
  researchQueue: string[] // max 4 node IDs
  infiniteResearchLevels: Record<string, number>
  o6BypassUsed: boolean

  // Prestige
  resonanceMemoryAR: number
  arUpgrades: ARUpgrades
  cfUpgrades: CFUpgrades
  osUpgrades: OSUpgrades

  // Relics
  relicSlots: RelicSlotState[] // length 3 base, expandable to 6
  unlockedRelics: number[] // relic IDs 1-20
  relicLevels: Record<number, number>
  relicPresets: (number | null)[][] // 3 preset loadouts

  // Excavation
  probes: ProbeState[]

  // Megaprojects
  activeMegaprojectId: MegaprojectId | null
  megaprojectAllocationPercent: number // 0-100
  lastMegaprojectAllocationPercent: number // 1-100
  megaprojectRPAbsorbed: bigint
  completedMegaprojects: MegaprojectId[]
  dysonSwarmLevel: number

  // Anomalies
  activeAnomalyType: AnomalyType | null
  anomalyTimeRemaining: number // seconds
  anomalySpawnRawDuration: number // uncapped duration locked at spawn for overflow buff
  timeToNextAnomalyCheck: number // seconds

  // Operations
  currentOperationPoints: number
  operationArtifactsUnlocked: OperationArtifactId[]
  currentOperationCycle: number
  manualOperationCycle: number | null
  cosmicAttunementLevel: number
  cosmicTemporalLevel: number

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
  challengeActiveSeconds: number
  preChallengeSnapshot: PreChallengeSnapshot | null
  challengeRecords: Record<string, ChallengeRecord>
  sandboxTargetRP: bigint
  sandboxBestRP: bigint
  sandboxCompletions: number

  // Automation
  automation: AutomationState
  autoPrestigeMode: 'target' | 'ratio' | 'stall'
  autoPrestigeTargetAR: number
  autoPrestigeRatio: number
  autoPrestigeTargetCF: number
  autoPrestigeTargetOS: number
  autoPrestigeWaitForHigher: boolean
  autoPrestigeHoldForDyson: boolean
  autoBuyOptimalReservePercent: number
  autoRelicTargetLevel: number
  autoRelicDustReserve: number
  autoLaunchZone: ExcavationZone

  // Achievements earned (string IDs)
  achievements: string[]

  // Cached (read-only for tick loop)
  cachedPointsPerSecond: bigint
  cachedProductionShares: number[]
  lastSavedTime: number

  // Active challenge restriction flags (set when challenge is active)
  activeChallengeRestrictions: ChallengeRestrictions | null
}

export interface ChallengeRestrictions {
  maxGeneratorTier: number | null // null = no limit
  maxGeneratorQuantity: bigint | null // null = no limit
  techMatrixDisabled: boolean
  modulesDisabled: boolean
  anomaliesDisabled: boolean
  excavationDisabled: boolean
  generatorCostMultiplier: number // 1.0 = normal
  researchTimerMultiplier: number // 1.0 = normal
  milestonesDisabled: boolean
  energyBranchLocked: boolean
  arkalonBranchLocked: boolean
  singleBranchOnly: boolean
  singleResearchSlot: boolean
  relicsDisabled: boolean
  generatorProductionMultiplier: number // 1.0 = normal
  moduleLevelCapOverride: number | null // null = normal cap
  onlyGeneratorType: number | null // null = no restriction
  autoPrestigeIntervalSeconds: number | null // null = no forced prestige
  anomalySpawnIntervalSeconds: number | null // null = normal 3-6 min window
  anomalyDurationOverrideSeconds: number | null // null = definition duration
  noResearchTimerTick: boolean
  noBaseGeneratorOutput: boolean
  productionOnlyWhileResearching: boolean
  prestigeUpgradesDisabled: boolean
}