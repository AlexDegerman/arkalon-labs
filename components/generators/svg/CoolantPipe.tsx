'use client'

interface Props {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  strokeWidth?: number
  animated?: boolean
  opacity?: number
}

// Animated coolant pipe - a line with a flow animation
export default function CoolantPipe({
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth = 2,
  animated = true,
  opacity = 0.7
}: Props) {
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

  return (
    <g opacity={opacity}>
      {/* Pipe body */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Flow particle */}
      {animated && (
        <circle r={strokeWidth * 0.8} fill="#ffffff" opacity={0.9}>
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path={`M${x1},${y1} L${x2},${y2}`}
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  )
}
