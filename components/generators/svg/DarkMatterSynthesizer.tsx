'use client'

import RotatingRing from './RotatingRing'
import CoolantPipe from './CoolantPipe'
import EnergyCore from './EnergyCore'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function DarkMatterSynthesizer({ stage, color, size }: Props) {
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
      {/* Stage 1: Dark matter containment cylinder */}
      <ellipse
        cx={cx}
        cy={cy - 6 * s}
        rx={12 * s}
        ry={4 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <line
        x1={cx - 12 * s}
        y1={cy - 6 * s}
        x2={cx - 12 * s}
        y2={cy + 6 * s}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <line
        x1={cx + 12 * s}
        y1={cy - 6 * s}
        x2={cx + 12 * s}
        y2={cy + 6 * s}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <ellipse
        cx={cx}
        cy={cy + 6 * s}
        rx={12 * s}
        ry={4 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Dark matter fill */}
      {stage >= 2 && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={11 * s}
          ry={9 * s}
          fill={color}
          opacity={0.08}
        />
      )}

      {/* Stage 3: Synthesis core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Compression rings */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={14 * s}
          color={color}
          dashArray={`${4 * s} ${3 * s}`}
          speed="slow"
          opacity={0.4}
        />
      )}

      {/* Stage 5: Fuel rod output pipes */}
      {stage >= 5 && (
        <>
          <CoolantPipe
            x1={cx - 12 * s}
            y1={cy + 6 * s}
            x2={cx - 18 * s}
            y2={cy + 12 * s}
            color={color}
          />
          <CoolantPipe
            x1={cx + 12 * s}
            y1={cy + 6 * s}
            x2={cx + 18 * s}
            y2={cy + 12 * s}
            color={color}
          />
        </>
      )}

      {/* Stage 6: Dense matter dots */}
      {stage >= 6 &&
        Array.from({ length: 5 }, (_, i) => (
          <circle
            key={i}
            cx={cx + (i - 2) * 4 * s}
            cy={cy}
            r={1.5 * s}
            fill={color}
            opacity={0.4}
          >
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur="1.5s"
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  )
}
