'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import LEDPanel from './LEDPanel'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function InfiniteSimulation({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48

  // Nested universe circles
  const circles = [20, 15, 10, 6, 3].map((r, i) => r * s)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Nested circles */}
      {circles.slice(0, 1).map((r, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.8 - i * 0.1}
        />
      ))}

      {/* Stage 2: More nesting */}
      {stage >= 2 &&
        circles
          .slice(1, 3)
          .map((r, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={1}
              opacity={0.6 - i * 0.1}
            />
          ))}

      {/* Stage 3: Core */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy}
          r={circles[4]}
          color={color}
          pulseSpeed="slow"
        />
      )}

      {/* Stage 4: Rotation on outer circle */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={circles[0] + 3 * s}
          color={color}
          dashArray={`${3 * s} ${6 * s}`}
          speed="slow"
          opacity={0.4}
        />
      )}

      {/* Stage 5: Simulation grid */}
      {stage >= 5 && (
        <LEDPanel
          x={cx - 16 * s}
          y={cy + 18 * s}
          width={32 * s}
          height={4 * s}
          rows={1}
          cols={8}
          color={color}
          animationSpeed="medium"
        />
      )}

      {/* Stage 6: All nested circles with decreasing opacity */}
      {stage >= 6 &&
        circles.map((r, i) => (
          <circle
            key={`full-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.15 + i * 0.05}
          >
            <animate
              attributeName="r"
              values={`${r};${r * 1.04};${r}`}
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  )
}
