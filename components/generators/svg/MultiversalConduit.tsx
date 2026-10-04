'use client'

import EnergyCore from './EnergyCore'
import RotatingRing from './RotatingRing'
import CoolantPipe from './CoolantPipe'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function MultiversalConduit({ stage, color, size }: Props) {
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
      {/* Stage 1: Conduit portal ring */}
      <circle
        cx={cx}
        cy={cy}
        r={16 * s}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.9}
      />
      {/* Inner distortion */}
      <circle cx={cx} cy={cy} r={12 * s} fill={color} opacity={0.05} />

      {/* Stage 2: Reality streams */}
      {stage >= 2 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i
          return (
            <line
              key={i}
              x1={cx + 12 * s * Math.cos(a)}
              y1={cy + 12 * s * Math.sin(a)}
              x2={cx + 16 * s * Math.cos(a)}
              y2={cy + 16 * s * Math.sin(a)}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="1.5s"
                begin={`${i * 0.25}s`}
                repeatCount="indefinite"
              />
            </line>
          )
        })}

      {/* Stage 3: Gateway core */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy}
          r={5 * s}
          color={color}
          pulseSpeed="medium"
        />
      )}

      {/* Stage 4: Inter-reality flow pipes */}
      {stage >= 4 && (
        <>
          <CoolantPipe
            x1={cx - 22 * s}
            y1={cy}
            x2={cx - 16 * s}
            y2={cy}
            color={color}
            strokeWidth={2}
          />
          <CoolantPipe
            x1={cx + 16 * s}
            y1={cy}
            x2={cx + 22 * s}
            y2={cy}
            color={color}
            strokeWidth={2}
          />
        </>
      )}

      {/* Stage 5: Portal stability rings */}
      {stage >= 5 && (
        <>
          <RotatingRing
            cx={cx}
            cy={cy}
            r={19 * s}
            color={color}
            dashArray={`${4 * s} ${2 * s}`}
            speed="slow"
            opacity={0.35}
          />
          <RotatingRing
            cx={cx}
            cy={cy}
            r={21 * s}
            color={color}
            dashArray={`${2 * s} ${4 * s}`}
            speed="slow"
            direction="ccw"
            opacity={0.2}
          />
        </>
      )}

      {/* Stage 6: Adjacent reality echoes */}
      {stage >= 6 &&
        [-1, 1].map((dir) => (
          <circle
            key={dir}
            cx={cx + dir * 10 * s}
            cy={cy}
            r={4 * s}
            fill="none"
            stroke={color}
            strokeWidth={0.75}
            strokeDasharray={`${2 * s} ${1 * s}`}
            opacity={0.25}
          >
            <animate
              attributeName="opacity"
              values="0.25;0.5;0.25"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  )
}
