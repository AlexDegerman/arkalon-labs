'use client'

import EnergyCore from './EnergyCore'
import RotatingRing from './RotatingRing'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function AbsoluteVoidCompressor({ stage, color, size }: Props) {
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
      {/* Stage 1: Void boundary - represents compressed emptiness */}
      <circle
        cx={cx}
        cy={cy}
        r={16 * s}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.9}
      />
      {/* Inner void */}
      <circle
        cx={cx}
        cy={cy}
        r={12 * s}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeDasharray={`${1 * s} ${2 * s}`}
        opacity={0.3}
      />

      {/* Stage 2: Compression gradients */}
      {stage >= 2 &&
        [8, 10, 12].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r * s}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.15 + i * 0.08}
          />
        ))}

      {/* Stage 3: Ultra-dense core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={5 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Compression rotation rings */}
      {stage >= 4 && (
        <>
          <RotatingRing
            cx={cx}
            cy={cy}
            r={14 * s}
            color={color}
            dashArray={`${6 * s} ${1 * s}`}
            speed="medium"
            opacity={0.5}
          />
          <RotatingRing
            cx={cx}
            cy={cy}
            r={16 * s}
            color={color}
            dashArray={`${3 * s} ${3 * s}`}
            speed="slow"
            direction="ccw"
            opacity={0.35}
          />
        </>
      )}

      {/* Stage 5: Storage node indicators */}
      {stage >= 5 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i
          return (
            <rect
              key={i}
              x={cx + 18 * s * Math.cos(a) - 2 * s}
              y={cy + 18 * s * Math.sin(a) - 2 * s}
              width={4 * s}
              height={4 * s}
              rx={0.5 * s}
              fill={color}
              opacity={0.5}
              transform={`rotate(${(a * 180) / Math.PI + 45} ${cx + 18 * s * Math.cos(a)} ${cy + 18 * s * Math.sin(a)})`}
            >
              <animate
                attributeName="opacity"
                values="0.5;0.1;0.5"
                dur="2s"
                begin={`${i * 0.33}s`}
                repeatCount="indefinite"
              />
            </rect>
          )
        })}

      {/* Stage 6: Void singularity - maximum compression */}
      {stage >= 6 && (
        <>
          <circle cx={cx} cy={cy} r={2 * s} fill={color} opacity={1}>
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={cx}
            cy={cy}
            r={21 * s}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.15}
          >
            <animate
              attributeName="r"
              values={`${21 * s};${19 * s};${21 * s}`}
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
    </svg>
  )
}
