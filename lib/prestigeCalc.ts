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

// Tier I: AR = floor(5 * sqrt(lifetimeRP / 10^9))
export function calculateARGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER1_THRESHOLD) return 0

  const ratio = Number(state.lifetimePoints) / Number(AR_FORMULA_DIVISOR)
  let ar = Math.floor(AR_FORMULA_MULTIPLIER * Math.sqrt(ratio))

  // Void Compass relic: +3% per level per prestige
  const relicBonus = getRelicARBonus(state)
  ar = Math.floor(ar * relicBonus)

  // Resonance Amplification CF upgrade: AR yields * 1.5 per CF held
  if (state.cfUpgrades.resonance_amplification > 0) {
    ar = Math.floor(ar * (1.5 * Math.max(1, state.chronalFractures)))
  }

  return ar
}

// Tier II: CF = floor(10 * ((lifetimeRP / 10^35) ^ 0.2))
export function calculateCFGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER2_THRESHOLD) return 0

  const ratio = Number(state.lifetimePoints) / Number(PRESTIGE_TIER2_THRESHOLD)
  return Math.floor(10 * Math.pow(ratio, 0.2))
}

// Tier III: OS = floor(10 * ((lifetimeRP / 10^85) ^ 0.1))
export function calculateOSGain(state: GameState): number {
  if (state.lifetimePoints < PRESTIGE_TIER3_THRESHOLD) return 0

  const ratio = Number(state.lifetimePoints) / Number(PRESTIGE_TIER3_THRESHOLD)
  return Math.floor(10 * Math.pow(ratio, 0.1))
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
  arGained: number
): Partial<GameState> {
  const initial = makeInitialState()

  // Retain modules by preserving generator efficiency/cost/synergy levels
  const retainedGenerators = initial.generators.map((g, i) => ({
    ...g,
    efficiencyLevel: state.generators[i]?.efficiencyLevel ?? 0,
    costReductionLevel: state.generators[i]?.costReductionLevel ?? 0,
    synergyLevel: state.generators[i]?.synergyLevel ?? 0
  }))

  // Dimensional Blueprinting: start with 5 of first 3 generators
  if (state.arUpgrades.dimensional_blueprinting > 0) {
    retainedGenerators[0].quantity = 5n
    retainedGenerators[1].quantity = 5n
    retainedGenerators[2].quantity = 5n
  }

  // Chronal Anchor: start with 5% of prior run's peak PPS as flat RP
  let startingRP = initial.researchPoints
  if (state.arUpgrades.chronal_anchor > 0) {
    const fivePercent = state.cachedPointsPerSecond / 20n
    startingRP = initial.researchPoints + fivePercent
  }

  // Retain completed research nodes that have CF Quantum Memory protection
  // CF Quantum Memory: retain up to 3 Tier-4 research nodes
  let retainedResearch: string[] = []
  if (state.cfUpgrades.quantum_memory > 0) {
    const tier4Nodes = state.completedResearchNodes.filter((id) => {
      const tier = parseInt(id.replace(/[^0-9]/g, '') || '0')
      return tier === 4
    })
    retainedResearch = tier4Nodes.slice(0, 3)
  }

  // R7: 10x reality engine speed for 5 minutes post-reset
  // Applied in productionEngine as a timed boost (stub here)

  // Determine research slot count post-reset based on retained nodes
  const hasR3 = retainedResearch.includes('R3')
  const hasCFDeepSlots = state.cfUpgrades.deep_research_slots > 0
  const slotCount = hasCFDeepSlots ? 3 : hasR3 ? 2 : 1
  const researchSlots = Array.from({ length: slotCount }, () => ({
    nodeId: null as string | null,
    timerRemaining: 0
  }))

  return {
    // Reset currencies
    researchPoints: startingRP,
    lifetimePoints: 0n,

    // Reset generators (retain module levels)
    generators: retainedGenerators,

    // Reset research
    completedResearchNodes: retainedResearch,
    activeResearchSlots: researchSlots,
    researchQueue: [],

    // Reset anomaly
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    anomalyInteractionValue: 0,
    timeToNextAnomalyCheck: 480,

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
// Resets everything Tier I resets, plus: AR balance, Tier I research, existing AR
export function buildTier2ResetState(
  state: GameState,
  cfGained: number
): Partial<GameState> {
  const tier1Reset = buildTier1ResetState(state, 0)

  return {
    ...tier1Reset,

    // Additionally reset AR balance
    arkalonResonance: 0,

    // Award CF
    chronalFractures: state.chronalFractures + cfGained,

    // Reset all completed research (no quantum memory protection across Tier II)
    completedResearchNodes: [],
    activeResearchSlots: [{ nodeId: null, timerRemaining: 0 }],
    infiniteResearchLevels: {},

    // Reset relic slots but keep unlocked relics and levels
    relicSlots: Array.from({ length: 3 }, () => ({
      relicId: null as number | null,
      cooldownRemaining: 0
    }))
  }
}

// Builds the post-Tier-III reset state
// Collapses all systems below Tier III
export function buildTier3ResetState(
  state: GameState,
  osGained: number
): Partial<GameState> {
  const tier2Reset = buildTier2ResetState(state, 0)

  return {
    ...tier2Reset,

    // Reset CF balance
    chronalFractures: 0,

    // Award OS
    omniSpars: state.omniSpars + osGained,

    // Reset all prestige upgrades except OS
    arUpgrades: makeInitialState().arUpgrades,
    cfUpgrades: makeInitialState().cfUpgrades
  }
}

// Returns a human-readable summary of what will be reset vs retained
export function getPrestigeResetSummary(tier: 1 | 2 | 3): {
  resets: string[]
  retains: string[]
} {
  if (tier === 1) {
    return {
      resets: [
        'Research Points',
        'Generator quantities',
        'Completed research nodes',
        'Active research timers',
        'Megaproject progress'
      ],
      retains: [
        'Generator module levels',
        'Arkalon Resonance upgrades',
        'Relics and artifact dust',
        'Achievements',
        'Anomalous Operations progress'
      ]
    }
  }
  if (tier === 2) {
    return {
      resets: [
        'Everything from Tier I',
        'Arkalon Resonance balance',
        'All completed research nodes',
        'Infinite research levels'
      ],
      retains: [
        'Chronal Fracture upgrades',
        'Relics and artifact dust',
        'Achievements',
        'Omni-Spars'
      ]
    }
  }
  return {
    resets: [
      'Everything from Tier II',
      'Chronal Fracture balance',
      'AR and CF prestige upgrades'
    ],
    retains: ['Omni-Spar upgrades', 'Relics and artifact dust', 'Achievements']
  }
}
