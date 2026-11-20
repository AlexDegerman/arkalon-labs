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
import { OPERATION_ARTIFACTS } from '@/lib/operationDefs'

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
    state.unlocks.excavation &&
    !state.activeChallengeRestrictions?.excavationDisabled
  ) {
    const hasIdleProbe = state.probes.some((p) => p.status === 'idle')
    const canAssembleFirst =
      state.probes.length === 0 &&
      meetsProbeGateRequirements(state) &&
      canBuildProbe(state)
    if (hasIdleProbe || canAssembleFirst) {
      signals.excavation = 'Probe Ready'
    }
  }

  if (state.unlocks.prestige && !state.activeChallengeId) {
    if (canPrestigeTier3(state) && calculateOSGain(state) > 0) {
      signals.prestige = 'Synth Ready'
    } else if (canPrestigeTier2(state) && calculateCFGain(state) > 0) {
      signals.prestige = 'Sever Ready'
    } else if (canPrestigeTier1(state) && calculateARGain(state) > 0) {
      signals.prestige = 'Recalibrate'
    }
  }

  if (state.unlocks.megaprojects && !state.activeMegaprojectId) {
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
    if (canBuyArtifact) signals.operations = 'Artifact Ready'
  }

  return signals
}
