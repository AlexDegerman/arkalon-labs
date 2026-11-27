'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { GENERATORS } from '@/constants/generators'
import { costToBuyN, maxAffordable } from '@/lib/generatorCosts'
import {
  getModuleUpgradeCost as getModuleUpgradeCostFn,
  getModuleMaxUpgradeInfo,
  getTrackLevelCap as getTrackLevelCapFn,
  getUpgradeAllModulesPlan
} from '@/lib/moduleDefs'
import { markUnlocksDirty, markTutorialDirty, markAchievementsDirty } from '@/lib/dirtyFlags'
import { dispatchGeneratorUnlock } from '@/lib/dialogueDispatcher'
import type { ModuleType } from '@/types/game'
import type { BulkBuyAmount } from '@/constants/game'
import { playSound } from '@/hooks/useSound'
import { awardRelic } from './relicActions'

// Module purchase action
export function buyModule(
  generatorIndex: number,
  moduleType: ModuleType,
  _currentLevel?: number,
  silent = false
): void {
  const store = useGameStore.getState()
  // SC4, EC1, EC4: modules disabled
  if (store.activeChallengeRestrictions?.modulesDisabled) return
  const gen = store.generators[generatorIndex]
  if (!gen) return

  const actualLevel =
    moduleType === 'efficiency'
      ? gen.efficiencyLevel
      : moduleType === 'cost_reduction'
        ? gen.costReductionLevel
        : gen.synergyLevel

  const cap = getTrackLevelCapFn(generatorIndex, moduleType, store)
  if (actualLevel >= cap) return
  const sc4Tiers = store.challengeRecords['SC4']?.completedTiers ?? 0
  const cost = getModuleUpgradeCostFn(
    generatorIndex,
    moduleType,
    actualLevel,
    sc4Tiers
  )
  if (store.researchPoints < cost) return

  useGameStore.setState((s) => {
    const newGenerators = s.generators.map((g, i) => {
      if (i !== generatorIndex) return g
      switch (moduleType) {
        case 'efficiency':
          return { ...g, efficiencyLevel: g.efficiencyLevel + 1 }
        case 'cost_reduction':
          return { ...g, costReductionLevel: g.costReductionLevel + 1 }
        case 'synergy':
          return { ...g, synergyLevel: g.synergyLevel + 1 }
        default:
          return g
      }
    })
    return {
      researchPoints: s.researchPoints - cost,
      generators: newGenerators
    }
  })

  if (!silent) playSound('purchase')

  // Modules affect production
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

export function buyModuleMax(
  generatorIndex: number,
  moduleType: ModuleType
): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.modulesDisabled) return
  const gen = store.generators[generatorIndex]
  if (!gen) return

  const actualLevel =
    moduleType === 'efficiency'
      ? gen.efficiencyLevel
      : moduleType === 'cost_reduction'
        ? gen.costReductionLevel
        : gen.synergyLevel

  const cap = getTrackLevelCapFn(generatorIndex, moduleType, store)
  if (actualLevel >= cap) return

  const sc4Tiers = store.challengeRecords['SC4']?.completedTiers ?? 0
  const { levels, cost } = getModuleMaxUpgradeInfo(
    generatorIndex,
    moduleType,
    actualLevel,
    cap,
    store.researchPoints,
    sc4Tiers
  )
  if (levels <= 0 || store.researchPoints < cost) return

  useGameStore.setState((s) => {
    const newGenerators = s.generators.map((g, i) => {
      if (i !== generatorIndex) return g
      switch (moduleType) {
        case 'efficiency':
          return { ...g, efficiencyLevel: g.efficiencyLevel + levels }
        case 'cost_reduction':
          return { ...g, costReductionLevel: g.costReductionLevel + levels }
        case 'synergy':
          return { ...g, synergyLevel: g.synergyLevel + levels }
        default:
          return g
      }
    })
    return {
      researchPoints: s.researchPoints - cost,
      generators: newGenerators
    }
  })

  playSound('purchase')
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

export function buyAllModules(filterType?: ModuleType): void {
  const store = useGameStore.getState()
  if (
    store.arUpgrades.bulk_procurement <= 0 ||
    store.activeChallengeRestrictions?.prestigeUpgradesDisabled
  ) {
    return
  }

  const plan = getUpgradeAllModulesPlan(store, filterType)
  if (plan.purchaseCount <= 0) return

  useGameStore.setState({
    researchPoints: store.researchPoints - plan.totalCost,
    generators: plan.nextGenerators
  })

  playSound('purchase')
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
  markAchievementsDirty()
}

// Generator purchase action
// amount: 1 | 10 | 100 | 'max'
export function buyGenerator(
  generatorIndex: number,
  amount: BulkBuyAmount,
  silent = false
): void {
  const store = useGameStore.getState()
  const gen = store.generators[generatorIndex]
  if (!gen) return

  // SC1, AC4, EC1: restrict buying disabled generator tiers
  const maxTier = store.activeChallengeRestrictions?.maxGeneratorTier
  if (maxTier !== null && maxTier !== undefined && generatorIndex >= maxTier)
    return

  // Determine actual count to buy
  let count: number
  if (amount === 'max') {
    count = maxAffordable(generatorIndex, store)
  } else {
    count = amount
  }

  const maxQty = store.activeChallengeRestrictions?.maxGeneratorQuantity
  if (maxQty !== null && maxQty !== undefined) {
    if (gen.quantity >= maxQty) return
    const remaining = Number(maxQty - gen.quantity)
    count = Math.min(count, remaining)
  }

  if (count <= 0) return

  const totalCost = costToBuyN(generatorIndex, count, store)
  if (store.researchPoints < totalCost) return

  const newGenerators = store.generators.map((g, i) => {
    if (i !== generatorIndex) return g
    return { ...g, quantity: g.quantity + BigInt(count) }
  })

  const prevOnlyType = store.activeChallengeRestrictions?.onlyGeneratorType
  const switchedOnlyType =
    prevOnlyType !== null &&
    prevOnlyType !== undefined &&
    prevOnlyType !== generatorIndex

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - totalCost,
    generators: newGenerators,
    // EC2: switch active generator type to purchased tier
    activeChallengeRestrictions:
      s.activeChallengeRestrictions?.onlyGeneratorType !== null &&
      s.activeChallengeRestrictions?.onlyGeneratorType !== undefined
        ? {
            ...s.activeChallengeRestrictions,
            onlyGeneratorType: generatorIndex
          }
        : s.activeChallengeRestrictions
  }))

  if (switchedOnlyType) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Singularity Paradox Switched',
      message: `Production now flows exclusively through ${GENERATORS[generatorIndex]?.name ?? `Tier ${generatorIndex + 1}`}.`,
      autoDismissMs: 3500
    })
  }

  if (!silent) playSound('purchase')
  markUnlocksDirty()
  markTutorialDirty()
  markAchievementsDirty()

  // Fire dialogue on first purchase of each generator type
  const prevQty = store.generators[generatorIndex]?.quantity ?? 0n
  if (prevQty === 0n && count > 0) {
    dispatchGeneratorUnlock(generatorIndex)
  }

  const updatedQty = newGenerators[generatorIndex]?.quantity ?? 0n
  if (updatedQty >= 500n) awardRelic(11)
  if (generatorIndex === 4 && updatedQty >= 250n) awardRelic(15)
  if (generatorIndex === 5 && updatedQty >= 50n) awardRelic(10)
  if (generatorIndex === 14 && updatedQty >= 50n) awardRelic(12)
  if (generatorIndex === 13 && updatedQty >= 100n) awardRelic(17)
  if (generatorIndex === 19 && updatedQty >= 10n) awardRelic(20)

  // Recalculate PPS since generator quantities changed
  useGameStore.getState().recalcPPS()
}

export function buyMaxAllGenerators(): void {
  const store = useGameStore.getState()
  if (
    store.arUpgrades.bulk_procurement <= 0 ||
    store.activeChallengeRestrictions?.prestigeUpgradesDisabled
  ) {
    return
  }
  if (store.researchPoints <= 0n) return

  let currentRP = store.researchPoints
  let newGenerators = [...store.generators]
  let activeRestrictions = store.activeChallengeRestrictions
  let anyPurchased = false

  // Buy from highest generator index down to 0 to prioritize optimal yield
  for (let i = 19; i >= 0; i--) {
    const gen = newGenerators[i]
    if (!gen) continue

    const onlyType = activeRestrictions?.onlyGeneratorType
    if (onlyType !== null && onlyType !== undefined && i !== onlyType) continue

    const maxTier = activeRestrictions?.maxGeneratorTier
    if (maxTier !== null && maxTier !== undefined && i >= maxTier) continue

    const maxQty = activeRestrictions?.maxGeneratorQuantity
    if (maxQty !== null && maxQty !== undefined && gen.quantity >= maxQty)
      continue

    const tempState = {
      ...store,
      researchPoints: currentRP,
      generators: newGenerators,
      activeChallengeRestrictions: activeRestrictions
    }

    let count = maxAffordable(i, tempState)
    if (maxQty !== null && maxQty !== undefined) {
      const remaining = Number(maxQty - gen.quantity)
      count = Math.min(count, remaining)
    }

    if (count <= 0) continue

    const totalCost = costToBuyN(i, count, tempState)
    if (currentRP < totalCost) continue

    currentRP -= totalCost
    anyPurchased = true

    newGenerators[i] = {
      ...gen,
      quantity: gen.quantity + BigInt(count)
    }

    if (
      activeRestrictions?.onlyGeneratorType !== null &&
      activeRestrictions?.onlyGeneratorType !== undefined
    ) {
      activeRestrictions = {
        ...activeRestrictions,
        onlyGeneratorType: i
      }
    }

    const prevQty = gen.quantity
    if (prevQty === 0n && count > 0) {
      dispatchGeneratorUnlock(i)
    }

    const updatedQty = newGenerators[i].quantity
    if (updatedQty >= 500n) awardRelic(11)
    if (i === 4 && updatedQty >= 250n) awardRelic(15)
    if (i === 5 && updatedQty >= 50n) awardRelic(10)
    if (i === 14 && updatedQty >= 50n) awardRelic(12)
    if (i === 13 && updatedQty >= 100n) awardRelic(17)
    if (i === 19 && updatedQty >= 10n) awardRelic(20)
  }

  if (!anyPurchased) return

  useGameStore.setState({
    researchPoints: currentRP,
    generators: newGenerators,
    activeChallengeRestrictions: activeRestrictions
  })

  playSound('purchase')
  markUnlocksDirty()
  markTutorialDirty()
  markAchievementsDirty()
  useGameStore.getState().recalcPPS()
}
