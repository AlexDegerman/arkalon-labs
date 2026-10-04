// Anomalous Operations 90-day cycle definitions

export interface OperationArtifactDefinition {
  id: string
  name: string
  description: string
  cost: number // Operation Points
  effect: string
}

export interface OperationCycleDefinition {
  cycleNumber: number
  name: string
  anomalyType: string // operation anomaly type ID
  visual: string // visual description for UI
  durationDays: number
}

export const OPERATION_ARTIFACTS: OperationArtifactDefinition[] = [
  {
    id: 'empirical_compass',
    name: 'Empirical Compass',
    description:
      'A navigation artifact that accelerates Reality Branch research.',
    cost: 500,
    effect: '-10% Reality Branch study time permanently'
  },
  {
    id: 'chronos_loom',
    name: 'Chronos Loom',
    description: 'A temporal weaving device that extends offline accumulation.',
    cost: 1500,
    effect: 'Offline window max 8h → 12h'
  },
  {
    id: 'anomalous_lens',
    name: 'Anomalous Lens',
    description: 'A reality-warping optic that increases anomaly frequency.',
    cost: 3000,
    effect: '+15% anomaly spawn frequency'
  },
  {
    id: 'arkalon_core_synapse',
    name: 'Arkalon Core Synapse',
    description:
      'A direct neural link amplifying computation-class production.',
    cost: 5000,
    effect: '1.15x computation-class production permanently'
  }
]

export const OPERATION_ARTIFACT_MAP: Record<
  string,
  OperationArtifactDefinition
> = Object.fromEntries(OPERATION_ARTIFACTS.map((a) => [a.id, a]))

// Four 90-day operation cycles that repeat
export const OPERATION_CYCLES: OperationCycleDefinition[] = [
  {
    cycleNumber: 1,
    name: 'Chrono-Freeze Flux',
    anomalyType: 'operation_chrono_freeze',
    visual: 'Ice-blue neon border fractures',
    durationDays: 90
  },
  {
    cycleNumber: 2,
    name: 'Solar Flare Overload',
    anomalyType: 'operation_solar_flare',
    visual: 'Arkalon sphere glows gold',
    durationDays: 90
  },
  {
    cycleNumber: 3,
    name: 'Gravity Sink Collapse',
    anomalyType: 'operation_gravity_sink',
    visual: 'Violet gravity rings contract',
    durationDays: 90
  },
  {
    cycleNumber: 4,
    name: 'Matrix Inversion',
    anomalyType: 'operation_matrix_inversion',
    visual: 'Matrix binary code streams',
    durationDays: 90
  }
]

// Returns the current cycle definition (cycles repeat modulo 4)
export function getCurrentCycle(cycleNumber: number): OperationCycleDefinition {
  const idx = (cycleNumber - 1) % OPERATION_CYCLES.length
  return OPERATION_CYCLES[idx]
}

// Calculates operation points earned from a resolved operation anomaly
// interactionScore: 0.0-1.0
export function calculateOperationPoints(
  anomalyType: string,
  interactionScore: number
): number {
  // Base points per operation anomaly type
  const basePoints: Record<string, number> = {
    operation_chrono_freeze: 50,
    operation_solar_flare: 40,
    operation_gravity_sink: 60,
    operation_matrix_inversion: 45
  }
  const base = basePoints[anomalyType] ?? 30
  return Math.floor(base * interactionScore)
}
