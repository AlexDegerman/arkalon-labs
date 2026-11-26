import type { GameState, OperationArtifactId } from '@/types/game'
import type { WorkspaceTab } from '@/hooks/useActiveTab'
import { RESEARCH_NODES } from '@/constants/research'
import {
  getActiveSlotCount,
  getNodeCost,
  isNodeActive,
  isNodeAvailable,
  isNodeCompleted,
  isNodeQueued
} from '@/lib/researchNodes'
import {
  canEquipToSlot,
  getRelicSlotCount,
  isRelicEquipped
} from '@/lib/relicDefs'
import { canBuildProbe, meetsProbeGateRequirements } from '@/lib/excavationDefs'
import {
  calculateARGain,
  calculateCFGain,
  calculateOSGain,
  canPrestigeTier1,
  canPrestigeTier2,
  canPrestigeTier3
} from '@/lib/prestigeCalc'
import {
  MEGAPROJECTS,
  meetsMegaprojectRequirements
} from '@/lib/megaprojectDefs'
import {
  OPERATION_ARTIFACTS,
  getAttunementCost,
  getTemporalCost
} from '@/lib/operationDefs'
import { getModuleUpgradeCost, getTrackLevelCap } from '@/lib/moduleDefs'
import {
  AR_UPGRADES,
  CF_UPGRADES,
  OS_UPGRADES,
  getUpgradeCost
} from '@/lib/prestigeUpgradeDefs'

export type ActionSignalMap = Partial<Record<WorkspaceTab, string>>

export function getWorkspaceActionSignals(state: GameState): ActionSignalMap {
  const signals: ActionSignalMap = {}

  if (
    state.unlocks.techMatrix &&
    !state.activeChallengeRestrictions?.techMatrixDisabled
  ) {
    const slotCount = getActiveSlotCount(state)
    const hasEmptySlot = state.activeResearchSlots
      .slice(0, slotCount)
      .some((s) => !s.nodeId)
    if (hasEmptySlot) {
      const canStudy = RESEARCH_NODES.some(
        (n) =>
          !n.isInfinite &&
          isNodeAvailable(n.id, state) &&
          !isNodeCompleted(n.id, state) &&
          !isNodeActive(n.id, state) &&
          !isNodeQueued(n.id, state) &&
          state.researchPoints >= getNodeCost(n.id, state)
      )
      if (canStudy) signals.research = 'Study Ready'
    }
  }

  if (
    state.unlocks.relics &&
    !state.activeChallengeRestrictions?.relicsDisabled
  ) {
    const slotCount = getRelicSlotCount(state)
    const hasOpenSlot = state.relicSlots
      .slice(0, slotCount)
      .some((s) => canEquipToSlot(s))
    if (hasOpenSlot) {
      const hasUnequipped = state.unlockedRelics.some(
        (id) => (state.relicLevels[id] ?? 0) > 0 && !isRelicEquipped(id, state)
      )
      if (hasUnequipped) signals.relics = 'Relic Ready'
    }
  }

  if (
    state.unlocks.modules &&
    !state.activeChallengeRestrictions?.modulesDisabled &&
    !(state.automation.autoModuleBuy && state.cfUpgrades.auto_module_buyer > 0)
  ) {
    const sc4Tiers = state.challengeRecords['SC4']?.completedTiers ?? 0
    const types = ['efficiency', 'cost_reduction', 'synergy'] as const
    let canUpgradeModule = false
    for (let i = 0; i < 20 && !canUpgradeModule; i++) {
      const gen = state.generators[i]
      if (!gen || gen.quantity === 0n) continue
      for (const type of types) {
        const cap = getTrackLevelCap(i, type, state)
        const lvl =
          type === 'efficiency'
            ? gen.efficiencyLevel
            : type === 'cost_reduction'
              ? gen.costReductionLevel
              : gen.synergyLevel
        if (lvl >= cap) continue
        if (
          state.researchPoints >= getModuleUpgradeCost(i, type, lvl, sc4Tiers)
        ) {
          canUpgradeModule = true
          break
        }
      }
    }
    if (canUpgradeModule) signals.modules = 'Upgrade Ready'
  }

  if (
    state.unlocks.excavation &&
    !state.activeChallengeRestrictions?.excavationDisabled
  ) {
    const autoLaunchOn =
      state.automation.autoLaunchProbe &&
      (state.challengeRecords['SC12']?.completedTiers ?? 0) >= 3
    const hasIdleProbe =
      !autoLaunchOn && state.probes.some((p) => p.status === 'idle')
    const canAssembleProbe =
      meetsProbeGateRequirements(state) && canBuildProbe(state)
    if (hasIdleProbe || canAssembleProbe) {
      signals.excavation = 'Probe Ready'
    }
  }

  if (state.unlocks.prestige && !state.activeChallengeId) {
    if (canPrestigeTier3(state) && calculateOSGain(state) > 0) {
      signals.prestige = 'Synth Ready'
    } else if (canPrestigeTier2(state) && calculateCFGain(state) > 0) {
      signals.prestige = 'Sever Ready'
    } else {
      const arGain = canPrestigeTier1(state) ? calculateARGain(state) : 0
      const meaningfulT1 =
        arGain > 0 &&
        (state.stats.totalPrestigesTier1 === 0 ||
          arGain >= Math.max(10, Math.floor(state.arkalonResonance * 0.5)))
      if (meaningfulT1) {
        signals.prestige = 'Recalibrate'
      } else if (!state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
        const canBuyAR = AR_UPGRADES.some((u) => {
          const lvl = state.arUpgrades[u.id] ?? 0
          return (
            lvl < u.maxLevel && state.arkalonResonance >= getUpgradeCost(u, lvl)
          )
        })
        const canBuyCF =
          state.stats.totalPrestigesTier2 > 0 &&
          CF_UPGRADES.some((u) => {
            const lvl = state.cfUpgrades[u.id] ?? 0
            return (
              lvl < u.maxLevel &&
              state.chronalFractures >= getUpgradeCost(u, lvl)
            )
          })
        const canBuyOS =
          state.stats.totalPrestigesTier3 > 0 &&
          OS_UPGRADES.some((u) => {
            if (
              u.id === 'automated_timeline_severance' &&
              state.osUpgrades.the_automated_lab <= 0
            ) {
              return false
            }
            if (
              u.id === 'automated_singular_synthesis' &&
              state.osUpgrades.automated_timeline_severance <= 0
            ) {
              return false
            }
            const lvl = state.osUpgrades[u.id] ?? 0
            return lvl < u.maxLevel && state.omniSpars >= getUpgradeCost(u, lvl)
          })
        if (canBuyAR || canBuyCF || canBuyOS) {
          signals.prestige = 'Perk Ready'
        }
      }
    }
  }

  if (
    state.unlocks.megaprojects &&
    !state.activeChallengeId &&
    !state.activeMegaprojectId
  ) {
    const canBuildMega = MEGAPROJECTS.some((m) =>
      meetsMegaprojectRequirements(m.id, state)
    )
    if (canBuildMega) signals.megaprojects = 'Build Ready'
  }

  if (state.unlocks.anomalousOperations) {
    const canBuyArtifact = OPERATION_ARTIFACTS.some(
      (a) =>
        !state.operationArtifactsUnlocked.includes(
          a.id as OperationArtifactId
        ) && state.currentOperationPoints >= a.cost
    )
    if (canBuyArtifact) {
      signals.operations = 'Artifact Ready'
    } else {
      const attCost = getAttunementCost(state.cosmicAttunementLevel ?? 0)
      const tempCost = getTemporalCost(state.cosmicTemporalLevel ?? 0)
      if (
        state.currentOperationPoints >= attCost ||
        (tempCost > 0 && state.currentOperationPoints >= tempCost)
      ) {
        signals.operations = 'Sink Ready'
      }
    }
  }

  return signals
}
