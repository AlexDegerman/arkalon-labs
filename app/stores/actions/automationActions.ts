'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  getRelicSlotCount,
  getRelicUpgradeCost,
  canEquipToSlot,
  isRelicEquipped
} from '@/lib/relicDefs'
import { RELIC_MAP } from '@/constants/relics'
import { RELIC_LEVEL_CAP } from '@/constants/game'
import {
  SYNTHESIZERS,
  getSynthesizerCost,
  isSynthesizerUnlocked
} from '@/lib/synthesizerDefs'
import { meetsMegaprojectRequirements } from '@/lib/megaprojectDefs'
import {
  getNodeCost,
  isNodeAvailable,
  getActiveSlotCount
} from '@/lib/researchNodes'
import { canAfford, nextCost } from '@/lib/generatorCosts'
import { marginalPPS } from '@/lib/productionEngine'
import {
  getModuleUpgradeCost as getModuleUpgradeCostFn,
  getTrackLevelCap as getTrackLevelCapFn
} from '@/lib/moduleDefs'
import {
  AUTO_AUTOMATION_INTERVAL_TICKS,
  AUTO_BUY_BASIC_INTERVAL_TICKS,
  AUTO_BUY_OPTIMAL_INTERVAL_TICKS
} from '@/lib/automationDefs'
import { buyGenerator, buyModule } from './generatorActions'
import { buySynthesizer } from './synthesizerActions'
import { startResearch } from './researchActions'
import { equipRelic, upgradeRelic } from './relicActions'
import { launchProbe } from './excavationActions'
import { isZoneUnlocked } from '@/lib/excavationDefs'
import { activateMegaproject } from './megaprojectActions'
import { markAchievementsDirty } from '@/lib/dirtyFlags'
import { ProbeState, RelicSlotState } from '@/types/game'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { MODULE_SYNERGIES } from '@/constants/generators'

// Automation tick actions

let autoBuyBasicTick = 0
let autoBuyOptimalTick = 0
let autoOtherTick = 0

// Called from tick() every 100ms automation runs on slower intervals
export function tickAutomation(): void {
  const store = useGameStore.getState()
  const auto = store.automation

  // Auto-buy basic & synthesizers: every 5 seconds
  const runFiveSec =
    (auto.autoBuyBasic &&
      store.arUpgrades.auto_buy_basic > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled) ||
    (auto.autoBuySynthesizers &&
      (store.cfUpgrades.auto_buy_synthesizers ?? 0) > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled)

  if (runFiveSec) {
    autoBuyBasicTick++
    if (autoBuyBasicTick >= AUTO_BUY_BASIC_INTERVAL_TICKS) {
      autoBuyBasicTick = 0
      if (auto.autoBuyBasic && store.arUpgrades.auto_buy_basic > 0) {
        runAutoBuyBasic(store)
      }
      if (
        auto.autoBuySynthesizers &&
        (store.cfUpgrades.auto_buy_synthesizers ?? 0) > 0
      ) {
        runAutoBuySynthesizers(useGameStore.getState())
      }
    }
  } else {
    autoBuyBasicTick = 0
  }

  // Auto-buy optimal: every 2 seconds - buy highest marginal PPS generator
  if (auto.autoBuyOptimal) {
    autoBuyOptimalTick++
    if (autoBuyOptimalTick >= AUTO_BUY_OPTIMAL_INTERVAL_TICKS) {
      autoBuyOptimalTick = 0
      runAutoBuyOptimal(store)
    }
  } else {
    autoBuyOptimalTick = 0
  }

  // Other automation: every 1 second
  autoOtherTick++
  if (autoOtherTick >= AUTO_AUTOMATION_INTERVAL_TICKS) {
    autoOtherTick = 0

    markAchievementsDirty()

    if (
      auto.autoResearchQueue &&
      store.arUpgrades.auto_research_queue > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled
    ) {
      runAutoResearch(store)
    }
    if (auto.autoEquipRelic) runAutoEquipRelic(store)
    if (
      auto.autoUpgradeRelics &&
      store.cfUpgrades.auto_upgrade_relics > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled
    ) {
      runAutoUpgradeRelics(store)
    }
    if (auto.autoLaunchProbe) runAutoLaunchProbe(store)
    if (
      auto.autoDysonSwarm &&
      store.osUpgrades.auto_dyson_swarm > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled
    ) {
      runAutoDysonSwarm(store)
    }
    if (
      auto.autoModuleBuy &&
      store.cfUpgrades.auto_module_buyer > 0 &&
      !store.activeChallengeRestrictions?.prestigeUpgradesDisabled
    )
      runAutoModuleBuy(store)
  }
}

// Buys the cheapest affordable generator
function runAutoBuyBasic(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.prestigeUpgradesDisabled) return
  let cheapestIndex = -1
  let cheapestCost = store.researchPoints + 1n
  const onlyGen = store.activeChallengeRestrictions?.onlyGeneratorType
  const maxQty = store.activeChallengeRestrictions?.maxGeneratorQuantity
  for (let i = 0; i < 20; i++) {
    // Respect challenge tier, type, and quantity limits
    if (onlyGen !== null && onlyGen !== undefined && i !== onlyGen) continue
    const maxTier = store.activeChallengeRestrictions?.maxGeneratorTier
    if (maxTier !== null && maxTier !== undefined && i >= maxTier) continue
    if (
      maxQty !== null &&
      maxQty !== undefined &&
      store.generators[i].quantity >= maxQty
    )
      continue
    const cost = nextCost(i, store)
    if (cost <= store.researchPoints && cost < cheapestCost) {
      cheapestCost = cost
      cheapestIndex = i
    }
  }
  if (cheapestIndex !== -1) {
    buyGenerator(cheapestIndex, 1, true)
  }
}

// Buys the cheapest affordable unlocked synthesizer
function runAutoBuySynthesizers(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.prestigeUpgradesDisabled) return
  let cheapestIndex = -1
  let cheapestCost = store.researchPoints + 1n
  for (let i = 0; i < SYNTHESIZERS.length; i++) {
    if (!isSynthesizerUnlocked(i, store)) continue
    const cost = getSynthesizerCost(i, store.synthesizers?.[i] ?? 0)
    if (cost <= store.researchPoints && cost < cheapestCost) {
      cheapestCost = cost
      cheapestIndex = i
    }
  }
  if (cheapestIndex !== -1) {
    buySynthesizer(cheapestIndex, 1)
  }
}

// Buys the generator with highest marginal PPS per RP, respecting reserve floor
function runAutoBuyOptimal(
  store: ReturnType<typeof useGameStore.getState>
): void {
  const reservePct = Math.max(
    0,
    Math.min(90, store.autoBuyOptimalReservePercent ?? 0)
  )
  const spendableRP = (store.researchPoints * BigInt(100 - reservePct)) / 100n
  let bestIndex = -1
  let bestMarginal = 0n
  let bestCost = 1n
  const onlyGen = store.activeChallengeRestrictions?.onlyGeneratorType
  const maxQty = store.activeChallengeRestrictions?.maxGeneratorQuantity
  for (let i = 0; i < 20; i++) {
    if (onlyGen !== null && onlyGen !== undefined && i !== onlyGen) continue
    const maxTier = store.activeChallengeRestrictions?.maxGeneratorTier
    if (maxTier !== null && maxTier !== undefined && i >= maxTier) continue
    if (
      maxQty !== null &&
      maxQty !== undefined &&
      store.generators[i].quantity >= maxQty
    )
      continue
    if (!canAfford(i, store)) continue
    const cost = nextCost(i, store)
    if (cost <= 0n || cost > spendableRP) continue
    const marginal = marginalPPS(i, store)
    if (marginal <= 0n) continue
    if (bestIndex === -1 || marginal * bestCost > bestMarginal * cost) {
      bestIndex = i
      bestMarginal = marginal
      bestCost = cost
    }
  }
  if (bestIndex !== -1) {
    buyGenerator(bestIndex, 1, true)
  }
}

// Auto-starts the next queued research if a slot is free and node is affordable
function runAutoResearch(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.prestigeUpgradesDisabled) return
  if (!store.unlocks.techMatrix) return
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return

  const slotCount = getActiveSlotCount(store)
  const visibleSlots = store.activeResearchSlots.slice(0, slotCount)
  const emptySlot = visibleSlots.findIndex((s) => !s.nodeId)
  if (emptySlot === -1) return
  if (store.researchQueue.length === 0) return

  const activeBranches = new Set(
    visibleSlots
      .filter((s) => s.nodeId !== null)
      .map((s) => RESEARCH_NODE_MAP[s.nodeId!]?.branch)
      .filter(Boolean)
  )

  for (const candidateId of store.researchQueue) {
    const candidateNode = RESEARCH_NODE_MAP[candidateId]
    if (!candidateNode) continue
    if (activeBranches.has(candidateNode.branch)) continue
    if (!isNodeAvailable(candidateId, store)) continue

    const cost = getNodeCost(candidateId, store)
    if (store.researchPoints >= cost) {
      startResearch(candidateId, true)
      return
    }
  }
}

// Auto-equips highest-level available relic to empty slots
function runAutoEquipRelic(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.relicsDisabled) return
  if (!store.unlocks.relics) return

  const slotCount = getRelicSlotCount(store)

  // Find empty slots
  const emptySlotIndices = store.relicSlots
    .slice(0, slotCount)
    .map((slot: RelicSlotState, i: number) => ({ slot, i }))
    .filter(({ slot }: { slot: RelicSlotState }) => canEquipToSlot(slot))
    .map(({ i }: { i: number }) => i)

  if (emptySlotIndices.length === 0) return

  // Find highest-level unequipped relic
  const unequipped = store.unlockedRelics
    .filter(
      (id: number) =>
        !isRelicEquipped(id, store) && (store.relicLevels[id] ?? 0) > 0
    )
    .sort(
      (a: number, b: number) =>
        (store.relicLevels[b] ?? 0) - (store.relicLevels[a] ?? 0)
    )

  if (unequipped.length === 0) return

  equipRelic(unequipped[0], true)
}

// Auto-launches idle probes to the player's selected sector
function runAutoLaunchProbe(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.excavationDisabled) return
  if (!store.unlocks.excavation) return

  const desired = store.autoLaunchZone ?? 'safe'
  const zone = isZoneUnlocked(desired, store) ? desired : 'safe'
  const idleProbes = store.probes.filter((p: ProbeState) => p.status === 'idle')
  for (const probe of idleProbes) {
    launchProbe(probe.id, zone, probe.subsystem ?? 'none', true)
  }
}

// Auto-buys cheapest affordable module upgrade
function runAutoModuleBuy(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.prestigeUpgradesDisabled) return
  if (store.activeChallengeRestrictions?.modulesDisabled) return
  if (!store.unlocks.modules) return

  const types = ['efficiency', 'cost_reduction', 'synergy'] as const

  let cheapestCost = store.researchPoints + 1n
  let cheapestAction: (() => void) | null = null

  for (let i = 0; i < 20; i++) {
    const gen = store.generators[i]
    if (!gen || gen.quantity === 0n) continue

    for (const type of types) {
      if (type === 'synergy') {
        const syn = MODULE_SYNERGIES.find((s) => s.sourceIndex === i)
        if (syn && (store.generators[syn.targetIndex]?.quantity ?? 0n) === 0n) {
          continue
        }
      }

      const cap = getTrackLevelCapFn(i, type, store)
      const currentLevel =
        type === 'efficiency'
          ? gen.efficiencyLevel
          : type === 'cost_reduction'
            ? gen.costReductionLevel
            : gen.synergyLevel

      if (currentLevel >= cap) continue

      const sc4Tiers = store.challengeRecords['SC4']?.completedTiers ?? 0
      const cost = BigInt(
        getModuleUpgradeCostFn(i, type, currentLevel, sc4Tiers)
      )
      if (cost <= store.researchPoints && cost < cheapestCost) {
        cheapestCost = cost
        const capturedI = i
        const capturedType = type
        const capturedLevel = currentLevel
        cheapestAction = () =>
          buyModule(capturedI, capturedType, capturedLevel, true)
      }
    }
  }

  if (cheapestAction) cheapestAction()
}

// Upgrades the cheapest unlocked relic below target level cap
function runAutoUpgradeRelics(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.relicsDisabled) return
  if (!store.unlocks.relics) return

  const targetCap = Math.max(1, Math.min(100, store.autoRelicTargetLevel ?? 20))
  const dustReserve = Math.max(0, store.autoRelicDustReserve ?? 25)
  const spendableDust = Math.max(0, store.artifactDust - dustReserve)
  if (spendableDust <= 0) return

  let cheapestId = -1
  let cheapestCost = spendableDust + 1

  for (const relicId of store.unlockedRelics) {
    const maxLevel = Math.min(
      targetCap,
      RELIC_MAP[relicId]?.maxLevel ?? RELIC_LEVEL_CAP
    )
    const currentLevel = store.relicLevels[relicId] ?? 0
    if (currentLevel >= maxLevel) continue
    const cost = getRelicUpgradeCost(relicId, currentLevel)
    if (cost > 0 && cost <= spendableDust && cost < cheapestCost) {
      cheapestCost = cost
      cheapestId = relicId
    }
  }

  if (cheapestId !== -1) {
    upgradeRelic(cheapestId, 1)
  }
}

// Automatically starts Arkalon Dyson Swarm whenever megaproject bay is idle
function runAutoDysonSwarm(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeId || store.activeMegaprojectId) return
  if (!store.unlocks.megaprojects) return
  if (meetsMegaprojectRequirements('dyson_swarm', store)) {
    activateMegaproject('dyson_swarm')
  }
}
