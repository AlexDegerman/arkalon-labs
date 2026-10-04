'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function QuantumComputer({ stage, color, size }: Props) {
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
      {/* Stage 1: Outer hexagon */}
      <polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return `${cx + 16 * s * Math.cos(a)},${cy + 16 * s * Math.sin(a)}`
        }).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Inner hexagon */}
      {stage >= 2 && (
        <polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 6
            return `${cx + 9 * s * Math.cos(a)},${cy + 9 * s * Math.sin(a)}`
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
      )}

      {/* Stage 3: Energy core */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy}
          r={4 * s}
          color={color}
          pulseSpeed="medium"
        />
      )}

      {/* Stage 4: Rotating ring */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={13 * s}
          color={color}
          dashArray={`${4 * s} ${2 * s}`}
          speed="medium"
        />
      )}

      {/* Stage 5: Counter-rotating ring */}
      {stage >= 5 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={11 * s}
          color={color}
          dashArray={`${2 * s} ${3 * s}`}
          speed="slow"
          direction="ccw"
          opacity={0.5}
        />
      )}

      {/* Stage 6: Corner dots */}
      {stage >= 6 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i
          return (
            <circle
              key={i}
              cx={cx + 18 * s * Math.cos(a)}
              cy={cy + 18 * s * Math.sin(a)}
              r={1.5 * s}
              fill={color}
              opacity={0.7}
            />
          )
        })}
    </svg>
  )
}
