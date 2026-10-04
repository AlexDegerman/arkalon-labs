'use client'

import EnergyCore from './EnergyCore'
import RotatingRing from './RotatingRing'
import HolographicOverlay from './HolographicOverlay'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function PlanckEpochProjector({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48 // base grid: 48x48

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Projection cone - represents the early universe */}
      <polygon
        points={`${cx},${cy - 18 * s} ${cx - 16 * s},${cy + 10 * s} ${cx + 16 * s},${cy + 10 * s}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Epoch layers */}
      {stage >= 2 &&
        [4, 7, 10].map((dist, i) => (
          <line
            key={i}
            x1={cx - dist * 1.6 * s}
            y1={cy - 18 * s + dist * 2.8 * s}
            x2={cx + dist * 1.6 * s}
            y2={cy - 18 * s + dist * 2.8 * s}
            stroke={color}
            strokeWidth={0.75}
            opacity={0.4 - i * 0.05}
          />
        ))}

      {/* Stage 3: Big bang core */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy - 18 * s}
          r={3 * s}
          color={color}
          pulseSpeed="fast"
        />
      )}

      {/* Stage 4: Expansion rings */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={14 * s}
          color={color}
          dashArray={`${5 * s} ${3 * s}`}
          speed="slow"
          opacity={0.35}
        />
      )}

      {/* Stage 5: Physical constants grid */}
      {stage >= 5 && (
        <HolographicOverlay
          x={cx - 14 * s}
          y={cy + 8 * s}
          width={28 * s}
          height={6 * s}
          color={color}
          scanSpeed="slow"
        />
      )}

      {/* Stage 6: Outer expansion boundary */}
      {stage >= 6 && (
        <circle
          cx={cx}
          cy={cy}
          r={21 * s}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          opacity={0.2}
        >
          <animate
            attributeName="r"
            values={`${20 * s};${22 * s};${20 * s}`}
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.4;0.2"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  )
}
