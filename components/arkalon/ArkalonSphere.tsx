'use client'

import { useCallback } from 'react'

export type ArkalonState = 'idle' | 'anomaly' | 'prestige'

interface Props {
  state: ArkalonState
  interactive: boolean
  onClick?: () => void
  size?: number
}

// Wireframe icosahedron vertex pairs for the sphere lines
// Normalized to a unit sphere then scaled by size/2
function buildEdges(
  cx: number,
  cy: number,
  r: number
): [number, number, number, number][] {
  const phi = (1 + Math.sqrt(5)) / 2
  const scale = r / Math.sqrt(1 + phi * phi)

  // 12 vertices of a unit icosahedron
  const verts: [number, number, number][] = [
    [0, 1, phi],
    [0, -1, phi],
    [0, 1, -phi],
    [0, -1, -phi],
    [1, phi, 0],
    [-1, phi, 0],
    [1, -phi, 0],
    [-1, -phi, 0],
    [phi, 0, 1],
    [-phi, 0, 1],
    [phi, 0, -1],
    [-phi, 0, -1]
  ].map(([x, y, z]) => [x * scale, y * scale, z * scale])

  // 30 edges of a regular icosahedron
  const edgeIndices: [number, number][] = [
    [0, 1],
    [0, 4],
    [0, 5],
    [0, 8],
    [0, 9],
    [1, 6],
    [1, 7],
    [1, 8],
    [1, 9],
    [2, 3],
    [2, 4],
    [2, 5],
    [2, 10],
    [2, 11],
    [3, 6],
    [3, 7],
    [3, 10],
    [3, 11],
    [4, 5],
    [4, 8],
    [4, 10],
    [5, 9],
    [5, 11],
    [6, 7],
    [6, 8],
    [6, 10],
    [7, 9],
    [7, 11],
    [8, 10],
    [9, 11]
  ]

  // Simple orthographic projection with slight perspective
  return edgeIndices.map(([a, b]) => {
    const [ax, ay, az] = verts[a]
    const [bx, by, bz] = verts[b]
    const perspA = 1 + az / (r * 4)
    const perspB = 1 + bz / (r * 4)
    return [
      cx + ax * perspA,
      cy - ay * perspA,
      cx + bx * perspB,
      cy - by * perspB
    ]
  })
}

export default function ArkalonSphere({
  state,
  interactive,
  onClick,
  size = 128
}: Props) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  const edges = buildEdges(cx, cy, r)

  const animationClass =
    state === 'anomaly'
      ? 'arkalon-anomaly-anim'
      : state === 'prestige'
        ? 'arkalon-prestige-anim'
        : 'arkalon-idle-anim'

  const handleClick = useCallback(() => {
    if (interactive && onClick) onClick()
  }, [interactive, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick()
      }
    },
    [interactive, onClick]
  )

  const strokeColor =
    state === 'anomaly'
      ? '#ef4444'
      : state === 'prestige'
        ? '#c026d3'
        : 'var(--border-accent)'

  const strokeOpacity = state === 'idle' ? 0.7 : 1

  return (
    <div
      className={`arkalon-sphere-wrap ${animationClass}`}
      style={{ width: size, height: size }}
      role={interactive ? 'button' : 'img'}
      aria-label={
        interactive ? 'Arkalon core - click to interact' : 'Arkalon core visual'
      }
      tabIndex={interactive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        {/* Outer glow circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 4}
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* Core circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeOpacity={strokeOpacity * 0.5}
        />

        {/* Wireframe edges */}
        {edges.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth="0.75"
            strokeOpacity={strokeOpacity * 0.6}
          />
        ))}

        {/* Center node */}
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill={strokeColor}
          opacity={strokeOpacity}
        />

        {/* Interactive pulse ring */}
        {interactive && state === 'idle' && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 10}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity="0.15"
            className="dot-pulse"
          />
        )}

        {/* Anomaly spike overlays */}
        {state === 'anomaly' &&
          [0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const innerR = r + 2
            const outerR = r + 14 + (i % 2 === 0 ? 6 : 0)
            return (
              <line
                key={`spike-${i}`}
                x1={cx + Math.cos(rad) * innerR}
                y1={cy + Math.sin(rad) * innerR}
                x2={cx + Math.cos(rad) * outerR}
                y2={cy + Math.sin(rad) * outerR}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            )
          })}
      </svg>
    </div>
  )
}
