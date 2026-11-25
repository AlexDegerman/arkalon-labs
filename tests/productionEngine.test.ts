import { describe, it, expect, beforeEach } from 'vitest'
import {
  recalculatePPS,
  computeProductionShares,
  getCumulativeMilestoneSteps,
  getNextMilestoneInfo,
  getMilestoneMultiplier,
  getARCap,
  getCountedAR,
  computeARBonus
} from '@/lib/productionEngine'
import {
  getTechMultiplierForGenerator,
  getTechLog10BonusForGenerator,
  getProductionExponentBonus
} from '@/lib/researchEffects'
import {
  getRelicExponentBonus,
  getSuperrecursiveCoreLevel
} from '@/lib/relicEffects'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
import { MAX_RP_HARD_CAP } from '@/constants/game'
import { GENERATORS } from '@/constants/generators'
import type {
  ChallengeRestrictions,
  GameState,
  GeneratorState
} from '@/types/game'

const NO_RESTRICTIONS: ChallengeRestrictions = {
  maxGeneratorTier: null,
  maxGeneratorQuantity: null,
  techMatrixDisabled: false,
  modulesDisabled: false,
  anomaliesDisabled: false,
  excavationDisabled: false,
  generatorCostMultiplier: 1,
  researchTimerMultiplier: 1,
  milestonesDisabled: false,
  energyBranchLocked: false,
  arkalonBranchLocked: false,
  singleBranchOnly: false,
  singleResearchSlot: false,
  relicsDisabled: false,
  generatorProductionMultiplier: 1,
  moduleLevelCapOverride: null,
  onlyGeneratorType: null,
  autoPrestigeIntervalSeconds: null,
  anomalySpawnIntervalSeconds: null,
  anomalyDurationOverrideSeconds: null,
  noResearchTimerTick: false,
  noBaseGeneratorOutput: false,
  productionOnlyWhileResearching: false,
  prestigeUpgradesDisabled: false
}

function restrictions(
  overrides: Partial<ChallengeRestrictions> = {}
): ChallengeRestrictions {
  return { ...NO_RESTRICTIONS, ...overrides }
}

function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...makeInitialState(), ...overrides }
}

function withGens(
  base: GameState,
  patches: Record<number, Partial<GeneratorState>>
): GameState {
  return {
    ...base,
    generators: base.generators.map((g, i) =>
      patches[i] ? { ...g, ...patches[i] } : g
    )
  }
}

function withRelic(
  base: GameState,
  relicId: number,
  level: number,
  slot = 0
): GameState {
  return {
    ...base,
    unlockedRelics: Array.from(new Set([...base.unlockedRelics, relicId])),
    relicLevels: { ...base.relicLevels, [relicId]: level },
    relicSlots: base.relicSlots.map((s, i) =>
      i === slot ? { relicId, cooldownRemaining: 0 } : s
    )
  }
}

function ratio(a: bigint, b: bigint): number {
  return Number(a) / Number(b)
}

describe('productionEngine', () => {
  beforeEach(() => {
    useGameStore.setState(makeInitialState())
    useUIStore.setState({
      alertQueue: [],
      activeAlert: null,
      terminalLines: [],
      offlineModalOpen: false,
      offlinePayload: null,
      challengeCompleteModalOpen: false,
      challengeCompletePayload: null,
      victoryModalOpen: false,
      victoryPayload: null
    })
    setNotationMode('suffix')
  })

  it('converts milliRP base output into whole RP per second', () => {
    expect(recalculatePPS(stateWith())).toBe(0n)
    expect(GENERATORS[0].baseOutput).toBe(1_000n)
    expect(GENERATORS[1].baseOutput).toBe(4_000n)

    const oneDesk = withGens(stateWith(), { 0: { quantity: 1n } })
    expect(recalculatePPS(oneDesk)).toBe(1n)

    const oneCluster = withGens(stateWith(), { 1: { quantity: 1n } })
    expect(recalculatePPS(oneCluster)).toBe(4n)

    const both = withGens(stateWith(), {
      0: { quantity: 1n },
      1: { quantity: 1n }
    })
    expect(recalculatePPS(both)).toBe(5n)
  })

  it('uses 10-unit Desk milestones up to 50 and 25-unit intervals afterwards with tapering', () => {
    expect(getCumulativeMilestoneSteps(0, 50n, 0, 0, 0)).toBe(5)
    expect(getCumulativeMilestoneSteps(0, 75n, 0, 0, 0)).toBe(6)
    expect(getCumulativeMilestoneSteps(1, 25n, 0, 0, 0)).toBe(1)
    expect(getCumulativeMilestoneSteps(1, 50n, 0, 0, 0)).toBe(2)

    expect(getNextMilestoneInfo(0, 0n, 0, 0, 0)).toEqual({
      current: 0,
      next: 10,
      doublings: 1
    })
    expect(getNextMilestoneInfo(0, 50n, 0, 0, 0)).toEqual({
      current: 50,
      next: 75,
      doublings: 6
    })
    expect(getNextMilestoneInfo(0, 75n, 0, 0, 0)).toEqual({
      current: 75,
      next: 100,
      doublings: 7
    })
    expect(getNextMilestoneInfo(1, 25n, 0, 0, 0)).toEqual({
      current: 25,
      next: 50,
      doublings: 2
    })

    const fiftyDesks = withGens(stateWith(), { 0: { quantity: 50n } })
    expect(recalculatePPS(fiftyDesks)).toBe(1_600n)

    expect(getMilestoneMultiplier(0)).toBe(1n)
    expect(getMilestoneMultiplier(1)).toBe(2n)
    expect(getMilestoneMultiplier(5)).toBe(32n)
    expect(getMilestoneMultiplier(6)).toBe(64n)
    expect(getMilestoneMultiplier(8)).toBe(256n)
    expect(getMilestoneMultiplier(9)).toBe(276n)
    expect(getMilestoneMultiplier(10)).toBe(298n)
    expect(Number(getMilestoneMultiplier(9)) / 256).toBeCloseTo(1.08, 2)

    const m100 = Number(getMilestoneMultiplier(100))
    const m101 = Number(getMilestoneMultiplier(101))
    const m102 = Number(getMilestoneMultiplier(102))
    expect(m101).toBeGreaterThan(m100)
    expect(m101 / m100).toBeCloseTo(1.05, 2)
    expect(m102 / m100).toBeCloseTo(1.1, 2)
    expect(Math.abs(m102 - m101 - (m101 - m100))).toBeLessThanOrEqual(2)
  })

  it('compresses milestone intervals via Milestone Sharpener, Relic 11 and SC8 down to floor 10', () => {
    expect(getCumulativeMilestoneSteps(1, 44n, 3, 0, 0)).toBe(2)
    expect(getCumulativeMilestoneSteps(1, 42n, 0, 0, 2)).toBe(2)

    const relicState = withRelic(stateWith(), 11, 3)
    const coreLevel = getSuperrecursiveCoreLevel(relicState)
    expect(coreLevel).toBeCloseTo(3, 6)
    expect(getCumulativeMilestoneSteps(1, 38n, 0, coreLevel, 0)).toBe(2)

    const floored = withRelic(
      stateWith({
        arUpgrades: {
          ...makeInitialState().arUpgrades,
          milestone_sharpener: 5
        },
        challengeRecords: { SC8: { completedTiers: 3, bestRP: 0n } }
      }),
      11,
      10
    )
    const flooredCore = getSuperrecursiveCoreLevel(floored)
    expect(getCumulativeMilestoneSteps(1, 25n, 5, flooredCore, 3)).toBe(2)
    expect(getNextMilestoneInfo(1, 25n, 5, flooredCore, 3).next).toBe(30)
    expect(getCumulativeMilestoneSteps(1, 9n, 5, flooredCore, 3)).toBe(0)
  })

  it('applies Century Mutations and disables them together with milestones', () => {
    const at = (qty: bigint) =>
      recalculatePPS(withGens(stateWith(), { 1: { quantity: qty } }))

    expect(ratio(at(100n), at(99n))).toBeCloseTo(4.04, 2)
    expect(ratio(at(250n), at(249n))).toBeCloseTo(3.253, 2)
    expect(ratio(at(500n), at(499n))).toBeCloseTo(5.68, 1)
    expect(at(1000n)).toBeGreaterThan(at(999n) * 10n)

    const ascendant = withGens(stateWith(), { 1: { quantity: 1000n } })
    expect(getProductionExponentBonus(ascendant)).toBeCloseTo(0.01, 6)
    const twinAscendant = withGens(stateWith(), {
      1: { quantity: 1000n },
      2: { quantity: 1000n }
    })
    expect(getProductionExponentBonus(twinAscendant)).toBeCloseTo(0.02, 6)
    expect(
      getProductionExponentBonus(
        withGens(stateWith(), { 1: { quantity: 999n } })
      )
    ).toBe(0)

    const disabled = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({ milestonesDisabled: true })
      }),
      { 1: { quantity: 100n } }
    )
    expect(recalculatePPS(disabled)).toBe(400n)

    const disabledAscendant = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({ milestonesDisabled: true })
      }),
      { 1: { quantity: 1000n } }
    )
    expect(recalculatePPS(disabledAscendant)).toBe(4_000n)
    expect(getProductionExponentBonus(disabledAscendant)).toBe(0)
  })

  it('applies module efficiency, AC5 doubling, Overclock and cross-chassis synergies', () => {
    const base = withGens(stateWith(), { 19: { quantity: 1n } })
    const ppsBase = recalculatePPS(base)

    const eff3 = withGens(stateWith(), {
      19: { quantity: 1n, efficiencyLevel: 3 }
    })
    expect(ratio(recalculatePPS(eff3), ppsBase)).toBeCloseTo(1.953125, 3)

    const ac5 = withGens(
      stateWith({
        activeChallengeId: 'AC5',
        activeChallengeRestrictions: restrictions({
          moduleLevelCapOverride: 10,
          generatorCostMultiplier: 10
        })
      }),
      { 19: { quantity: 1n, efficiencyLevel: 3 } }
    )
    expect(ratio(recalculatePPS(ac5), ppsBase)).toBeCloseTo(3.814697265625, 3)

    const eff5 = withGens(stateWith(), {
      19: { quantity: 1n, efficiencyLevel: 5 }
    })
    const overclocked = withGens(stateWith(), {
      19: {
        quantity: 1n,
        efficiencyLevel: 5,
        costReductionLevel: 5,
        synergyLevel: 5
      }
    })
    expect(recalculatePPS(overclocked)).toBe(recalculatePPS(eff5) * 2n)

    const synergyBase = stateWith({
      activeChallengeRestrictions: restrictions({ onlyGeneratorType: 9 })
    })
    const target = { 9: { quantity: 1n } }
    const noSynergy = withGens(synergyBase, {
      ...target,
      0: { quantity: 8n, synergyLevel: 0 }
    })
    expect(recalculatePPS(noSynergy)).toBe(75_000_000n)

    const syn1 = withGens(synergyBase, {
      ...target,
      0: { quantity: 8n, synergyLevel: 1 }
    })
    expect(recalculatePPS(syn1)).toBe(75_060_000n)

    const syn5 = withGens(synergyBase, {
      ...target,
      0: { quantity: 8n, synergyLevel: 5 }
    })
    expect(recalculatePPS(syn5)).toBe(75_300_000n)

    const syn5Overclocked = withGens(synergyBase, {
      ...target,
      0: {
        quantity: 8n,
        efficiencyLevel: 5,
        costReductionLevel: 5,
        synergyLevel: 5
      }
    })
    expect(recalculatePPS(syn5Overclocked)).toBe(75_375_000n)
    expect(recalculatePPS(syn5Overclocked) - recalculatePPS(syn5)).toBe(75_000n)

    const modulesOff = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({
          onlyGeneratorType: 9,
          modulesDisabled: true
        })
      }),
      {
        ...target,
        0: {
          quantity: 8n,
          efficiencyLevel: 5,
          costReductionLevel: 5,
          synergyLevel: 5
        }
      }
    )
    expect(recalculatePPS(modulesOff)).toBe(75_000_000n)
  })

  it('caps counted AR and stacks computeARBonus sources', () => {
    expect(getARCap(stateWith())).toBe(500)
    expect(
      getARCap(
        stateWith({
          arUpgrades: {
            ...makeInitialState().arUpgrades,
            arkalon_harmonic_cap: 3
          }
        })
      )
    ).toBe(2000)

    const spent = stateWith({
      arkalonResonance: 100,
      arUpgrades: {
        ...makeInitialState().arUpgrades,
        chronal_anchor: 1,
        dimensional_blueprinting: 1
      }
    })
    expect(getCountedAR(spent)).toBe(125)
    expect(getCountedAR(stateWith({ resonanceMemoryAR: 300 }))).toBe(300)
    expect(getCountedAR(stateWith({ arkalonResonance: 10_000 }))).toBe(500)
    expect(
      getCountedAR(
        stateWith({
          arkalonResonance: 10_000,
          arUpgrades: {
            ...makeInitialState().arUpgrades,
            arkalon_harmonic_cap: 1
          }
        })
      )
    ).toBe(1000)

    const hundred = stateWith({ arkalonResonance: 100 })
    expect(computeARBonus(hundred)).toBeCloseTo(11, 6)

    const superSymmetry = stateWith({
      arkalonResonance: 100,
      arUpgrades: { ...makeInitialState().arUpgrades, super_symmetry: 1 }
    })
    expect(computeARBonus(superSymmetry)).toBeCloseTo(51, 6)

    const withE5 = stateWith({
      arkalonResonance: 100,
      completedResearchNodes: ['E5'],
      arUpgrades: { ...makeInitialState().arUpgrades, super_symmetry: 1 }
    })
    expect(computeARBonus(withE5)).toBeCloseTo(52.25, 6)

    const withEc4 = stateWith({
      arkalonResonance: 100,
      completedResearchNodes: ['E5'],
      arUpgrades: { ...makeInitialState().arUpgrades, super_symmetry: 1 },
      challengeRecords: { EC4: { completedTiers: 1, bestRP: 0n } }
    })
    expect(computeARBonus(withEc4)).toBeCloseTo(104.5, 6)

    const inverted = stateWith({
      ...withEc4,
      activeAnomalyType: 'operation_matrix_inversion'
    })
    // Matrix Inversion doubles only the AR-derived portion: (1 + 51.25 * 2) * 2
    expect(computeARBonus(inverted)).toBeCloseTo(207, 6)

    const suspended = stateWith({
      ...inverted,
      activeChallengeRestrictions: restrictions({
        prestigeUpgradesDisabled: true
      })
    })
    expect(computeARBonus(suspended)).toBe(1)
  })

  it('honours AC1, AC6, maxGeneratorTier and onlyGeneratorType constraints', () => {
    const ac1 = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({
          productionOnlyWhileResearching: true
        })
      }),
      { 0: { quantity: 1n } }
    )
    expect(recalculatePPS(ac1)).toBe(0n)

    const researching: GameState = {
      ...ac1,
      activeResearchSlots: [{ nodeId: 'C1', timerRemaining: 5 }]
    }
    expect(recalculatePPS(researching)).toBe(1n)

    const expired: GameState = {
      ...ac1,
      activeResearchSlots: [{ nodeId: 'C1', timerRemaining: 0 }]
    }
    expect(recalculatePPS(expired)).toBe(0n)

    const ac6Base = stateWith({
      activeChallengeRestrictions: restrictions({ noBaseGeneratorOutput: true })
    })
    const ac6Empty = withGens(ac6Base, { 1: { quantity: 1n } })
    expect(recalculatePPS(ac6Empty)).toBe(0n)
    expect(
      recalculatePPS(
        withGens(withRelic(ac6Base, 1, 50), { 1: { quantity: 1n } })
      )
    ).toBe(4n)
    expect(
      recalculatePPS(
        withGens(withRelic(ac6Base, 1, 100), { 1: { quantity: 1n } })
      )
    ).toBe(8n)

    const tierCapped = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({ maxGeneratorTier: 1 })
      }),
      { 0: { quantity: 1n }, 1: { quantity: 1n } }
    )
    expect(recalculatePPS(tierCapped)).toBe(1n)

    const paradox = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({ onlyGeneratorType: 1 })
      }),
      { 0: { quantity: 1n }, 1: { quantity: 1n } }
    )
    expect(recalculatePPS(paradox)).toBe(4n)
  })

  it('stacks research branch multipliers and log10 infinite scaling without overflow', () => {
    expect(
      getTechMultiplierForGenerator(
        0,
        stateWith({ completedResearchNodes: ['C3'] })
      )
    ).toBeCloseTo(1.1, 6)
    expect(
      getTechMultiplierForGenerator(
        0,
        stateWith({ completedResearchNodes: ['C3', 'C1', 'C2'] })
      )
    ).toBeCloseTo(1.3, 6)
    expect(
      getTechMultiplierForGenerator(
        3,
        withGens(stateWith({ completedResearchNodes: ['C4'] }), {
          1: { quantity: 20n }
        })
      )
    ).toBeCloseTo(2, 6)
    expect(
      getTechMultiplierForGenerator(
        5,
        stateWith({ completedResearchNodes: ['E4'] })
      )
    ).toBeCloseTo(5, 6)
    expect(
      getTechMultiplierForGenerator(
        6,
        stateWith({ completedResearchNodes: ['O4'] })
      )
    ).toBeCloseTo(4, 6)
    expect(
      getTechMultiplierForGenerator(
        5,
        stateWith({ completedResearchNodes: ['O10', 'C3', 'E4', 'O4'] })
      )
    ).toBeCloseTo(42, 6)

    const infState = stateWith({
      infiniteResearchLevels: { C_INF: 200, E_INF: 200 }
    })
    const cLog = getTechLog10BonusForGenerator(0, infState)
    const eLog = getTechLog10BonusForGenerator(5, infState)
    expect(cLog).toBeCloseTo(200 * Math.log10(1.1), 6)
    expect(eLog).toBeCloseTo(200 * Math.log10(1.08), 6)
    expect(Number.isFinite(cLog)).toBe(true)
    expect(Number.isFinite(eLog)).toBe(true)
    expect(getTechLog10BonusForGenerator(4, infState)).toBe(0)

    const infPPS = recalculatePPS(withGens(infState, { 0: { quantity: 1n } }))
    expect(infPPS).toBeGreaterThan(1_000_000n)
    expect(infPPS).toBeLessThan(10n ** 12n)
    expect(Number.isFinite(Number(infPPS))).toBe(true)
  })

  it('stacks production exponents and applies the 1e308 softcap and 1e1000 hard cap', () => {
    expect(
      getProductionExponentBonus(
        stateWith({ completedResearchNodes: ['C5', 'R10'] })
      )
    ).toBeCloseTo(0.6, 6)
    expect(getRelicExponentBonus(withRelic(stateWith(), 8, 10))).toBeCloseTo(
      0.2,
      6
    )
    expect(
      getProductionExponentBonus(stateWith({ dysonSwarmLevel: 10 }))
    ).toBeCloseTo(0.5 * (1 - Math.exp(-0.4)), 6)
    expect(
      getProductionExponentBonus(
        stateWith({
          osUpgrades: {
            ...makeInitialState().osUpgrades,
            exponential_catalyst: 1
          }
        })
      )
    ).toBeCloseTo(0.15 + 0.08 * Math.log10(11), 6)

    const heavy = withGens(stateWith(), { 19: { quantity: 1n } })
    const heavyBase = recalculatePPS(heavy)
    const heavyBoosted = recalculatePPS({
      ...heavy,
      completedResearchNodes: ['C5']
    })
    expect(heavyBoosted).toBeGreaterThan(heavyBase * 100n)

    const softcapState = withGens(
      stateWith({ infiniteResearchLevels: { C_INF: 20_000 } }),
      { 0: { quantity: 1n } }
    )
    const softcapped = recalculatePPS(softcapState)
    expect(softcapped).toBeGreaterThan(10n ** 550n)
    expect(softcapped).toBeLessThan(10n ** 556n)
    expect(softcapped).toBeLessThan(MAX_RP_HARD_CAP)

    const hardcapState = withRelic(softcapState, 8, 100)
    const hardcapped = recalculatePPS(hardcapState)
    expect(hardcapped).toBeGreaterThan(10n ** 999n)
    expect(hardcapped).toBeLessThanOrEqual(MAX_RP_HARD_CAP)
  })

  it('computes proportional production shares', () => {
    expect(computeProductionShares(stateWith())).toEqual(Array(20).fill(0))

    const paused = withGens(
      stateWith({
        activeChallengeRestrictions: restrictions({
          productionOnlyWhileResearching: true
        })
      }),
      { 0: { quantity: 1n }, 1: { quantity: 1n } }
    )
    expect(computeProductionShares(paused)).toEqual(Array(20).fill(0))

    const mixed = withGens(stateWith(), {
      0: { quantity: 1n },
      1: { quantity: 1n }
    })
    const shares = computeProductionShares(mixed)
    expect(shares).toHaveLength(20)
    expect(shares[0]).toBeCloseTo(20, 6)
    expect(shares[1]).toBeCloseTo(80, 6)
    expect(shares[2]).toBe(0)
    const total = shares.reduce((sum, s) => sum + s, 0)
    expect(total).toBeGreaterThanOrEqual(99.9)
    expect(total).toBeLessThanOrEqual(100.1)
  })
})
