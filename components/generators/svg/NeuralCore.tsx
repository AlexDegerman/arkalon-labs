'use client'

import EnergyCore from './EnergyCore'
import LEDPanel from './LEDPanel'
import type { GeneratorStage } from '@/hooks/useGeneratorStage'

interface Props {
  stage: GeneratorStage
  color: string
  size: number
}

export default function NeuralCore({ stage, color, size }: Props) {
  const cx = size / 2
  const cy = size / 2
  const s = size / 48 // base grid: 48x48

  // Node positions for neural network pattern
  const nodes = [
    { x: cx, y: cy },
    { x: cx - 12 * s, y: cy - 10 * s },
    { x: cx + 12 * s, y: cy - 10 * s },
    { x: cx - 12 * s, y: cy + 10 * s },
    { x: cx + 12 * s, y: cy + 10 * s }
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Stage 1: Central node + connections */}
      {nodes.slice(1).map((n, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={i === 0 ? 4 * s : 2.5 * s}
          fill={color}
          opacity={i === 0 ? 0.9 : 0.6}
        />
      ))}

      {/* Stage 2: Outer nodes */}
      {stage >= 2 &&
        [0, 1, 2, 3].map((i) => {
          const a = (Math.PI / 2) * i
          const nx = cx + 18 * s * Math.cos(a)
          const ny = cy + 18 * s * Math.sin(a)
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={color}
                strokeWidth={0.75}
                opacity={0.3}
              />
              <circle cx={nx} cy={ny} r={1.5 * s} fill={color} opacity={0.5} />
            </g>
          )
        })}

      {/* Stage 3: Core pulse */}
      {stage >= 3 && (
        <EnergyCore cx={cx} cy={cy} r={4 * s} color={color} pulseSpeed="fast" />
      )}

      {/* Stage 4: LED activity strip */}
      {stage >= 4 && (
        <LEDPanel
          x={cx - 14 * s}
          y={cy + 14 * s}
          width={28 * s}
          height={4 * s}
          rows={1}
          cols={7}
          color={color}
          animationSpeed="fast"
        />
      )}

      {/* Stage 5: Outer ring */}
      {stage >= 5 && (
        <circle
          cx={cx}
          cy={cy}
          r={21 * s}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          opacity={0.3}
        />
      )}

      {/* Stage 6: Extra connection lines between outer nodes */}
      {stage >= 6 &&
        nodes
          .slice(1)
          .map((a, i) =>
            nodes
              .slice(i + 2)
              .map((b, j) => (
                <line
                  key={`${i}-${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={color}
                  strokeWidth={0.5}
                  opacity={0.2}
                />
              ))
          )}
    </svg>
  )
}
