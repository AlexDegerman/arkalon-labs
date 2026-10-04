// Core balance constants
// Tuned in Commit 22.1 - all numeric parameters centralized here

// Starting RP given to new players
export const STARTING_RP = 15n

// Game loop interval in ms
export const TICK_INTERVAL_MS = 100

// Cloud save interval in ms
export const CLOUD_SAVE_INTERVAL_MS = 60_000

// LocalStorage save interval in ms
export const LOCAL_SAVE_INTERVAL_MS = 5_000

// Rate limit: minimum ms between cloud saves (server enforces 30s)
export const SAVE_RATE_LIMIT_MS = 30_000

// Offline accumulation
export const DEFAULT_OFFLINE_EFFICIENCY = 0.7
export const DEFAULT_MAX_OFFLINE_SECONDS = 8 * 3600 // 8 hours
export const CHRONOS_LOOM_OFFLINE_SECONDS = 12 * 3600 // 12 hours (Chronos Loom)
export const MAX_OFFLINE_SECONDS_HARD_CAP = 24 * 3600 // 24 hours absolute cap

// AR production cap: unspent AR above this does not contribute to production
export const AR_PRODUCTION_CAP = 500

// Prestige thresholds
export const PRESTIGE_TIER1_THRESHOLD = 1_000_000_000n // 1.0 x 10^9
export const PRESTIGE_TIER2_THRESHOLD = 10n ** 35n // 1.0 x 10^35
export const PRESTIGE_TIER3_THRESHOLD = 10n ** 85n // 1.0 x 10^85

// Era thresholds
export const ERA_THRESHOLDS: {
  era: number
  name: string
  threshold: bigint
}[] = [
  { era: 1, name: 'Foundational Research', threshold: 0n },
  { era: 2, name: 'Quantum Resonance', threshold: 10n ** 9n },
  { era: 3, name: 'Dimensional Breach', threshold: 10n ** 18n },
  { era: 4, name: 'Cosmic Expansion', threshold: 10n ** 35n },
  { era: 5, name: 'Singularity Threshold', threshold: 10n ** 60n },
  { era: 6, name: 'Omega Convergence', threshold: 10n ** 85n },
  { era: 7, name: 'The Final Observation', threshold: 10n ** 140n }
]

// Milestone multiplier: every N units = 2x output
export const MILESTONE_INTERVAL = 25
// Research Desk (generator 0) uses 10-unit intervals up to 50, then reverts
export const RESEARCH_DESK_MILESTONE_INTERVAL = 10
export const RESEARCH_DESK_MILESTONE_CAP = 50

// Quantity milestone: milestone triggers N units earlier per Milestone Sharpener level
export const MILESTONE_SHARPENER_REDUCTION = 1
export const MILESTONE_MIN_INTERVAL = 10

// Superrecursive Core relic: milestones trigger 2 units earlier per level
export const SUPERRECURSIVE_CORE_REDUCTION = 2
export const SUPERRECURSIVE_CORE_MIN = 5

// Generator module caps
export const MODULE_LEVEL_CAP = 5
export const MODULE_LEVEL_CAP_AC5 = 8 // AC5 challenge reward

// Relic
export const RELIC_LEVEL_CAP = 100
export const RELIC_SLOT_COUNT_BASE = 3
export const RELIC_SLOT_COUNT_MAX = 6
export const RELIC_SWAP_COOLDOWN_SECONDS = 300 // 5 minutes
export const RELIC_SWAP_COOLDOWN_CF_SECONDS = 120 // 2 min with CF upgrade

// Probe
export const MAX_PROBES = 5
export const PROBE_COST_RP = 1_000_000n
export const PROBE_GATE_SERVER_CLUSTERS = 100n
export const PROBE_GATE_QUANTUM_COMPUTERS = 10n

// Excavation repair time for Unstable Rift failure
export const UNSTABLE_RIFT_REPAIR_SECONDS = 600 // 10 minutes

// Anomaly spawn interval range (seconds)
export const ANOMALY_SPAWN_MIN_SECONDS = 480 // 8 min
export const ANOMALY_SPAWN_MAX_SECONDS = 900 // 15 min

// Tutorial session time threshold for forced completion
export const TUTORIAL_COMPLETION_PLAYTIME_SECONDS = 300 // 5 min

// Prestige AR formula: AR = floor(5 * sqrt(lifetimeRP / 10^9))
export const AR_FORMULA_MULTIPLIER = 5
export const AR_FORMULA_DIVISOR = 1_000_000_000n

// Phi: AR production efficiency constant (+10% per unspent AR)
export const PHI_AR_PRODUCTION = 0.1

// Save sanity check ceiling multiplier
export const SAVE_SANITY_MULTIPLIER = 1.5

// Auto-prestige countdown display seconds
export const AUTO_PRESTIGE_COUNTDOWN_SECONDS = 3

// Anomaly grace period for auto-prestige
export const ANOMALY_GRACE_SECONDS = 10

// Research queue max size (base)
export const RESEARCH_QUEUE_MAX_BASE = 4

// Inactive tab threshold for dialogue trigger
export const INACTIVE_TAB_THRESHOLD_SECONDS = 1800 // 30 min

// Bulk buy options
export const BULK_BUY_OPTIONS = [1, 10, 100] as const;
export type BulkBuyAmount = (typeof BULK_BUY_OPTIONS)[number] | 'max';

// Auto-buy tick interval (every N ticks = every N*100ms)
export const AUTO_BUY_BASIC_TICKS = 50;    // every 5 seconds
export const AUTO_BUY_OPTIMAL_TICKS = 20;  // every 2 seconds