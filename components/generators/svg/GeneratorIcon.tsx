'use client'

// Placeholder wireframe SVG icon shown before Phase 16 adds per-generator visuals
// Stage 1-6 based on quantity owned; each stage adds complexity
interface Props {
  generatorIndex: number
  stage: 1 | 2 | 3 | 4 | 5 | 6
  size?: number
  glowColor?: string
}

// Base color per generator index group (tier bands of 4)
const TIER_COLORS = [
  '#2dd4bf', // 1-4: teal
  '#a78bfa', // 5-8: purple
  '#f472b6', // 9-12: pink
  '#fb923c', // 13-16: orange
  '#e0e0ff' // 17-20: white-blue
]

function getTierColor(index: number): string {
  return (
    TIER_COLORS[Math.floor(index / 4)] ?? TIER_COLORS[TIER_COLORS.length - 1]
  )
}

export default function GeneratorIcon({
  generatorIndex,
  stage,
  size = 48,
  glowColor
}: Props) {
  const color = glowColor ?? getTierColor(generatorIndex)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.32

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Stage 1: simple hexagon outline */}
      <polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        }).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />

      {/* Stage 2+: inner ring */}
      {stage >= 2 && (
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.55}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      )}

      {/* Stage 3+: center dot */}
      {stage >= 3 && (
        <circle cx={cx} cy={cy} r={3} fill={color} opacity="0.9" />
      )}

      {/* Stage 4+: radial lines */}
      {stage >= 4 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return (
            <line
              key={i}
              x1={cx + r * 0.55 * Math.cos(a)}
              y1={cy + r * 0.55 * Math.sin(a)}
              x2={cx + r * Math.cos(a)}
              y2={cy + r * Math.sin(a)}
              stroke={color}
              strokeWidth="0.75"
              strokeOpacity="0.5"
            />
          )
        })}

      {/* Stage 5+: outer ring */}
      {stage >= 5 && (
        <circle
          cx={cx}
          cy={cy}
          r={r * 1.18}
          fill="none"
          stroke={color}
          strokeWidth="0.75"
          strokeOpacity="0.3"
        />
      )}

      {/* Stage 6: glow fill */}
      {stage >= 6 && (
        <circle cx={cx} cy={cy} r={r * 0.3} fill={color} opacity="0.15" />
      )}
    </svg>
  )
}
