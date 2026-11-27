// Prestige formula calculations for all three tiers

import type {
  GameState,
} from '@/types/game'
import {
  AR_FORMULA_MULTIPLIER,
  AR_FORMULA_DIVISOR,
  PRESTIGE_TIER1_THRESHOLD,
  PRESTIGE_TIER2_THRESHOLD,
  PRESTIGE_TIER3_THRESHOLD
} from '@/constants/game'
import { getRelicARBonus } from '@/lib/relicEffects'
import { makeInitialState } from '@/app/stores/gameStore'
import { getRelicSlotCount } from './relicDefs'
import { getActiveSlotCount } from './researchNodes'
import { getCountedAR } from './productionEngine'
import { bigIntLog10 } from './format'

function getR8Amplification(state: GameState): number {
  if (
    !state.completedResearchNodes.includes('R8') ||
    state.activeChallengeRestrictions?.techMatrixDisabled
  )
    return 1
  const log10 = bigIntLog10(state.lifetimePoints)
  const proximity = Math.min(1, Math.max(0, log10 / 162))
  return 1 + Math.pow(proximity, 2) * 4
}

// Tier I: 5 * sqrt(lifetimeRP / 10^9), softcapped (^0.25) above 500k AR
export function calculateARGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER1_THRESHOLD) return 0

  const log10RP = bigIntLog10(state.lifetimePoints)
  const log10Ratio = Math.max(0, log10RP - 9)
  const log10RawAR = Math.log10(AR_FORMULA_MULTIPLIER) + 0.5 * log10Ratio

  const SOFTCAP_BASE = 500_000
  const LOG10_SOFTCAP = Math.log10(SOFTCAP_BASE)
  let ar: number
  if (log10RawAR <= LOG10_SOFTCAP) {
    const ratio = Number(state.lifetimePoints) / Number(AR_FORMULA_DIVISOR)
    ar = Math.floor(AR_FORMULA_MULTIPLIER * Math.sqrt(ratio))
  } else {
    const log10SoftAR = LOG10_SOFTCAP + (log10RawAR - LOG10_SOFTCAP) * 0.25
    ar =
      log10SoftAR >= 9.4 ? 2_000_000_000 : Math.floor(Math.pow(10, log10SoftAR))
  }

  // Void Compass relic: +3% per level per prestige
  const relicBonus = getRelicARBonus(state)
  ar = Math.floor(ar * relicBonus)

  // Resonance Amplification CF upgrade: AR yields * 1.5 per CF held
  if (state.cfUpgrades.resonance_amplification > 0) {
    ar = Math.floor(ar * (1.5 * Math.max(1, state.chronalFractures)))
  }

  // EC3 reward: +25% bonus AR
  if ((state.challengeRecords['EC3']?.completedTiers ?? 0) > 0) {
    ar = Math.floor(ar * 1.25)
  }

  // Dimensional Veteran achievement capstone: +10% AR
  if (state.achievements?.includes('prestige_50')) {
    ar = Math.floor(ar * 1.1)
  }

  ar = Math.floor(ar * getR8Amplification(state))

  return Math.min(2_000_000_000, Math.max(0, isFinite(ar) ? ar : 0))
}

// Tier II: CF = floor(10 * ((lifetimeRP / 10^35) ^ 0.2))
export function calculateCFGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER2_THRESHOLD) return 0
  if (state.lifetimePoints >= 10n ** 300n) return 2_000_000_000

  const ratio = Number(state.lifetimePoints) / Number(PRESTIGE_TIER2_THRESHOLD)
  const cf = Math.floor(10 * Math.pow(ratio, 0.2) * getR8Amplification(state))
  return Math.min(2_000_000_000, Math.max(0, isFinite(cf) ? cf : 0))
}

// Tier III: OS = floor(10 * ((lifetimeRP / 10^85) ^ 0.1))
export function calculateOSGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER3_THRESHOLD) return 0
  if (state.lifetimePoints >= 10n ** 300n) return 2_000_000_000

  const ratio = Number(state.lifetimePoints) / Number(PRESTIGE_TIER3_THRESHOLD)
  const os = Math.floor(10 * Math.pow(ratio, 0.1) * getR8Amplification(state))
  return Math.min(2_000_000_000, Math.max(0, isFinite(os) ? os : 0))
}

// Returns true if the player can perform a Tier I prestige right now
export function canPrestigeTier1(state: GameState): boolean {
  if (state.activeChallengeId) return false
  return state.lifetimePoints >= PRESTIGE_TIER1_THRESHOLD
}

// Returns true if the player can perform a Tier II prestige right now
export function canPrestigeTier2(state: GameState): boolean {
  if (state.activeChallengeId) return false
  return (
    state.lifetimePoints >= PRESTIGE_TIER2_THRESHOLD &&
    state.completedMegaprojects.includes('chronos_array')
  )
}

// Returns true if the player can perform a Tier III prestige right now
export function canPrestigeTier3(state: GameState): boolean {
  if (state.activeChallengeId) return false
  return (
    state.lifetimePoints >= PRESTIGE_TIER3_THRESHOLD &&
    state.completedMegaprojects.includes('omega_singularity_sphere')
  )
}

// Builds the post-Tier-I reset state
// Retains: achievements, modules, AR upgrades, relics, stats, settings,
//          challenge records, unlocks, automation
// Resets: RP, generators, completed standard research nodes,
//         active research timers, anomaly state, megaproject progress
export function buildTier1ResetState(
  state: GameState,
  arGained: number,
  forChallenge = false,
  preserveChallengeRunAssets = false
): Partial<GameState> {
  const initial = makeInitialState()

  // Retain modules by preserving generator efficiency/cost/synergy levels
  const retainedGenerators = initial.generators.map((g, i) => ({
    ...g,
    efficiencyLevel: state.generators[i]?.efficiencyLevel ?? 0,
    costReductionLevel: state.generators[i]?.costReductionLevel ?? 0,
    synergyLevel: state.generators[i]?.synergyLevel ?? 0
  }))

  // Dimensional Blueprinting: start with 5x Gen 1-3
  if (!forChallenge && state.arUpgrades.dimensional_blueprinting > 0) {
    retainedGenerators[0].quantity = 5n
    retainedGenerators[1].quantity = 5n
    retainedGenerators[2].quantity = 5n
  }

  // Prestige Fast-Forward: Start runs with pre-purchased units post Tier II and Tier III
  if (!forChallenge && state.stats.totalPrestigesTier3 >= 1) {
    for (let i = 0; i < 5; i++) {
      if (retainedGenerators[i].quantity < 50n) {
        retainedGenerators[i].quantity = 50n
      }
    }
  } else if (!forChallenge && state.stats.totalPrestigesTier2 >= 1) {
    for (let i = 0; i < 3; i++) {
      if (retainedGenerators[i].quantity < 25n) {
        retainedGenerators[i].quantity = 25n
      }
    }
  }

  // Chronal Anchor: start with 1 second of prior run's peak PPS as flat RP
  let startingRP = initial.researchPoints
  if (!forChallenge && state.arUpgrades.chronal_anchor > 0) {
    const peakPPS =
      state.stats.peakRPPerSec > state.cachedPointsPerSecond
        ? state.stats.peakRPPerSec
        : state.cachedPointsPerSecond
    startingRP = initial.researchPoints + peakPPS
  }

  // CF Quantum Memory: retain up to 3 Tier-4 research nodes
  let retainedResearch: string[] = []
  if (!forChallenge && state.cfUpgrades.quantum_memory > 0) {
    const tier4Nodes = state.completedResearchNodes.filter((id) => {
      const tier = parseInt(id.replace(/[^0-9]/g, '') || '0')
      return tier === 4
    })
    retainedResearch = tier4Nodes.slice(0, 3)
  }

  if (
    !forChallenge &&
    state.completedMegaprojects.includes('arkalon_matrix_mirror')
  ) {
    const tier1And2Nodes = ['C1', 'C2', 'E1', 'E2', 'R1', 'R2', 'O1', 'O2']
    for (const id of tier1And2Nodes) {
      if (!retainedResearch.includes(id)) {
        retainedResearch.push(id)
      }
    }
  }

  if (
    !forChallenge &&
    state.completedResearchNodes.includes('R5') &&
    !retainedResearch.includes('R5')
  ) {
    retainedResearch.push('R5')
  }
  if (
    !forChallenge &&
    state.completedResearchNodes.includes('R7') &&
    !retainedResearch.includes('R7')
  ) {
    retainedResearch.push('R7')
  }

  // Determine research slot count post-reset based on retained nodes
  const simulatedState = {
    ...state,
    completedResearchNodes: retainedResearch
  }
  const slotCount = getActiveSlotCount(simulatedState)
  const researchSlots = Array.from({ length: slotCount }, () => ({
    nodeId: null as string | null,
    timerRemaining: 0
  }))

  return {
    // Reset currencies
    researchPoints: startingRP,
    lifetimePoints: startingRP,

    // Reset manual epoch retuning per prestige run
    manualOperationCycle: null,

    // Reset generators (retain module levels); persist synthesizers across Tier I & EC3 collapses
    generators: retainedGenerators,
    synthesizers:
      forChallenge && !preserveChallengeRunAssets
        ? initial.synthesizers
        : [...(state.synthesizers ?? initial.synthesizers)],

    // Reset research
    completedResearchNodes: retainedResearch,
    activeResearchSlots: researchSlots,
    researchQueue: [],
    o6BypassUsed: false,
    ...(forChallenge && !preserveChallengeRunAssets
      ? { infiniteResearchLevels: {} }
      : {}),

    // Reset anomaly; spawn countdown persists across prestiges
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    anomalySpawnRawDuration: 0,
    timeToNextAnomalyCheck: forChallenge
      ? 120
      : Math.max(30, state.timeToNextAnomalyCheck),

    // Reset megaproject progress
    activeMegaprojectId: null,
    megaprojectAllocationPercent: 0,
    megaprojectRPAbsorbed: 0n,

    // Award AR
    arkalonResonance: state.arkalonResonance + arGained

    // Retain everything else via spread in the action
  }
}

// Builds the post-Tier-II reset state
// Resets Tier I state plus AR balance, synthesizers, relic sockets, and research
export function buildTier2ResetState(
  state: GameState,
  cfGained: number
): Partial<GameState> {
  const tier1Reset = buildTier1ResetState(state, 0)
  const preservedMemory = Math.max(
    state.resonanceMemoryAR ?? 0,
    getCountedAR(state)
  )
  const slotCount = getRelicSlotCount(state)
  const postResetNodes = state.completedMegaprojects.includes(
    'arkalon_matrix_mirror'
  )
    ? ['C1', 'C2', 'E1', 'E2', 'R1', 'R2', 'O1', 'O2']
    : []
  const researchSlotCount = getActiveSlotCount({
    ...state,
    completedResearchNodes: postResetNodes
  })

  return {
    ...tier1Reset,

    synthesizers: makeInitialState().synthesizers,

    // Preserve pre-reset counted AR floor across Tier II resets
    resonanceMemoryAR: preservedMemory,

    // Additionally reset AR balance
    arkalonResonance: 0,
    // Award CF
    chronalFractures: state.chronalFractures + cfGained,

    // Reset all completed research (no quantum memory protection across Tier II)
    completedResearchNodes: state.completedMegaprojects.includes(
      'arkalon_matrix_mirror'
    )
      ? ['C1', 'C2', 'E1', 'E2', 'R1', 'R2', 'O1', 'O2']
      : [],
    activeResearchSlots: Array.from({ length: researchSlotCount }, () => ({
      nodeId: null as string | null,
      timerRemaining: 0
    })),
    infiniteResearchLevels: {},

    // Reset relic slots but keep unlocked relics and levels
    relicSlots: Array.from({ length: slotCount }, () => ({
      relicId: null as number | null
    }))
  }
}

// Builds the post-Tier-III reset state
// Resets Tier II state plus CF balance and economic AR/CF upgrades
export function buildTier3ResetState(
  state: GameState,
  osGained: number
): Partial<GameState> {
  const tier2Reset = buildTier2ResetState(state, 0)
  const preservedMemory = Math.max(
    state.resonanceMemoryAR ?? 0,
    getCountedAR(state)
  )

  return {
    ...tier2Reset,

    resonanceMemoryAR: preservedMemory,

    // Reset CF balance
    chronalFractures: 0,

    // Award OS
    omniSpars: state.omniSpars + osGained,

    // Reset economic prestige upgrades while preserving QoL automation unlocks
    arUpgrades: {
      ...makeInitialState().arUpgrades,
      auto_buy_basic: state.arUpgrades.auto_buy_basic,
      auto_research_queue: state.arUpgrades.auto_research_queue
    },
    cfUpgrades: {
      ...makeInitialState().cfUpgrades,
      bulk_procurement: state.cfUpgrades.bulk_procurement,
      auto_module_buyer: state.cfUpgrades.auto_module_buyer,
      auto_buy_synthesizers: state.cfUpgrades.auto_buy_synthesizers,
      auto_upgrade_relics: state.cfUpgrades.auto_upgrade_relics
    },

    automation: state.automation
  }
}

// Returns a human-readable summary of what will be reset vs retained
export function getPrestigeResetSummary(
  tier: 1 | 2 | 3,
  state?: GameState
): {
  resets: string[]
  retains: string[]
} {
  const hasMirror = state?.completedMegaprojects.includes(
    'arkalon_matrix_mirror'
  )

  if (tier === 1) {
    const retains = [
      'Generator module levels',
      'Synthesizers (Condensers, Dredgers, Arrays, Crucibles)',
      'Arkalon Resonance upgrades',
      'Relics, levels, sockets and artifact dust',
      'Achievements',
      'Anomalous Operations progress'
    ]
    if (state?.completedResearchNodes.includes('R5')) {
      retains.push('Node R5 (Dimensional Permeability)')
    }
    if (state?.completedResearchNodes.includes('R7')) {
      retains.push('Node R7 (Anthropic Fine-Tuning)')
    }
    if ((state?.cfUpgrades.quantum_memory ?? 0) > 0) {
      retains.push('Up to 3 Tier-4 research nodes (Quantum Memory)')
    }
    if (hasMirror) {
      retains.push('Tier 1–2 research auto-completed (Matrix Mirror)')
    }

    return {
      resets: [
        'Research Points',
        'Generator quantities',
        'Completed research nodes (unless protected)',
        'Active research timers',
        'Megaproject progress',
        ...(state?.activeAnomalyType ? ['Active anomaly buff'] : [])
      ],
      retains
    }
  }

  if (tier === 2) {
    const retains = [
      'Arkalon Resonance upgrades',
      'Chronal Fracture upgrades',
      'Resonance Memory AR floor',
      'Completed Megaprojects',
      'Relics, levels and artifact dust (re-socket via Presets)',
      'Anomalous Operations progress',
      'Achievements',
      'Omni-Spars'
    ]
    if (hasMirror) {
      retains.push('Tier 1–2 research auto-completed (Matrix Mirror)')
    }

    return {
      resets: [
        'Everything from Tier I',
        'Arkalon Resonance balance',
        'Synthesizers',
        'Equipped relic sockets (emptied; relics & levels kept)',
        'All completed research nodes (unless auto-studied by Matrix Mirror)',
        'Infinite research levels'
      ],
      retains
    }
  }

  return {
    resets: [
      'Everything from Tier II',
      'Chronal Fracture balance',
      'Economic AR and CF upgrades (including Deep Research Slots 3rd slot)',
      'Equipped relic sockets (emptied; relics & levels kept)'
    ],
    retains: [
      'Omni-Spar upgrades',
      'QoL & Automation unlocks',
      'Resonance Memory AR floor',
      'Completed Megaprojects',
      'Relics, levels and artifact dust',
      'Anomalous Operations progress',
      'Achievements'
    ]
  }
}
