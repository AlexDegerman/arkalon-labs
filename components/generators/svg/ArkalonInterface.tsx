'use client'

import RotatingRing from './RotatingRing'
import EnergyCore from './EnergyCore'
import HolographicOverlay from './HolographicOverlay'
import FloatingDrone from './FloatingDrone'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function ArkalonInterface({ stage, color, size }: Props) {
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
      {/* Stage 1: Octagonal frame */}
      <polygon
        points={Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI / 4) * i - Math.PI / 8
          return `${cx + 14 * s * Math.cos(a)},${cy + 14 * s * Math.sin(a)}`
        }).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Stage 2: Inner octagon */}
      {stage >= 2 && (
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = (Math.PI / 4) * i - Math.PI / 8
            return `${cx + 8 * s * Math.cos(a)},${cy + 8 * s * Math.sin(a)}`
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          opacity={0.5}
        />
      )}

      {/* Stage 3: Arkalon eye core */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="slow" />
      )}

      {/* Stage 4: Telemetry ring */}
      {stage >= 4 && (
        <RotatingRing
          cx={cx}
          cy={cy}
          r={11 * s}
          color={color}
          dashArray={`${1 * s} ${2 * s}`}
          speed="slow"
          opacity={0.6}
        />
      )}

      {/* Stage 5: Holographic data panel */}
      {stage >= 5 && (
        <HolographicOverlay
          x={cx - 12 * s}
          y={cy + 14 * s}
          width={24 * s}
          height={6 * s}
          color={color}
          scanSpeed="fast"
        />
      )}

      {/* Stage 6: Floating telemetry drone */}
      {stage >= 6 && (
        <FloatingDrone cx={cx} cy={cy - 20 * s} color={color} size={5 * s} />
      )}
    </svg>
  )
}
