// Maps research node IDs to their production engine effects
// All values are read by productionEngine.ts during recalculatePPS
// This module is pure data - no side effects, no store access

import type { GameState } from '@/types/game'
import { GENERATOR_CLASS } from '@/constants/generators'

// Returns the tech multiplier for a specific generator index
// based on all completed research nodes
export function getTechMultiplierForGenerator(
  generatorIndex: number,
  state: GameState
): number {
  const completed = new Set(state.completedResearchNodes)
  const genClass = GENERATOR_CLASS[generatorIndex]
  let multiplier = 1

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
    const lnRP = Math.log(Math.max(1, Number(state.lifetimePoints)))
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

  // E8: energy class exponential yield scaling
  // Approximated as 1 + ln(lifetimeRP) * 0.1 for energy class
  if (completed.has('E8') && genClass === 'energy') {
    const scale = 1 + Math.log(Math.max(1, Number(state.lifetimePoints))) * 0.1
    multiplier *= scale
  }

  // E9: Stellar Harvesters (14) and Galactic Engines (15) at 1.5x
  if (completed.has('E9') && (generatorIndex === 14 || generatorIndex === 15)) {
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

  // O5: cost reduction only (no production effect)

  // O7: +1% AR effectiveness per prestige completed
  // Handled in AR bonus, not generator-level multiplier

  // O8: +0.5% per completed node to all generators from cross-branch
  if (completed.has('O8')) {
    multiplier *= 1 + 0.005 * completed.size
  }

  // O9: Arkalon Interfaces 5x
  if (completed.has('O9') && generatorIndex === 6) {
    multiplier *= 5
  }

  // O10: all branch multipliers apply to all classes (ultimate convergence)
  // When O10 is complete, apply C3/E4/O4 bonuses to all generators regardless of class
  if (completed.has('O10')) {
    if (!completed.has('C3')) {
      // Already applied above if computation class; apply universally here
    }
    multiplier *= 1.5 // Simplified convergence bonus until full Tier 9-10 integration
  }

  // R6: +1% per total generator owned across all classes
  if (completed.has('R6')) {
    const totalOwned = state.generators.reduce(
      (sum, g) => sum + Number(g.quantity),
      0
    )
    multiplier *= 1 + 0.01 * totalOwned
  }

  // C_INF: +10% computation efficiency per level
  if (genClass === 'computation') {
    const cInfLevel = state.infiniteResearchLevels['C_INF'] ?? 0
    if (cInfLevel > 0) {
      multiplier *= Math.pow(1.1, cInfLevel)
    }
  }

  // E_INF: +8% energy output per level
  if (genClass === 'energy') {
    const eInfLevel = state.infiniteResearchLevels['E_INF'] ?? 0
    if (eInfLevel > 0) {
      multiplier *= Math.pow(1.08, eInfLevel)
    }
  }

  // O_INF: applied to AR multiplier, not generator directly

  // Generator Transcendence CF upgrade: +5% to tier 6+ per level
  if (generatorIndex >= 5 && state.cfUpgrades.generator_transcendence > 0) {
    multiplier *= 1 + 0.05 * state.cfUpgrades.generator_transcendence
  }

  // Operation artifact Arkalon Core Synapse: 1.15x computation class
  if (
    genClass === 'computation' &&
    state.operationArtifactsUnlocked.includes('arkalon_core_synapse')
  ) {
    multiplier *= 1.15
  }

  // Dyson Siphon relic: +0.5% per Stellar Harvester to all energy generators
  // Applied in Phase 9 relic effects

  return multiplier
}

// Returns the global production exponent additive bonus from research
// Applied as: totalOutput ^ (1 + exponentBonus)
// Kept small to avoid runaway scaling; each node adds a small increment
export function getProductionExponentBonus(state: GameState): number {
  const completed = new Set(state.completedResearchNodes)
  let bonus = 0

  // C5: +0.1 to global production exponent
  if (completed.has('C5')) bonus += 0.1

  // R10: +0.5 to master production exponent
  if (completed.has('R10')) bonus += 0.5

  // Tachyon Prism relic (ID 8): +0.02 per level
  // Applied in Phase 9 relic effects; stub 0 here

  // OS Exponential Catalyst: +0.05 per OS held
  bonus += 0.05 * state.omniSpars * state.osUpgrades.exponential_catalyst

  return bonus
}

// Returns the global research speed multiplier (applied to study timers)
// Used by getEffectiveStudyTime in researchNodes.ts
export function getGlobalResearchSpeedMultiplier(state: GameState): number {
  // This is factored into getEffectiveStudyTime directly
  // Kept here as a reference for any future global speed reads
  return 1
}
