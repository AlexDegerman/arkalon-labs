'use client'

import { useCallback, useMemo } from 'react'

export type ArkalonState = 'idle' | 'anomaly' | 'prestige'
export type ArkalonCoreStage = 1 | 2 | 3 | 4 | 5

export const CORE_STAGE_LABELS: Record<ArkalonCoreStage, string> = {
  1: 'Fractured',
  2: 'Reconstructing',
  3: 'Stabilized',
  4: 'Resonant',
  5: 'Ascendant'
}

export function getArkalonCoreStage(
  peakLifetimePoints: bigint,
  totalPrestiges: number
): ArkalonCoreStage {
  if (peakLifetimePoints >= 10n ** 35n) return 5
  if (peakLifetimePoints >= 1_000_000_000n || totalPrestiges >= 1) return 4
  if (peakLifetimePoints >= 1_000_000n) return 3
  if (peakLifetimePoints >= 1_000n) return 2
  return 1
}

interface Props {
  state: ArkalonState
  interactive: boolean
  onClick?: () => void
  size?: number
  stage?: ArkalonCoreStage
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
  size = 128,
  stage = 5
}: Props) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  const edges = useMemo(() => buildEdges(cx, cy, r), [cx, cy, r])

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

  const strokeOpacity = state === 'idle' ? (stage === 1 ? 0.55 : 0.78) : 1
  const visibleEdgeCount = stage === 1 ? 12 : stage === 2 ? 21 : edges.length
  const auraBlur = state !== 'idle' ? 22 : [6, 10, 14, 18, 24][stage - 1]
  const auraOpacity =
    state !== 'idle' ? 0.34 : [0.08, 0.14, 0.2, 0.28, 0.36][stage - 1]

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95"
      style={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 ${auraBlur}px ${strokeColor})`
      }}
      role={interactive ? 'button' : 'img'}
      aria-label={
        interactive ? 'Arkalon core - click to interact' : 'Arkalon core visual'
      }
      tabIndex={interactive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Matching-color ambient aura */}
      <div
        className="absolute inset-1 rounded-full pointer-events-none blur-xl transition-all duration-700"
        style={{ backgroundColor: strokeColor, opacity: auraOpacity }}
        aria-hidden="true"
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ overflow: 'visible', position: 'relative' }}
      >
        {/* Outer containment ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stage >= 4 ? '1' : '0.6'}
          strokeDasharray={
            stage <= 2 ? '4 6' : stage === 4 ? '10 6' : '14 4 3 4'
          }
          strokeOpacity={stage >= 3 ? 0.45 : 0.25}
        >
          {stage >= 4 && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="22s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Stage 5: Counter-rotating outer harmonic ring */}
        {stage >= 5 && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 12}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.75"
            strokeDasharray="6 10"
            strokeOpacity="0.35"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`360 ${cx} ${cy}`}
              to={`0 ${cx} ${cy}`}
              dur="32s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Core shell */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray={stage === 1 ? '6 5' : undefined}
          strokeOpacity={strokeOpacity * 0.55}
        />

        {/* Wireframe edges (progressive restoration) */}
        {edges.slice(0, visibleEdgeCount).map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={stage >= 4 ? '0.9' : '0.75'}
            strokeDasharray={stage === 1 && i % 3 === 0 ? '3 3' : undefined}
            strokeOpacity={strokeOpacity * (stage === 1 ? 0.5 : 0.65)}
          />
        ))}

        {/* Stage 5: Harmonic vertex pips */}
        {stage >= 5 &&
          edges
            .slice(0, 6)
            .map(([x1, y1], i) => (
              <circle
                key={`v-${i}`}
                cx={x1}
                cy={y1}
                r={1.4}
                fill={strokeColor}
                opacity={0.75}
              />
            ))}

        {/* Center node */}
        <circle
          cx={cx}
          cy={cy}
          r={stage === 1 ? 2 : stage >= 4 ? 3.5 : 3}
          fill={strokeColor}
          opacity={stage === 1 ? 0.5 : strokeOpacity}
        />

        {/* Interactive pulse ring */}
        {interactive && state === 'idle' && stage >= 3 && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 10}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity="0.18"
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
