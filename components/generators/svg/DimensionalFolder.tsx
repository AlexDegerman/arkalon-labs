'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function DimensionalFolder({ stage, color, size }: Props) {
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
      {/* Stage 1: Folded space lines */}
      {[0, 1, 2, 3].map((i) => {
        const offset = (i - 1.5) * 8 * s
        return (
          <line
            key={i}
            x1={cx - 18 * s + Math.abs(offset) * 0.3}
            y1={cy + offset}
            x2={cx + 18 * s - Math.abs(offset) * 0.3}
            y2={cy + offset}
            stroke={color}
            strokeWidth={1}
            opacity={0.6 - Math.abs(i - 1.5) * 0.1}
          />
        )
      })}

      {/* Stage 2: Fold convergence point */}
      {stage >= 2 && (
        <polygon
          points={`${cx - 16 * s},${cy - 12 * s} ${cx + 16 * s},${cy - 12 * s} ${cx},${cy + 12 * s}`}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
      )}

      {/* Stage 3: Core at fold point */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy}
          r={4 * s}
          color={color}
          pulseSpeed="medium"
        />
      )}

      {/* Stage 4: Space fold rotation */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={15 * s}
          color={color}
          dashArray={`${8 * s} ${4 * s}`}
          speed="slow"
          opacity={0.4}
        />
      )}

      {/* Stage 5: Compression indicators */}
      {stage >= 5 &&
        [-1, 1].map((dir) => (
          <g key={dir}>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={cx + dir * (12 + i * 3) * s}
                y1={cy - 8 * s + i * 5 * s}
                x2={cx + dir * (12 + i * 3) * s}
                y2={cy - 8 * s + i * 5 * s + 4 * s}
                stroke={color}
                strokeWidth={0.75}
                opacity={0.4}
              />
            ))}
          </g>
        ))}

      {/* Stage 6: Dimensional grid */}
      {stage >= 6 &&
        [cx - 8 * s, cx, cx + 8 * s].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={cy - 18 * s}
            x2={x}
            y2={cy + 18 * s}
            stroke={color}
            strokeWidth={0.25}
            opacity={0.15}
          />
        ))}
    </svg>
  )
}
