import { describe, it, expect, beforeEach } from 'vitest'
import {
  costToBuyN,
  maxAffordable,
  nextCost,
  canAfford
} from '@/lib/generatorCosts'
import {
  getEffectiveGrowthFactor,
  generatorEffectiveCost
} from '@/lib/productionEngine'
import { getModuleUpgradeCost, getModuleLevelCap } from '@/lib/moduleDefs'
import {
  SYNTHESIZERS,
  isSynthesizerUnlocked,
  isSynthesizersDisabled,
  getSynthesizerCost,
  getSynthesizerCostToBuyN,
  getSynthesizerMaxAffordable,
  getSynthesizerRates,
  getDustGlobalMultiplier
} from '@/lib/synthesizerDefs'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
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

function withUnlock(
  base: GameState,
  key: keyof GameState['unlocks']
): GameState {
  return { ...base, unlocks: { ...base.unlocks, [key]: true } }
}

describe('generatorCosts', () => {
  beforeEach(() => {
    useGameStore.setState(makeInitialState())
    useUIStore.setState({
      alertQueue: [],
      activeAlert: null,
      terminalLines: [],
      offlineModalOpen: false,
      offlinePayload: null
    })
    setNotationMode('suffix')
  })

  it('reduces growth factors from every source and never drops below 1.01', () => {
    expect(getEffectiveGrowthFactor(0, stateWith())).toBeCloseTo(1.15, 6)
    expect(
      getEffectiveGrowthFactor(
        0,
        withGens(stateWith(), { 0: { costReductionLevel: 2 } })
      )
    ).toBeCloseTo(1.12, 6)
    expect(
      getEffectiveGrowthFactor(
        0,
        withGens(stateWith(), { 0: { quantity: 100n } })
      )
    ).toBeCloseTo(1.145, 6)
    expect(
      getEffectiveGrowthFactor(0, stateWith({ completedResearchNodes: ['C1'] }))
    ).toBeCloseTo(1.13, 6)
    expect(
      getEffectiveGrowthFactor(
        0,
        stateWith({
          challengeRecords: { SC6: { completedTiers: 2, bestRP: 0n } }
        })
      )
    ).toBeCloseTo(1.13, 6)
    expect(
      getEffectiveGrowthFactor(
        10,
        stateWith({ completedResearchNodes: ['C9'] })
      )
    ).toBeCloseTo(1.025, 6)
    expect(
      getEffectiveGrowthFactor(5, stateWith({ completedResearchNodes: ['E6'] }))
    ).toBeCloseTo(1.05, 6)
    expect(
      getEffectiveGrowthFactor(
        0,
        stateWith({
          osUpgrades: {
            ...makeInitialState().osUpgrades,
            dimensional_transcendence: 1
          }
        })
      )
    ).toBeCloseTo(1.1, 6)
    expect(
      getEffectiveGrowthFactor(0, withRelic(stateWith(), 4, 10))
    ).toBeCloseTo(1.14, 6)

    const stacked = withRelic(
      stateWith({
        completedResearchNodes: ['C1'],
        challengeRecords: { SC6: { completedTiers: 3, bestRP: 0n } },
        osUpgrades: {
          ...makeInitialState().osUpgrades,
          dimensional_transcendence: 1
        }
      }),
      4,
      100
    )
    const stackedWithModules = withGens(stacked, {
      0: { quantity: 100n, costReductionLevel: 5 }
    })
    expect(getEffectiveGrowthFactor(0, stackedWithModules)).toBeCloseTo(1.01, 6)
    expect(
      getEffectiveGrowthFactor(
        19,
        withGens(stateWith(), { 19: { costReductionLevel: 5 } })
      )
    ).toBeCloseTo(1.01, 6)
    expect(
      getEffectiveGrowthFactor(
        0,
        withGens(
          stateWith({
            activeChallengeRestrictions: restrictions({ modulesDisabled: true })
          }),
          { 0: { costReductionLevel: 5 } }
        )
      )
    ).toBeCloseTo(1.15, 6)
  })

  it('applies R1 only to the very first Server Cluster and Quantum Computer', () => {
    const withR1 = stateWith({ completedResearchNodes: ['R1'] })
    const without = stateWith()

    expect(generatorEffectiveCost(1, 0n, without)).toBe(120n)
    expect(generatorEffectiveCost(1, 0n, withR1)).toBe(102n)
    expect(generatorEffectiveCost(1, 1n, withR1)).toBe(136n)
    expect(generatorEffectiveCost(1, 1n, without)).toBe(136n)

    expect(generatorEffectiveCost(2, 0n, without)).toBe(1_000n)
    expect(generatorEffectiveCost(2, 0n, withR1)).toBe(850n)
    expect(generatorEffectiveCost(2, 1n, withR1)).toBe(1_110n)
    expect(generatorEffectiveCost(2, 1n, without)).toBe(1_110n)

    expect(generatorEffectiveCost(0, 0n, withR1)).toBe(15n)
  })

  it('ignores anomalies for generator costs and scales by challenge cost multiplier', () => {
    const base = stateWith()
    expect(generatorEffectiveCost(0, 0n, base)).toBe(15n)

    for (const anomaly of [
      'containment_breach',
      'operation_gravity_sink',
      'fused_singularity_surge',
      'quantum_surge'
    ] as const) {
      expect(
        generatorEffectiveCost(0, 0n, stateWith({ activeAnomalyType: anomaly }))
      ).toBe(15n)
    }

    const ac5 = stateWith({
      activeChallengeRestrictions: restrictions({ generatorCostMultiplier: 10 })
    })
    expect(generatorEffectiveCost(0, 0n, ac5)).toBe(150n)

    const combined = stateWith({
      activeAnomalyType: 'containment_breach',
      activeChallengeRestrictions: restrictions({ generatorCostMultiplier: 10 })
    })
    expect(generatorEffectiveCost(0, 0n, combined)).toBe(150n)
  })

  it('segments costToBuyN exactly across R1 and M100 boundaries', () => {
    const s = stateWith({ completedResearchNodes: ['R1'] })
    expect(costToBuyN(1, 1, s)).toBe(nextCost(1, s))
    expect(costToBuyN(1, 1, s)).toBe(102n)
    expect(
      canAfford(
        1,
        stateWith({ researchPoints: 102n, completedResearchNodes: ['R1'] })
      )
    ).toBe(true)

    let smallManual = 0n
    for (let i = 0; i < 5; i++) {
      smallManual += generatorEffectiveCost(1, BigInt(i), s)
    }
    expect(costToBuyN(1, 5, s)).toBe(smallManual)

    let manual = 0n
    for (let i = 0; i < 150; i++) {
      manual += generatorEffectiveCost(1, BigInt(i), s)
    }
    const bulk = costToBuyN(1, 150, s)
    expect(bulk).toBeGreaterThan(0n)
    const relativeError = Math.abs(Number(bulk - manual)) / Number(manual)
    expect(relativeError).toBeLessThan(0.001)

    const bigBase = stateWith()
    let bigManual = 0n
    for (let i = 0; i < 150; i++) {
      bigManual += generatorEffectiveCost(19, BigInt(i), bigBase)
    }
    const bigBulk = costToBuyN(19, 150, bigBase)
    expect(
      Math.abs(Number(bigBulk - bigManual)) / Number(bigManual)
    ).toBeLessThan(0.001)
    expect(costToBuyN(0, 0, s)).toBe(0n)
  })

  it('maxAffordable never overdraws researchPoints from small to astronomic balances', () => {
    expect(maxAffordable(0, stateWith({ researchPoints: 10n }))).toBe(0)
    expect(maxAffordable(0, stateWith({ researchPoints: 0n }))).toBe(0)
    expect(maxAffordable(0, stateWith({ researchPoints: 1_000n }))).toBe(17)

    for (const balance of [1_000n, 10n ** 25n, 10n ** 200n]) {
      const s = stateWith({ researchPoints: balance })
      const n = maxAffordable(0, s)
      expect(n).toBeGreaterThan(0)
      expect(n).toBeLessThan(10_000_000)
      expect(costToBuyN(0, n, s)).toBeLessThanOrEqual(balance)
      expect(costToBuyN(0, n + 1, s)).toBeGreaterThan(balance)
    }

    const voidBalance = 10n ** 30n
    const voidState = stateWith({ researchPoints: voidBalance })
    const voidCount = maxAffordable(19, voidState)
    expect(voidCount).toBeGreaterThan(0)
    expect(costToBuyN(19, voidCount, voidState)).toBeLessThanOrEqual(
      voidBalance
    )
    expect(costToBuyN(19, voidCount + 1, voidState)).toBeGreaterThan(
      voidBalance
    )
  })

  it('scales module upgrade costs and resolves module level caps', () => {
    expect(getModuleUpgradeCost(0, 'efficiency', 0)).toBe(150n)
    expect(getModuleUpgradeCost(0, 'efficiency', 1)).toBe(1_500n)
    expect(getModuleUpgradeCost(0, 'cost_reduction', 0)).toBe(225n)
    expect(getModuleUpgradeCost(0, 'synergy', 0)).toBe(375n)
    expect(getModuleUpgradeCost(1, 'efficiency', 0)).toBe(1_200n)

    expect(getModuleUpgradeCost(0, 'efficiency', 0, 1)).toBe(135n)
    expect(getModuleUpgradeCost(0, 'efficiency', 0, 3)).toBe(105n)
    expect(getModuleUpgradeCost(0, 'efficiency', 0, 6)).toBe(75n)
    expect(getModuleUpgradeCost(0, 'efficiency', 0, 9)).toBe(75n)

    expect(getModuleLevelCap(stateWith())).toBe(5)
    expect(
      getModuleLevelCap(
        stateWith({
          challengeRecords: { AC5: { completedTiers: 2, bestRP: 0n } }
        })
      )
    ).toBe(7)
    expect(
      getModuleLevelCap(
        stateWith({
          challengeRecords: { AC5: { completedTiers: 5, bestRP: 0n } }
        })
      )
    ).toBe(8)
    expect(
      getModuleLevelCap(
        stateWith({
          activeChallengeRestrictions: restrictions({
            moduleLevelCapOverride: 10
          })
        })
      )
    ).toBe(10)
  })

  it('gates synthesizers behind their unlock feature and EC4 lockdown', () => {
    const locked = stateWith()
    for (let i = 0; i < SYNTHESIZERS.length; i++) {
      expect(isSynthesizerUnlocked(i, locked)).toBe(false)
    }
    expect(isSynthesizerUnlocked(99, locked)).toBe(false)

    expect(SYNTHESIZERS[0].unlockFeature).toBe('relics')
    expect(SYNTHESIZERS[1].unlockFeature).toBe('excavation')
    expect(SYNTHESIZERS[2].unlockFeature).toBe('anomalousOperations')
    expect(SYNTHESIZERS[3].unlockFeature).toBe('megaprojects')

    expect(isSynthesizerUnlocked(0, withUnlock(locked, 'relics'))).toBe(true)
    expect(isSynthesizerUnlocked(1, withUnlock(locked, 'relics'))).toBe(false)
    expect(isSynthesizerUnlocked(1, withUnlock(locked, 'excavation'))).toBe(
      true
    )
    expect(
      isSynthesizerUnlocked(2, withUnlock(locked, 'anomalousOperations'))
    ).toBe(true)
    expect(isSynthesizerUnlocked(3, withUnlock(locked, 'megaprojects'))).toBe(
      true
    )

    expect(
      isSynthesizersDisabled(
        stateWith({
          activeChallengeRestrictions: restrictions({ relicsDisabled: true })
        })
      )
    ).toBe(false)

    const ec4 = stateWith({
      unlocks: {
        ...makeInitialState().unlocks,
        relics: true,
        excavation: true,
        anomalousOperations: true,
        megaprojects: true
      },
      activeChallengeRestrictions: restrictions({
        relicsDisabled: true,
        excavationDisabled: true
      })
    })
    expect(isSynthesizersDisabled(ec4)).toBe(true)
    for (let i = 0; i < SYNTHESIZERS.length; i++) {
      expect(isSynthesizerUnlocked(i, ec4)).toBe(false)
    }
  })

  it('scales synthesizer costs and bulk affordability', () => {
    expect(getSynthesizerCost(0, 0)).toBe(10_000n)
    expect(getSynthesizerCost(0, 1)).toBe(13_500n)
    expect(getSynthesizerCost(0, 2)).toBe(18_226n)
    expect(getSynthesizerCostToBuyN(0, 3, 0)).toBe(41_726n)
    expect(getSynthesizerCostToBuyN(0, 0, 0)).toBe(0n)
    expect(getSynthesizerCost(3, 0)).toBe(1_000_000_000_000n)
    const crucibleNext = getSynthesizerCost(3, 1)
    expect(crucibleNext).toBeGreaterThanOrEqual(1_550_000_000_000n)
    expect(crucibleNext).toBeLessThanOrEqual(1_650_000_000_001_000n)
    expect(getSynthesizerCost(99, 0)).toBe(0n)

    expect(
      getSynthesizerMaxAffordable(0, stateWith({ researchPoints: 41_726n }))
    ).toBe(3)
    expect(
      getSynthesizerMaxAffordable(0, stateWith({ researchPoints: 41_725n }))
    ).toBe(2)
    expect(
      getSynthesizerMaxAffordable(0, stateWith({ researchPoints: 9_999n }))
    ).toBe(0)
    expect(
      getSynthesizerMaxAffordable(0, stateWith({ researchPoints: 10n ** 100n }))
    ).toBe(500)

    for (const balance of [50_000n, 10n ** 12n, 10n ** 40n]) {
      for (let i = 0; i < SYNTHESIZERS.length; i++) {
        const s = stateWith({ researchPoints: balance })
        const count = getSynthesizerMaxAffordable(i, s)
        expect(getSynthesizerCostToBuyN(i, count, 0)).toBeLessThanOrEqual(
          balance
        )
      }
    }

    const partial = stateWith({
      researchPoints: 100_000n,
      synthesizers: [4, 0, 0, 0]
    })
    const partialCount = getSynthesizerMaxAffordable(0, partial)
    expect(getSynthesizerCostToBuyN(0, partialCount, 4)).toBeLessThanOrEqual(
      100_000n
    )
  })

  it('scales synthesizer rates with crucible, era, swarm, relics and operation anomalies', () => {
    const empty = getSynthesizerRates(stateWith())
    expect(empty.dustPerMin).toBe(0)
    expect(empty.opPerMin).toBe(0)
    expect(empty.probeSpeedBonus).toBe(1)

    const twoCondensers = getSynthesizerRates(
      stateWith({ synthesizers: [2, 0, 0, 0] })
    )
    expect(twoCondensers.dustPerMin).toBeCloseTo(2, 6)
    expect(twoCondensers.dustPerSec).toBeCloseTo(2 / 60, 6)

    const withCrucible = getSynthesizerRates(
      stateWith({ synthesizers: [2, 0, 0, 2] })
    )
    expect(withCrucible.dustPerMin).toBeCloseTo(108, 6)

    const era2 = getSynthesizerRates(
      stateWith({ synthesizers: [2, 0, 0, 0], lifetimePoints: 10n ** 9n })
    )
    expect(era2.dustPerMin).toBeCloseTo(3, 6)

    expect(
      getDustGlobalMultiplier({
        lifetimePoints: 10n ** 9n,
        dysonSwarmLevel: 2,
        achievements: ['relic_all']
      })
    ).toBeCloseTo(1.5 * 1.5 * 1.15, 6)

    const stacked = getSynthesizerRates(
      stateWith({
        synthesizers: [2, 0, 0, 0],
        lifetimePoints: 10n ** 9n,
        dysonSwarmLevel: 2,
        achievements: ['relic_all']
      })
    )
    expect(stacked.dustPerMin).toBeCloseTo(5.175, 6)

    expect(
      getSynthesizerRates(stateWith({ synthesizers: [0, 3, 0, 0] }))
        .probeSpeedBonus
    ).toBeCloseTo(1.15, 6)

    const opsLocked = getSynthesizerRates(
      stateWith({ synthesizers: [0, 0, 3, 0] })
    )
    expect(opsLocked.opPerMin).toBe(0)

    const opsUnlocked = stateWith({
      synthesizers: [0, 0, 3, 0],
      unlocks: { ...makeInitialState().unlocks, anomalousOperations: true }
    })
    expect(getSynthesizerRates(opsUnlocked).opPerMin).toBeCloseTo(6, 6)
    expect(
      getSynthesizerRates({
        ...opsUnlocked,
        activeAnomalyType: 'operation_gravity_sink'
      }).opPerMin
    ).toBeCloseTo(18, 6)
    expect(
      getSynthesizerRates({
        ...opsUnlocked,
        activeAnomalyType: 'quantum_surge'
      }).opPerMin
    ).toBeCloseTo(6, 6)
    expect(
      getSynthesizerRates({ ...opsUnlocked, synthesizers: [0, 0, 0, 1] })
        .opPerMin
    ).toBeCloseTo(12.5, 6)

    const disabled = getSynthesizerRates(
      stateWith({
        synthesizers: [5, 5, 5, 5],
        activeChallengeRestrictions: restrictions({
          relicsDisabled: true,
          excavationDisabled: true
        })
      })
    )
    expect(disabled.dustPerMin).toBe(0)
    expect(disabled.opPerMin).toBe(0)
    expect(disabled.probeSpeedBonus).toBe(1)
  })
})
