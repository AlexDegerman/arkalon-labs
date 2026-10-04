'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import HolographicOverlay from './HolographicOverlay'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function RealityEngine({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Diamond chassis */}
      <polygon
        points={`${cx},${cy - 18 * s} ${cx + 14 * s},${cy} ${cx},${cy + 18 * s} ${cx - 14 * s},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Inner diamond */}
      {stage >= 2 && (
        <polygon
          points={`${cx},${cy - 10 * s} ${cx + 8 * s},${cy} ${cx},${cy + 10 * s} ${cx - 8 * s},${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
      )}

      {/* Stage 3: Energy core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Rotating outer ring */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={20 * s}
          color={color}
          dashArray={`${3 * s} ${4 * s}`}
          speed="slow"
          opacity={0.5}
        />
      )}

      {/* Stage 5: Holographic overlay on top quadrant */}
      {stage >= 5 && (
        <HolographicOverlay
          x={cx - 10 * s}
          y={cy - 18 * s}
          width={20 * s}
          height={8 * s}
          color={color}
          scanSpeed="medium"
        />
      )}

      {/* Stage 6: Corner indicators */}
      {stage >= 6 &&
        [0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180
          return (
            <circle
              key={angle}
              cx={cx + 18 * s * Math.cos(rad)}
              cy={cy + 18 * s * Math.sin(rad)}
              r={2 * s}
              fill={color}
              opacity={0.7}
            >
              <animate
                attributeName="opacity"
                values="0.7;0.2;0.7"
                dur="2s"
                begin={`${(angle / 90) * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}
    </svg>
  )
}
