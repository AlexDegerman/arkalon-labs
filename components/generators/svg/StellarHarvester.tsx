'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import CoolantPipe from './CoolantPipe'
import FloatingDrone from './FloatingDrone'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function StellarHarvester({ stage, color, size }: Props) {
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
      {/* Stage 1: Solar collection dish */}
      <path
        d={`M ${cx - 18 * s},${cy + 8 * s} Q ${cx},${cy - 16 * s} ${cx + 18 * s},${cy + 8 * s}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <line
        x1={cx - 18 * s}
        y1={cy + 8 * s}
        x2={cx + 18 * s}
        y2={cy + 8 * s}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Sub-space siphon tube */}
      {stage >= 2 && (
        <CoolantPipe
          x1={cx}
          y1={cy - 6 * s}
          x2={cx}
          y2={cy + 8 * s}
          color={color}
          strokeWidth={2}
        />
      )}

      {/* Stage 3: Star energy core */}
      {stage >= 3 && (
        <EnergyCore
          cx={cx}
          cy={cy - 6 * s}
          r={5 * s}
          color={color}
          pulseSpeed="slow"
        />
      )}

      {/* Stage 4: Collection rings */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy - 6 * s}
          r={10 * s}
          color={color}
          dashArray={`${3 * s} ${3 * s}`}
          speed="medium"
          opacity={0.5}
        />
      )}

      {/* Stage 5: Side collection arms */}
      {stage >= 5 &&
        [-1, 1].map((dir) => (
          <g key={dir}>
            <line
              x1={cx + dir * 18 * s}
              y1={cy + 8 * s}
              x2={cx + dir * 22 * s}
              y2={cy - 4 * s}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
            <circle
              cx={cx + dir * 22 * s}
              cy={cy - 4 * s}
              r={2 * s}
              fill={color}
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

      {/* Stage 6: Monitoring drone */}
      {stage >= 6 && (
        <FloatingDrone
          cx={cx}
          cy={cy + 18 * s}
          color={color}
          size={4 * s}
          floatRange={3}
          speed="slow"
        />
      )}
    </svg>
  )
}
