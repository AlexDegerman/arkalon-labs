import { formatPointsCompact } from '@/lib/format'
import type { FeatureKey } from '@/lib/featureRegistry'

// Minimal state slice needed for unlock progress lines
export interface ProgressState {
  lifetimePoints: bigint
  generators: Array<{ quantity: bigint }>
  completedResearchNodes: string[]
  achievementsCount?: number
  stats: {
    totalSessionPlaytime: number
    totalAnomaliesResolved: number
    totalPrestigesTier1: number
  }
}

export interface FeatureProgress {
  label: string
  fraction: number
}

function ratio(current: bigint, target: bigint): number {
  if (target <= 0n) return 1
  if (current >= target) return 1
  return Math.min(1, Number((current * 10000n) / target) / 10000)
}

// Compact "current/target" label + 0-1 fraction for locked feature cards
export function getFeatureProgress(
  key: FeatureKey,
  state: ProgressState
): FeatureProgress | null {
  const rp = formatPointsCompact(state.lifetimePoints)
  switch (key) {
    case 'techMatrix':
      return {
        label: `${state.generators[0].quantity}/10 Desks`,
        fraction: ratio(state.generators[0].quantity, 10n)
      }
    case 'statistics':
      return {
        label: `${rp}/${formatPointsCompact(5_000n)} RP`,
        fraction: ratio(state.lifetimePoints, 5_000n)
      }
    case 'modules':
      return {
        label: `${state.generators[1].quantity}/10 Server Clusters`,
        fraction: ratio(state.generators[1].quantity, 10n)
      }
    case 'anomalies': {
      const nodes = state.completedResearchNodes.filter(
        (id) => !id.includes('_INF')
      ).length
      return {
        label: `${Math.min(2, nodes)}/2 Research Nodes`,
        fraction: Math.min(1, nodes / 2)
      }
    }
    case 'achievements': {
      const minutes = Math.floor(state.stats.totalSessionPlaytime / 60)
      const timeFrac = Math.min(1, minutes / 5)
      const achCount = state.achievementsCount ?? 0
      const achFrac = Math.min(1, achCount / 3)
      if (achFrac >= timeFrac) {
        return {
          label: `${achCount}/3 Achievements`,
          fraction: achFrac
        }
      }
      return {
        label: `${minutes}/5 min played`,
        fraction: timeFrac
      }
    }
    case 'relics': {
      const o1Done = state.completedResearchNodes.includes('O1') ? 1 : 0
      const anomalies = state.stats.totalAnomaliesResolved
      return {
        label: o1Done ? 'Node O1 Complete' : `${anomalies}/1 Anomaly`,
        fraction: Math.max(o1Done, Math.min(1, anomalies))
      }
    }
    case 'excavation': {
      const clusters = state.generators[1].quantity
      const quantums = state.generators[2].quantity
      return {
        label: `${clusters}/25 Clusters · ${quantums}/10 Quantum`,
        fraction: Math.min(ratio(clusters, 25n), ratio(quantums, 10n))
      }
    }
    case 'prestige':
      if (state.lifetimePoints < 100_000n) {
        return {
          label: `Requires ${formatPointsCompact(1_000_000_000n)} RP`,
          fraction: 0
        }
      }
      return {
        label: `${rp}/${formatPointsCompact(1_000_000_000n)} RP`,
        fraction: ratio(state.lifetimePoints, 1_000_000_000n)
      }
    case 'megaprojects': {
      const engines = state.generators[4].quantity
      if (state.lifetimePoints < 1_000_000_000n) {
        return {
          label: `Requires ${formatPointsCompact(1_000_000_000_000n)} RP · ${engines}/10 Engines`,
          fraction: 0
        }
      }
      return {
        label: `${rp}/${formatPointsCompact(1_000_000_000_000n)} RP · ${engines}/10 Engines`,
        fraction: Math.min(
          ratio(state.lifetimePoints, 1_000_000_000_000n),
          ratio(engines, 10n)
        )
      }
    }
    case 'anomalousOperations':
    case 'challenges':
      return {
        label: `${state.stats.totalPrestigesTier1}/1 Recalibration`,
        fraction: Math.min(1, state.stats.totalPrestigesTier1)
      }
    default:
      return null
  }
}
