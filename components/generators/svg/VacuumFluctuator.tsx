'use client'

import { useMemo } from 'react'
import EnergyCore from './EnergyCore'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function VacuumFluctuator({ stage, color, size }: Props) {
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
      {/* Stage 1: Vacuum chamber */}
      <circle
        cx={cx}
        cy={cy}
        r={16 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
      />

      {/* Stage 2: Fluctuation sparks */}
      {stage >= 2 &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI / 4) * i
          const r1 = 8 * s
          const r2 = 14 * s
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(a)}
              y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy + r2 * Math.sin(a)}
              stroke={color}
              strokeWidth={0.75}
              opacity={0}
            >
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur={`${0.6 + i * 0.1}s`}
                begin={`${i * 0.08}s`}
                repeatCount="indefinite"
              />
            </line>
          )
        })}

      {/* Stage 3: Particle core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="fast" />
      )}

      {/* Stage 4: Sub-atomic dots */}
      {stage >= 4 &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (Math.PI / 6) * i
          const r = 11 * s
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(a)}
              cy={cy + r * Math.sin(a)}
              r={1.2 * s}
              fill={color}
              opacity={0}
            >
              <animate
                attributeName="opacity"
                values="0;0.7;0"
                dur={`${1.2}s`}
                begin={`${i * 0.1}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}

      {/* Stage 5: Outer chamber wall */}
      {stage >= 5 && (
        <circle
          cx={cx}
          cy={cy}
          r={20 * s}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          strokeDasharray={`${3 * s} ${2 * s}`}
          opacity={0.3}
        />
      )}

      {/* Stage 6: Quantum foam texture - deterministic positions */}
      {stage >= 6 &&
        Array.from({ length: 6 }, (_, i) => {
          const dirX = i % 2 === 0 ? 1 : -1
          const dirY = i % 3 === 0 ? 1 : -1
          return (
            <circle
              key={i}
              cx={cx + dirX * (4 + i) * 1.5 * s}
              cy={cy + dirY * (3 + i) * 1.5 * s}
              r={0.8 * s}
              fill={color}
              opacity={0.2}
            >
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur={`${0.5 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}
    </svg>
  )
}
