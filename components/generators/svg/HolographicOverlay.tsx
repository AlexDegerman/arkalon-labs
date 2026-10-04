'use client'

interface Props {
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity?: number
  scanSpeed?: 'slow' | 'medium' | 'fast'
}

// Holographic overlay - scan line animation over a region
export default function HolographicOverlay({
  x,
  y,
  width,
  height,
  color,
  opacity = 0.15,
  scanSpeed = 'medium'
}: Props) {
  const dur =
    scanSpeed === 'slow' ? '4s' : scanSpeed === 'fast' ? '1.5s' : '2.5s'

  return (
    <g>
      {/* Background tint */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={opacity * 0.4}
        rx={2}
      />
      {/* Horizontal scan line */}
      <rect x={x} width={width} height={2} fill={color} opacity={0.6} y={y}>
        <animate
          attributeName="y"
          values={`${y};${y + height};${y}`}
          dur={dur}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur={dur}
          repeatCount="indefinite"
        />
      </rect>
      {/* Border */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={opacity * 2}
        rx={2}
      />
    </g>
  )
}
