'use client'

import RotatingRing from './RotatingRing'
import LEDPanel from './LEDPanel'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function ChronosSynchronizer({ stage, color, size }: Props) {
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
      {/* Stage 1: Clock face */}
      <circle
        cx={cx}
        cy={cy}
        r={18 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      {/* Clock hands */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 14 * s}
        stroke={color}
        strokeWidth={2}
        opacity={0.8}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="6s"
          repeatCount="indefinite"
        />
      </line>
      <line
        x1={cx}
        y1={cy}
        x2={cx + 10 * s}
        y2={cy}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="1.2s"
          repeatCount="indefinite"
        />
      </line>

      {/* Stage 2: Hour markers */}
      {stage >= 2 &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2
          return (
            <circle
              key={i}
              cx={cx + 15 * s * Math.cos(a)}
              cy={cy + 15 * s * Math.sin(a)}
              r={1 * s}
              fill={color}
              opacity={0.5}
            />
          )
        })}

      {/* Stage 3: Second ring counter-rotating */}
      {stage >= 3 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={20 * s}
          color={color}
          dashArray={`${1.5 * s} ${3 * s}`}
          speed="medium"
          direction="ccw"
          opacity={0.4}
        />
      )}

      {/* Stage 4: Timeline sync indicators */}
      {stage >= 4 && (
        <LEDPanel
          x={cx - 14 * s}
          y={cy + 16 * s}
          width={28 * s}
          height={3 * s}
          rows={1}
          cols={6}
          color={color}
          animationSpeed="slow"
        />
      )}

      {/* Stage 5: Parallel timeline rings */}
      {stage >= 5 &&
        [22, 24].map((r, i) => (
          <RotatingRing
            key={i}
            cx={cx}
            cy={cy}
            r={r * s}
            color={color}
            dashArray={`${2 * s} ${5 * s}`}
            speed="slow"
            direction={i % 2 === 0 ? 'cw' : 'ccw'}
            opacity={0.2}
          />
        ))}

      {/* Stage 6: Center sync dot */}
      {stage >= 6 && (
        <circle cx={cx} cy={cy} r={2.5 * s} fill={color} opacity={0.8}>
          <animate
            attributeName="opacity"
            values="0.8;0.2;0.8"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  )
}
