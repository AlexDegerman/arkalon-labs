// Maps research node IDs to their production engine effects
// All values are read by productionEngine.ts during recalculatePPS
// This module is pure data - no side effects, no store access

import type { GameState } from '@/types/game'
import { GENERATOR_CLASS } from '@/constants/generators'
import { getMegaprojectPhase } from './megaprojectDefs'
import { OS_UPGRADES, getUpgradeCost } from './prestigeUpgradeDefs'
import { bigIntLog10 } from './format'

// Returns the tech multiplier for a specific generator index
// based on all completed research nodes
export function getTechMultiplierForGenerator(
  generatorIndex: number,
  state: GameState
): number {
  const genClass = GENERATOR_CLASS[generatorIndex]
  let multiplier = 1

  if (!state.activeChallengeRestrictions?.techMatrixDisabled) {
    const completed = new Set(state.completedResearchNodes)

    // C3: +10% computation output per completed research node (computation class only)
    if (completed.has('C3') && genClass === 'computation') {
      multiplier *= 1 + 0.1 * completed.size
    }

    // C4: Neural Cores gain +5% per Server Cluster owned
    if (completed.has('C4') && generatorIndex === 3) {
      const serverClusters = Number(state.generators[1].quantity)
      multiplier *= 1 + 0.05 * serverClusters
    }

    // C7: computation multipliers compounded by 1.15x per level (1 completion = 1 level)
    if (completed.has('C7') && genClass === 'computation') {
      multiplier *= 1.15
    }

    // C8: computation generators * ln(lifetimeRP)
    if (completed.has('C8') && genClass === 'computation') {
      const log10 = bigIntLog10(state.lifetimePoints)
      const lnRP = Math.max(1, 2.302585 * log10)
      multiplier *= lnRP
    }

    // C10: +1% to all generators per completed tech node
    if (completed.has('C10')) {
      multiplier *= 1 + 0.01 * completed.size
    }

    // E3: Singularity Reactors apply +0.25% to all lower-tier generators
    if (completed.has('E3') && generatorIndex < 5) {
      const reactorCount = Number(state.generators[5].quantity)
      multiplier *= 1 + 0.0025 * reactorCount
    }

    // E4: 5x to energy-class generators
    if (completed.has('E4') && genClass === 'energy') {
      multiplier *= 5
    }

    // E8: energy-class output scales by 1 + 0.1 * ln(lifetimeRP)
    if (completed.has('E8') && genClass === 'energy') {
      const log10 = bigIntLog10(state.lifetimePoints)
      const scale = 1 + 2.302585 * log10 * 0.1
      multiplier *= scale
    }

    // E9: Stellar Harvesters (14) and Galactic Engines (15) at 1.5x
    if (
      completed.has('E9') &&
      (generatorIndex === 14 || generatorIndex === 15)
    ) {
      multiplier *= 1.5
    }

    // E10: energy class 10x
    if (completed.has('E10') && genClass === 'energy') {
      multiplier *= 10
    }

    // O4: Arkalon Interfaces base yield +300% (4x total)
    if (completed.has('O4') && generatorIndex === 6) {
      multiplier *= 4
    }

    // O8: +0.5% per completed node to all generators from cross-branch
    if (completed.has('O8')) {
      multiplier *= 1 + 0.005 * completed.size
    }

    // O9: Arkalon Interfaces 5x
    if (completed.has('O9') && generatorIndex === 6) {
      multiplier *= 5
    }

    // O10: all branch multipliers apply to all classes (ultimate convergence)
    if (completed.has('O10')) {
      if (completed.has('C3') && genClass !== 'computation') {
        multiplier *= 1 + 0.1 * completed.size
      }
      if (completed.has('E4') && genClass !== 'energy') {
        multiplier *= 5
      }
      if (completed.has('O4') && generatorIndex !== 6) {
        multiplier *= 4
      }
      multiplier *= 1.5
    }

    // R6: +1% per total generator owned across all classes
    if (completed.has('R6')) {
      const totalOwned = state.generators.reduce(
        (sum, g) => sum + Number(g.quantity),
        0
      )
      multiplier *= 1 + 0.01 * totalOwned
    }

    if (completed.has('R5')) {
      multiplier *= 1.1
    }

    if (
      completed.has('R7') &&
      generatorIndex === 4 &&
      state.stats.lastPrestigeTime > 0 &&
      (state.stats.currentRunSeconds ?? 0) < 300
    ) {
      multiplier *= 10
    }
  }

  // Generator Transcendence CF upgrade: +5% to tier 6+ per level
  if (
    generatorIndex >= 5 &&
    state.cfUpgrades.generator_transcendence > 0 &&
    !state.activeChallengeRestrictions?.prestigeUpgradesDisabled
  ) {
    multiplier *= 1 + 0.05 * state.cfUpgrades.generator_transcendence
  }

  // Operation artifact Arkalon Core Synapse: 1.15x computation class
  if (
    genClass === 'computation' &&
    state.operationArtifactsUnlocked.includes('arkalon_core_synapse')
  ) {
    multiplier *= 1.15
  }

  // Active megaproject phased construction perks
  if (
    (generatorIndex === 2 || generatorIndex === 4) &&
    getMegaprojectPhase('chronos_array', state) >= 2
  ) {
    multiplier *= 1.15
  }
  if (
    generatorIndex === 6 &&
    getMegaprojectPhase('arkalon_matrix_mirror', state) >= 1
  ) {
    multiplier *= 1.25
  }
  if (
    generatorIndex === 5 &&
    getMegaprojectPhase('omega_singularity_sphere', state) >= 1
  ) {
    multiplier *= 1.5
  }

  return multiplier
}

// Returns base-10 log multiplier for unbounded infinite research (prevents Math.pow Infinity overflow)
export function getTechLog10BonusForGenerator(
  generatorIndex: number,
  state: GameState
): number {
  if (state.activeChallengeRestrictions?.techMatrixDisabled) return 0
  const genClass = GENERATOR_CLASS[generatorIndex]
  if (genClass === 'computation') {
    const cInfLevel = state.infiniteResearchLevels['C_INF'] ?? 0
    return cInfLevel > 0 ? cInfLevel * Math.log10(1.1) : 0
  }
  if (genClass === 'energy') {
    const eInfLevel = state.infiniteResearchLevels['E_INF'] ?? 0
    return eInfLevel > 0 ? eInfLevel * Math.log10(1.08) : 0
  }
  return 0
}

// Global production exponent bonus from research, mutations, OS/AR upgrades, megaprojects, and Dyson Swarm
// Applied as: totalOutput ^ (1 + exponentBonus)
export function getProductionExponentBonus(state: GameState): number {
  let bonus = 0

  if (!state.activeChallengeRestrictions?.techMatrixDisabled) {
    const completed = new Set(state.completedResearchNodes)
    // C5: +0.1 to global production exponent
    if (completed.has('C5')) bonus += 0.1
    // R10: +0.5 to master production exponent
    if (completed.has('R10')) bonus += 0.5
  }

  // Century Mutation (1000+ units): +0.01 exponent per generator
  if (!state.activeChallengeRestrictions?.milestonesDisabled) {
    const ascendantCount = state.generators.filter(
      (g) => g.quantity >= 1000n
    ).length
    if (ascendantCount > 0) bonus += 0.01 * ascendantCount
  }

  // OS Exponential Catalyst (logarithmic on total OS earned) & AR Resonance Compression
  if (!state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
    if (state.osUpgrades.exponential_catalyst > 0) {
      const spentOS = OS_UPGRADES.reduce((sum, def) => {
        const lvl =
          state.osUpgrades[def.id as keyof typeof state.osUpgrades] ?? 0
        let invested = 0
        for (let l = 0; l < lvl; l++) invested += getUpgradeCost(def, l)
        return sum + invested
      }, 0)
      const totalOS = Math.max(1, state.omniSpars + spentOS)
      bonus += Math.min(0.75, 0.15 + 0.08 * Math.log10(1 + totalOS))
    }
    bonus += 0.02 * (state.arUpgrades.resonance_compression ?? 0)
  }

  // Omega Singularity Sphere megaproject: Phase 2 (+0.05) stays active permanently with Phase 4 (+0.25)
  if (getMegaprojectPhase('omega_singularity_sphere', state) >= 2) {
    bonus += 0.05
  }
  if (state.completedMegaprojects.includes('omega_singularity_sphere')) {
    bonus += 0.25
  }

  // Arkalon Dyson Swarm: asymptotic exponent bonus (+0.02 early, approaching +0.50 cap in endless)
  const swarmLevel = state.dysonSwarmLevel ?? 0
  if (swarmLevel > 0) {
    bonus += 0.5 * (1 - Math.exp(-0.04 * swarmLevel))
  }

  return bonus
}