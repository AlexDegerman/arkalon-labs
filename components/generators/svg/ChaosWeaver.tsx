'use client'

import EnergyCore from './EnergyCore'
import RotatingRing from './RotatingRing'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function ChaosWeaver({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48

  // Chaotic probability lines - semi-random but deterministic
  const chaosLines = Array.from({ length: 8 }, (_, i) => {
    const a1 = (Math.PI / 4) * i
    const a2 = a1 + Math.PI * 0.7 + (i % 3) * 0.4
    return {
      x1: cx + 14 * s * Math.cos(a1),
      y1: cy + 14 * s * Math.sin(a1),
      x2: cx + 14 * s * Math.cos(a2),
      y2: cy + 14 * s * Math.sin(a2)
    }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Probability outer boundary */}
      <circle
        cx={cx}
        cy={cy}
        r={16 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
        strokeDasharray={`${3 * s} ${2 * s}`}
      />

      {/* Stage 2: Chaos weave lines */}
      {stage >= 2 &&
        chaosLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={color}
            strokeWidth={0.75}
            opacity={0.35}
          >
            <animate
              attributeName="opacity"
              values="0.35;0.7;0.35"
              dur={`${1 + i * 0.15}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

      {/* Stage 3: Chaos attractor core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="fast" />
      )}

      {/* Stage 4: Probability rotation */}
      {stage >= 4 && (
        <>
          <RotatingRing
            cx={cx}
            cy={cy}
            r={12 * s}
            color={color}
            dashArray={`${1 * s} ${3 * s}`}
            speed="fast"
            opacity={0.4}
          />
          <RotatingRing
            cx={cx}
            cy={cy}
            r={18 * s}
            color={color}
            dashArray={`${2 * s} ${2 * s}`}
            speed="medium"
            direction="ccw"
            opacity={0.3}
          />
        </>
      )}

      {/* Stage 5: Deconstructed probability nodes */}
      {stage >= 5 &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI / 4) * i
          return (
            <circle
              key={i}
              cx={cx + 14 * s * Math.cos(a)}
              cy={cy + 14 * s * Math.sin(a)}
              r={1.5 * s}
              fill={color}
              opacity={0.5}
            >
              <animate
                attributeName="r"
                values={`${1.5 * s};${2.5 * s};${1.5 * s}`}
                dur={`${0.8 + i * 0.1}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}

      {/* Stage 6: Data array organization band */}
      {stage >= 6 && (
        <rect
          x={cx - 16 * s}
          y={cy + 17 * s}
          width={32 * s}
          height={3 * s}
          rx={1 * s}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          opacity={0.4}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      )}
    </svg>
  )
}
