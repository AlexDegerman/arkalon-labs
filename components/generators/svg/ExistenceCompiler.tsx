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

export default function ExistenceCompiler({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48

  // Binary-like vertical lines representing data being compiled
  const dataLines = Array.from({ length: 7 }, (_, i) => cx - 12 * s + i * 4 * s)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Compilation frame */}
      <rect
        x={cx - 16 * s}
        y={cy - 16 * s}
        width={32 * s}
        height={32 * s}
        rx={2 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
      />

      {/* Stage 2: Data stream lines */}
      {stage >= 2 &&
        dataLines.map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={cy - 12 * s}
            x2={x}
            y2={cy + 12 * s}
            stroke={color}
            strokeWidth={0.75}
            opacity={0.4}
          >
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur={`${0.8 + i * 0.15}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

      {/* Stage 3: Core compiler */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={5 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Output ring */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={13 * s}
          color={color}
          dashArray={`${2 * s} ${2 * s}`}
          speed="medium"
          opacity={0.5}
        />
      )}

      {/* Stage 5: Reality rewrite panel */}
      {stage >= 5 && (
        <HolographicOverlay
          x={cx - 14 * s}
          y={cy + 14 * s}
          width={28 * s}
          height={5 * s}
          color={color}
          scanSpeed="slow"
        />
      )}

      {/* Stage 6: Corner compile nodes */}
      {stage >= 6 &&
        [
          [cx - 16 * s, cy - 16 * s],
          [cx + 16 * s, cy - 16 * s],
          [cx - 16 * s, cy + 16 * s],
          [cx + 16 * s, cy + 16 * s]
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5 * s} fill={color} opacity={0.6}>
            <animate
              attributeName="opacity"
              values="0.6;0.1;0.6"
              dur="2s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  )
}
