'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  ANOMALY_DEFINITIONS,
  OPERATION_ANOMALY_DEFINITIONS,
  getEffectiveDuration
} from '@/lib/anomalyDefs'
import {
  getRelicSlotCount,
  canEquipToSlot,
  isRelicEquipped
} from '@/lib/relicDefs'
import { getNodeCost } from '@/lib/researchNodes'
import { canAfford, nextCost } from '@/lib/generatorCosts'
import { marginalPPS } from '@/lib/productionEngine'
import {
  getModuleUpgradeCost as getModuleUpgradeCostFn,
  getModuleLevelCap as getModuleLevelCapFn
} from '@/lib/moduleDefs'
import {
  AUTO_AUTOMATION_INTERVAL_TICKS,
  AUTO_BUY_BASIC_INTERVAL_TICKS,
  AUTO_BUY_OPTIMAL_INTERVAL_TICKS
} from '@/lib/automationDefs'
import { buyGenerator, buyModule } from './generatorActions'
import { startResearch } from './researchActions'
import { resolveAnomaly } from './anomalyActions'
import { equipRelic } from './relicActions'
import { launchProbe } from './excavationActions'

// Automation tick actions

let autoBuyBasicTick = 0
let autoBuyOptimalTick = 0
let autoOtherTick = 0

// Called from tick() every 100ms automation runs on slower intervals
export function tickAutomation(): void {
  const store = useGameStore.getState()
  const auto = store.automation

  // Auto-buy basic: every 5 seconds - buy cheapest affordable generator
  if (auto.autoBuyBasic) {
    autoBuyBasicTick++
    if (autoBuyBasicTick >= AUTO_BUY_BASIC_INTERVAL_TICKS) {
      autoBuyBasicTick = 0
      runAutoBuyBasic(store)
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

    if (auto.autoResearchQueue) runAutoResearch(store)
    if (auto.autoStabilizeAnomaly) runAutoStabilize(store)
    if (auto.autoEquipRelic) runAutoEquipRelic(store)
    if (auto.autoLaunchProbe) runAutoLaunchProbe(store)
    if (auto.autoModuleBuy) runAutoModuleBuy(store)
  }
}

// Buys the cheapest affordable generator
function runAutoBuyBasic(
  store: ReturnType<typeof useGameStore.getState>
): void {
  let cheapestIndex = -1
  let cheapestCost = store.researchPoints + 1n
  for (let i = 0; i < 20; i++) {
    // Respect challenge tier limits
    const maxTier = store.activeChallengeRestrictions?.maxGeneratorTier
    if (maxTier !== null && maxTier !== undefined && i >= maxTier) continue
    const cost = nextCost(i, store)
    if (cost <= store.researchPoints && cost < cheapestCost) {
      cheapestCost = cost
      cheapestIndex = i
    }
  }
  if (cheapestIndex !== -1) {
    buyGenerator(cheapestIndex, 1)
  }
}

// Buys the generator with highest marginal PPS per RP
function runAutoBuyOptimal(
  store: ReturnType<typeof useGameStore.getState>
): void {
  let bestIndex = -1
  let bestEfficiency = -1
  for (let i = 0; i < 20; i++) {
    const maxTier = store.activeChallengeRestrictions?.maxGeneratorTier
    if (maxTier !== null && maxTier !== undefined && i >= maxTier) continue
    if (!canAfford(i, store)) continue
    const cost = nextCost(i, store)
    if (cost <= 0n) continue
    const marginal = marginalPPS(i, store)
    const efficiency = Number(marginal) / Number(cost)
    if (efficiency > bestEfficiency) {
      bestEfficiency = efficiency
      bestIndex = i
    }
  }
  if (bestIndex !== -1) {
    buyGenerator(bestIndex, 1)
  }
}

// Auto-starts the next queued research if a slot is free and node is affordable
function runAutoResearch(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (!store.unlocks.techMatrix) return
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return

  const emptySlot = store.activeResearchSlots.findIndex((s) => !s.nodeId)
  if (emptySlot === -1) return
  if (store.researchQueue.length === 0) return

  const nextNodeId = store.researchQueue[0]
  const cost = getNodeCost(nextNodeId, store)
  if (store.researchPoints >= cost) {
    startResearch(nextNodeId)
  }
}

function runAutoStabilize(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (!store.activeAnomalyType) return
  // Only trigger if anomaly has been active for at least 3 seconds
  // (avoid immediately resolving newly spawned anomalies)
  const allDefs = [...ANOMALY_DEFINITIONS, ...OPERATION_ANOMALY_DEFINITIONS]
  const def = allDefs.find((d) => d.type === store.activeAnomalyType)
  if (!def) return
  const elapsed = getEffectiveDuration(def, store) - store.anomalyTimeRemaining
  if (elapsed < 3) return
  resolveAnomaly(0.5)
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
    .map((s: any, i: number) => ({ slot: s, i }))
    .filter(({ slot }: any) => canEquipToSlot(slot))
    .map(({ i }: any) => i)

  if (emptySlotIndices.length === 0) return

  // Find highest-level unequipped relic
  const unequipped = store.unlockedRelics
    .filter((id: number) => !isRelicEquipped(id, store))
    .sort(
      (a: number, b: number) =>
        (store.relicLevels[b] ?? 0) - (store.relicLevels[a] ?? 0)
    )

  if (unequipped.length === 0) return

  equipRelic(unequipped[0])
}

// Auto-launches idle probes to safe sectors
function runAutoLaunchProbe(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (!store.unlocks.excavation) return

  const idleProbes = store.probes.filter((p: any) => p.status === 'idle')
  for (const probe of idleProbes) {
    launchProbe(probe.id, 'safe')
  }
}

// Auto-buys cheapest affordable module upgrade
function runAutoModuleBuy(
  store: ReturnType<typeof useGameStore.getState>
): void {
  if (store.activeChallengeRestrictions?.modulesDisabled) return
  if (!store.unlocks.modules) return

  const cap = getModuleLevelCapFn(store)
  const types = ['efficiency', 'cost_reduction', 'synergy'] as const

  let cheapestCost = store.researchPoints + 1n
  let cheapestAction: (() => void) | null = null

  for (let i = 0; i < 20; i++) {
    const gen = store.generators[i]
    if (!gen || gen.quantity === 0n) continue

    for (const type of types) {
      const currentLevel =
        type === 'efficiency'
          ? gen.efficiencyLevel
          : type === 'cost_reduction'
            ? gen.costReductionLevel
            : gen.synergyLevel

      if (currentLevel >= cap) continue

      const cost = BigInt(getModuleUpgradeCostFn(i, type, currentLevel))
      if (cost <= store.researchPoints && cost < cheapestCost) {
        cheapestCost = cost
        const capturedI = i
        const capturedType = type
        const capturedLevel = currentLevel
        cheapestAction = () => buyModule(capturedI, capturedType, capturedLevel)
      }
    }
  }

  if (cheapestAction) cheapestAction()
}
