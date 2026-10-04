'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import CoolantPipe from './CoolantPipe'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function SingularityReactor({ stage, color, size }: Props) {
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
      {/* Stage 1: Black hole event horizon */}
      <circle
        cx={cx}
        cy={cy}
        r={12 * s}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.9}
      />
      <circle cx={cx} cy={cy} r={6 * s} fill={color} opacity={0.15} />

      {/* Stage 2: Hawking radiation arcs */}
      {stage >= 2 &&
        [0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={i}
              x1={cx + 12 * s * Math.cos(rad)}
              y1={cy + 12 * s * Math.sin(rad)}
              x2={cx + 18 * s * Math.cos(rad)}
              y2={cy + 18 * s * Math.sin(rad)}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            >
              <animate
                attributeName="opacity"
                values="0.5;0;0.5"
                dur="1.2s"
                begin={`${i * 0.2}s`}
                repeatCount="indefinite"
              />
            </line>
          )
        })}

      {/* Stage 3: Singularity core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={5 * s} color={color} pulseSpeed="fast" />
      )}

      {/* Stage 4: Accretion disk rings */}
      {stage >= 4 && (
        <>
          <RotatingRing
            cx={cx}
            cy={cy}
            r={15 * s}
            color={color}
            dashArray={`${5 * s} ${2 * s}`}
            speed="medium"
            opacity={0.6}
          />
          <RotatingRing
            cx={cx}
            cy={cy}
            r={18 * s}
            color={color}
            dashArray={`${3 * s} ${4 * s}`}
            speed="slow"
            direction="ccw"
            opacity={0.4}
          />
        </>
      )}

      {/* Stage 5: Coolant containment pipes */}
      {stage >= 5 && (
        <>
          <CoolantPipe
            x1={cx - 20 * s}
            y1={cy}
            x2={cx - 12 * s}
            y2={cy}
            color={color}
          />
          <CoolantPipe
            x1={cx + 12 * s}
            y1={cy}
            x2={cx + 20 * s}
            y2={cy}
            color={color}
          />
        </>
      )}

      {/* Stage 6: Outer event ring */}
      {stage >= 6 && (
        <circle
          cx={cx}
          cy={cy}
          r={21 * s}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          strokeDasharray={`${2 * s} ${3 * s}`}
          opacity={0.3}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.7;0.3"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  )
}
