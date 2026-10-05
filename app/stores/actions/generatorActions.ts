'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  canAfford,
  costToBuyN,
  maxAffordable,
  nextCost
} from '@/lib/generatorCosts'
import {
  getModuleUpgradeCost as getModuleUpgradeCostFn,
  getModuleLevelCap as getModuleLevelCapFn
} from '@/lib/moduleDefs'
import { markUnlocksDirty, markTutorialDirty } from '@/lib/dirtyFlags'
import { dispatchGeneratorUnlock } from '@/lib/dialogueDispatcher'
import type { ModuleType } from '@/types/game'
import type { BulkBuyAmount } from '@/constants/game'

// Module purchase action
export function buyModule(
  generatorIndex: number,
  moduleType: ModuleType,
  currentLevel: number
): void {
  const store = useGameStore.getState()
  // SC4, EC1, EC4: modules disabled
  if (store.activeChallengeRestrictions?.modulesDisabled) return
  const cap = getModuleLevelCapFn(store)
  if (currentLevel >= cap) return
  const cost = getModuleUpgradeCostFn(generatorIndex, moduleType, currentLevel)
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

  // Modules affect production
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

// Generator purchase action
// amount: 1 | 10 | 100 | 'max'
export function buyGenerator(
  generatorIndex: number,
  amount: BulkBuyAmount
): void {
  const store = useGameStore.getState()
  const gen = store.generators[generatorIndex]
  if (!gen) return

  // Determine actual count to buy
  let count: number
  if (amount === 'max') {
    count = maxAffordable(generatorIndex, store)
  } else {
    count = amount
  }

  if (count <= 0) return

  const totalCost = costToBuyN(generatorIndex, count, store)
  if (store.researchPoints < totalCost) return

  const newGenerators = store.generators.map((g, i) => {
    if (i !== generatorIndex) return g
    return { ...g, quantity: g.quantity + BigInt(count) }
  })

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - totalCost,
    generators: newGenerators
  }))

  markUnlocksDirty()
  markTutorialDirty()

  // Fire dialogue on first purchase of each generator type
  const prevQty = store.generators[generatorIndex]?.quantity ?? 0n
  if (prevQty === 0n && count > 0) {
    dispatchGeneratorUnlock(generatorIndex)
  }

  // Recalculate PPS since generator quantities changed
  useGameStore.getState().recalcPPS()
}
