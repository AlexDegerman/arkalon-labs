'use client'

import FloatingDrone from './FloatingDrone'
import LEDPanel from './LEDPanel'
import CoolantPipe from './CoolantPipe'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function UniversalConstructor({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48 // base grid: 48x48

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Stage 1: Print bed */}
      <rect
        x={cx - 16 * s}
        y={cy + 4 * s}
        width={32 * s}
        height={4 * s}
        rx={1 * s}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      {/* Print arm */}
      <line
        x1={cx - 16 * s}
        y1={cy - 8 * s}
        x2={cx + 16 * s}
        y2={cy - 8 * s}
        stroke={color}
        strokeWidth={2}
        opacity={0.8}
      />
      <line
        x1={cx}
        y1={cy - 8 * s}
        x2={cx}
        y2={cy + 4 * s}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
      />

      {/* Stage 2: Print head with LED */}
      {stage >= 2 && (
        <>
          <rect
            x={cx - 4 * s}
            y={cy - 10 * s}
            width={8 * s}
            height={5 * s}
            rx={1 * s}
            fill={color}
            opacity={0.3}
          />
          <circle
            cx={cx}
            cy={cy + 2 * s}
            r={1.5 * s}
            fill={color}
            opacity={0.8}
          >
            <animate
              attributeName="opacity"
              values="0.8;0.2;0.8"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      {/* Stage 3: Material feeders */}
      {stage >= 3 && (
        <>
          <CoolantPipe
            x1={cx - 16 * s}
            y1={cy - 16 * s}
            x2={cx - 16 * s}
            y2={cy - 8 * s}
            color={color}
          />
          <CoolantPipe
            x1={cx + 16 * s}
            y1={cy - 16 * s}
            x2={cx + 16 * s}
            y2={cy - 8 * s}
            color={color}
          />
        </>
      )}

      {/* Stage 4: Fabrication grid on bed */}
      {stage >= 4 && (
        <LEDPanel
          x={cx - 14 * s}
          y={cy + 5 * s}
          width={28 * s}
          height={2.5 * s}
          rows={1}
          cols={7}
          color={color}
          animationSpeed="medium"
        />
      )}

      {/* Stage 5: Atom spray nozzle effect */}
      {stage >= 5 &&
        [0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={cx + (i - 1) * 4 * s}
            cy={cy + 4 * s}
            r={1 * s}
            fill={color}
            opacity={0}
          >
            <animate
              attributeName="cy"
              values={`${cy + 2 * s};${cy + 8 * s}`}
              dur={`${0.6 + i * 0.2}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0"
              dur={`${0.6 + i * 0.2}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

      {/* Stage 6: Monitoring drone */}
      {stage >= 6 && (
        <FloatingDrone
          cx={cx + 18 * s}
          cy={cy - 4 * s}
          color={color}
          size={4 * s}
          floatRange={3}
        />
      )}
    </svg>
  )
}
