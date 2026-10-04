'use client'

import LEDPanel from './LEDPanel'
import CoolantPipe from './CoolantPipe'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function ServerCluster({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48 // base grid: 48x48
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Stage 1: Server rack */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={cx - 14 * s}
          y={cy - 14 * s + i * 10 * s}
          width={28 * s}
          height={8 * s}
          rx={1 * s}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.8}
        />
      ))}

      {/* Stage 2: LED panels on each rack */}
      {stage >= 2 &&
        [0, 1, 2].map((i) => (
          <LEDPanel
            key={i}
            x={cx - 10 * s}
            y={cy - 13 * s + i * 10 * s}
            width={20 * s}
            height={4 * s}
            rows={1}
            cols={5}
            color={color}
            animationSpeed="fast"
          />
        ))}

      {/* Stage 3: Side bars */}
      {stage >= 3 && (
        <>
          <rect
            x={cx - 18 * s}
            y={cy - 16 * s}
            width={3 * s}
            height={32 * s}
            rx={1 * s}
            fill={color}
            opacity={0.4}
          />
          <rect
            x={cx + 15 * s}
            y={cy - 16 * s}
            width={3 * s}
            height={32 * s}
            rx={1 * s}
            fill={color}
            opacity={0.4}
          />
        </>
      )}

      {/* Stage 4: Coolant pipes */}
      {stage >= 4 && (
        <CoolantPipe
          x1={cx - 14 * s}
          y1={cy - 10 * s}
          x2={cx - 14 * s}
          y2={cy + 18 * s}
          color={color}
        />
      )}

      {/* Stage 5: Top connectors */}
      {stage >= 5 && (
        <>
          <line
            x1={cx - 10 * s}
            y1={cy - 14 * s}
            x2={cx + 10 * s}
            y2={cy - 18 * s}
            stroke={color}
            strokeWidth={0.75}
            opacity={0.5}
          />
          <circle
            cx={cx}
            cy={cy - 20 * s}
            r={2 * s}
            fill={color}
            opacity={0.6}
          />
        </>
      )}

      {/* Stage 6: Glow */}
      {stage >= 6 &&
        [0, 1, 2].map((i) => (
          <rect
            key={i}
            x={cx - 14 * s}
            y={cy - 14 * s + i * 10 * s}
            width={28 * s}
            height={8 * s}
            rx={1 * s}
            fill={color}
            opacity={0.06}
          />
        ))}
    </svg>
  )
}
