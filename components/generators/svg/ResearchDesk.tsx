'use client'

import EnergyCore from './EnergyCore'
import LEDPanel from './LEDPanel'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function ResearchDesk({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  // All coordinates designed on a 48x48 grid; s scales to actual render size
  const s = size / 48

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Stage 1: Simple desk outline */}
      <rect
        x={cx - 16 * s}
        y={cy - 6 * s}
        width={32 * s}
        height={12 * s}
        rx={2 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <rect
        x={cx - 12 * s}
        y={cy + 6 * s}
        width={4 * s}
        height={8 * s}
        fill={color}
        opacity={0.6}
      />
      <rect
        x={cx + 8 * s}
        y={cy + 6 * s}
        width={4 * s}
        height={8 * s}
        fill={color}
        opacity={0.6}
      />

      {/* Stage 2: Screen */}
      {stage >= 2 && (
        <rect
          x={cx - 10 * s}
          y={cy - 14 * s}
          width={20 * s}
          height={10 * s}
          rx={1 * s}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.7}
        />
      )}

      {/* Stage 3: LED indicators */}
      {stage >= 3 && (
        <LEDPanel
          x={cx - 8 * s}
          y={cy - 5 * s}
          width={16 * s}
          height={4 * s}
          rows={1}
          cols={4}
          color={color}
        />
      )}

      {/* Stage 4: Energy core on screen */}
      {stage >= 4 && (
        <EnergyCore
          cx={cx}
          cy={cy - 9 * s}
          r={3 * s}
          color={color}
          pulseSpeed="slow"
        />
      )}

      {/* Stage 5: Side panels */}
      {stage >= 5 && (
        <>
          <rect
            x={cx - 20 * s}
            y={cy - 8 * s}
            width={4 * s}
            height={16 * s}
            rx={1 * s}
            fill="none"
            stroke={color}
            strokeWidth={0.75}
            opacity={0.5}
          />
          <rect
            x={cx + 16 * s}
            y={cy - 8 * s}
            width={4 * s}
            height={16 * s}
            rx={1 * s}
            fill="none"
            stroke={color}
            strokeWidth={0.75}
            opacity={0.5}
          />
        </>
      )}

      {/* Stage 6: Full glow fill */}
      {stage >= 6 && (
        <rect
          x={cx - 16 * s}
          y={cy - 6 * s}
          width={32 * s}
          height={12 * s}
          rx={2 * s}
          fill={color}
          opacity={0.08}
        />
      )}
    </svg>
  )
}
