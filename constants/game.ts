// Core balance constants
// Core timing

// Starting RP given to new players
// Tuned so the player can immediately buy their first Research Desk (cost: 15)
export const STARTING_RP = 15n;

// Game loop interval in ms
export const TICK_INTERVAL_MS = 100;

// Cloud save interval in ms
export const CLOUD_SAVE_INTERVAL_MS = 60_000;

// LocalStorage save interval in ms
export const LOCAL_SAVE_INTERVAL_MS = 5_000;

// Rate limit: minimum ms between cloud saves (server enforces 30s)
export const SAVE_RATE_LIMIT_MS = 30_000;

// Offline accumulation 

// Base offline efficiency before E1/E2 research and Entropic Anchor relic
// 0.7 = 70% of normal PPS during offline period
export const DEFAULT_OFFLINE_EFFICIENCY = 0.7;

// Default max offline window before any research
export const DEFAULT_MAX_OFFLINE_SECONDS = 8 * 3600;    // 8 hours

// Chronos Loom operation artifact extends offline window to 12 hours
export const CHRONOS_LOOM_OFFLINE_SECONDS = 12 * 3600;

// Hard cap even with R9 research
export const MAX_OFFLINE_SECONDS_HARD_CAP = 24 * 3600;  // 24 hours

// AR production 

// Unspent AR above this cap does not contribute to production multiplier
// Prevents AR from becoming overwhelmingly dominant before prestige
export const AR_PRODUCTION_CAP = 500;

// Base AR production multiplier per unspent AR unit
// +10% per AR = significant incentive to hold AR rather than spend
export const PHI_AR_PRODUCTION = 0.1;

// Prestige thresholds 

// Tier I: ~15-20 minutes for first-time players with active play
// Equivalent to ~1 billion RP which unlocks in early Era 2
export const PRESTIGE_TIER1_THRESHOLD = 1_000_000_000n;   // 1.0 × 10^9

// Tier II: requires Chronos Array megaproject + Era 4 RP
export const PRESTIGE_TIER2_THRESHOLD = 10n ** 35n;        // 1.0 × 10^35

// Tier III: requires Omega Singularity Sphere + Era 6 RP
export const PRESTIGE_TIER3_THRESHOLD = 10n ** 85n;        // 1.0 × 10^85

// Era thresholds 
// Calibrated so each era lasts approximately 1-2 prestige cycles
export const ERA_THRESHOLDS: { era: number; name: string; threshold: bigint }[] = [
  { era: 1, name: 'Foundational Research', threshold: 0n },
  { era: 2, name: 'Quantum Resonance',     threshold: 10n ** 9n  },
  { era: 3, name: 'Dimensional Breach',    threshold: 10n ** 18n },
  { era: 4, name: 'Cosmic Expansion',      threshold: 10n ** 35n },
  { era: 5, name: 'Singularity Threshold', threshold: 10n ** 60n },
  { era: 6, name: 'Omega Convergence',     threshold: 10n ** 85n },
  { era: 7, name: 'The Final Observation', threshold: 10n ** 140n },
];

// Milestone system 

// Every 25 units = 2x output (standard generators)
// Lowered from 50 to make early milestones feel rewarding on first play
export const MILESTONE_INTERVAL = 25;

// Research Desk uses tighter intervals (10) up to 50, then uses standard interval
// This gives new players faster feedback on their first generator
export const RESEARCH_DESK_MILESTONE_INTERVAL = 10;
export const RESEARCH_DESK_MILESTONE_CAP = 50;

// Milestone Sharpener AR upgrade reduces milestone threshold by 1 per level
export const MILESTONE_SHARPENER_REDUCTION = 1;
export const MILESTONE_MIN_INTERVAL = 10;

// Superrecursive Core relic (ID 11) reduces threshold by 2 per relic level
export const SUPERRECURSIVE_CORE_REDUCTION = 2;
export const SUPERRECURSIVE_CORE_MIN = 5;

// Generator modules 

// Base cap: Level 5. AC5 challenge raises this to 8.
export const MODULE_LEVEL_CAP = 5;
export const MODULE_LEVEL_CAP_AC5 = 8;

// Relics 

export const RELIC_LEVEL_CAP = 100;
export const RELIC_SLOT_COUNT_BASE = 3;
export const RELIC_SLOT_COUNT_MAX = 6;

// 5 minute swap cooldown; 2 minutes with CF Relic Preservation
export const RELIC_SWAP_COOLDOWN_SECONDS = 300;
export const RELIC_SWAP_COOLDOWN_CF_SECONDS = 120;

// Excavation 

export const MAX_PROBES = 5;

// Probe cost tuned so it's affordable around the time Quantum Computers unlock
export const PROBE_COST_RP = 1_000_000n;

// Gate: must have 100 Server Clusters AND 10 Quantum Computers
// Ensures players engage with generators before excavation
export const PROBE_GATE_SERVER_CLUSTERS = 100n;
export const PROBE_GATE_QUANTUM_COMPUTERS = 10n;

// 10 minutes to repair a damaged probe (Unstable Rift failure)
export const UNSTABLE_RIFT_REPAIR_SECONDS = 600;

// Anomaly timing 

// Anomaly spawn window: 8-15 minutes between checks
// Tuned so anomalies feel surprising but not overwhelming
export const ANOMALY_SPAWN_MIN_SECONDS = 480;   // 8 min
export const ANOMALY_SPAWN_MAX_SECONDS = 900;   // 15 min

// Tutorial 

export const TUTORIAL_COMPLETION_PLAYTIME_SECONDS = 300; // 5 min

// Prestige formulas 

// AR = floor(5 * sqrt(lifetimeRP / 10^9))
// At first prestige threshold (10^9): ~5 AR
// At 10^11: ~50 AR; this curve is deliberately gentle at first
export const AR_FORMULA_MULTIPLIER = 5;
export const AR_FORMULA_DIVISOR = 1_000_000_000n;

// Save sanity 

// Server rejects saves where claimed points exceed PPS * elapsed * this factor
export const SAVE_SANITY_MULTIPLIER = 1.5;

// Automation 

// Countdown before auto-prestige fires (gives player time to cancel)
export const AUTO_PRESTIGE_COUNTDOWN_SECONDS = 3;

// Active anomaly grace period before auto-prestige countdown starts
export const ANOMALY_GRACE_SECONDS = 10;

// Research 

// Queue max before SC10 challenge and other expansions
export const RESEARCH_QUEUE_MAX_BASE = 4;

// Dialogue 

// Minimum inactive time before Arkalon fires a "while you were gone" line
export const INACTIVE_TAB_THRESHOLD_SECONDS = 1800; // 30 min

// Bulk buy 

export const BULK_BUY_OPTIONS = [1, 10, 100] as const;
export type BulkBuyAmount = (typeof BULK_BUY_OPTIONS)[number] | 'max';

// Auto-buy tick interval (every N ticks = every N × 100ms)
export const AUTO_BUY_BASIC_TICKS = 50;    // every 5 seconds
export const AUTO_BUY_OPTIMAL_TICKS = 20;  // every 2 seconds