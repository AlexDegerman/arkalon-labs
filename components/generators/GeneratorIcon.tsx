'use client'

import { lazy, Suspense } from 'react'
import { getGeneratorTierColor } from '@/hooks/useGeneratorStage'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  generatorIndex: number
  stage: GeneratorStage
  size?: number
  glowColor?: string
}

// Lazy-load each generator SVG to keep the initial bundle lean
const GENERATOR_COMPONENTS = [
  lazy(() => import('./svg/ResearchDesk')),
  lazy(() => import('./svg/ServerCluster')),
  lazy(() => import('./svg/QuantumComputer')),
  lazy(() => import('./svg/NeuralCore')),
  lazy(() => import('./svg/RealityEngine')),
  lazy(() => import('./svg/SingularityReactor')),
  lazy(() => import('./svg/ArkalonInterface')),
  lazy(() => import('./svg/InfiniteSimulation')),
  lazy(() => import('./svg/UniversalConstructor')),
  lazy(() => import('./svg/ExistenceCompiler')),
  lazy(() => import('./svg/DimensionalFolder')),
  lazy(() => import('./svg/ChronosSynchronizer')),
  lazy(() => import('./svg/VacuumFluctuator')),
  lazy(() => import('./svg/DarkMatterSynthesizer')),
  lazy(() => import('./svg/StellarHarvester')),
  lazy(() => import('./svg/GalacticEngine')),
  lazy(() => import('./svg/MultiversalConduit')),
  lazy(() => import('./svg/PlanckEpochProjector')),
  lazy(() => import('./svg/ChaosWeaver')),
  lazy(() => import('./svg/AbsoluteVoidCompressor'))
]

// Minimal fallback shown during lazy load
function FallbackIcon({ color, size }: { color: string; size: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.32
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.5}
      />
    </svg>
  )
}

export default function GeneratorIcon({
  generatorIndex,
  stage,
  size = 48,
  glowColor
}: Props) {
  const color = glowColor ?? getGeneratorTierColor(generatorIndex)
  const GeneratorSVG = GENERATOR_COMPONENTS[generatorIndex]

  if (!GeneratorSVG) {
    return <FallbackIcon color={color} size={size} />
  }

  return (
    <div
      style={{ width: size, height: size, flexShrink: 0, overflow: 'visible' }}
    >
      <Suspense fallback={<FallbackIcon color={color} size={size} />}>
        <GeneratorSVG stage={stage} color={color} size={size} />
      </Suspense>
    </div>
  )
}
