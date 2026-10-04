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

export default function GalacticEngine({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48

  // Spiral arm points
  function spiralArm(startAngle: number, points: number) {
    return Array.from({ length: points }, (_, i) => {
      const t = i / (points - 1)
      const a = startAngle + t * Math.PI * 1.5
      const r = (3 + t * 14) * s
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    }).join(' ')
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Stage 1: Galactic core */}
      <circle
        cx={cx}
        cy={cy}
        r={5 * s}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.9}
      />

      {/* Stage 2: Spiral arms */}
      {stage >= 2 &&
        [0, Math.PI].map((offset, i) => (
          <polyline
            key={i}
            points={spiralArm(offset, 12)}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

      {/* Stage 3: Galactic core energy */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Orbital rings */}
      {stage >= 4 &&
        [10, 16, 20].map((r, i) => (
          <RotatingRing
            key={i}
            cx={cx}
            cy={cy}
            r={r * s}
            color={color}
            dashArray={`${2 * s} ${4 * s}`}
            speed="slow"
            direction={i % 2 === 0 ? 'cw' : 'ccw'}
            opacity={0.3 - i * 0.05}
          />
        ))}

      {/* Stage 5: Star field */}
      {stage >= 5 &&
        Array.from({ length: 10 }, (_, i) => {
          const a = (Math.PI / 5) * i
          const r = (8 + (i % 3) * 5) * s
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(a)}
              cy={cy + r * Math.sin(a)}
              r={0.8 * s}
              fill={color}
              opacity={0.5}
            >
              <animate
                attributeName="opacity"
                values="0.5;0.1;0.5"
                dur={`${1 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}

      {/* Stage 6: Data processing strip */}
      {stage >= 6 && (
        <LEDPanel
          x={cx - 14 * s}
          y={cy + 18 * s}
          width={28 * s}
          height={3 * s}
          rows={1}
          cols={7}
          color={color}
          animationSpeed="slow"
        />
      )}
    </svg>
  )
}
