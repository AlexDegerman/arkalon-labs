'use client'

interface Props {
  cx: number
  cy: number
  r: number
  color: string
  pulseSpeed?: 'slow' | 'medium' | 'fast'
  opacity?: number
}

// Pulsing energy core - filled circle with radial glow pulse
export default function EnergyCore({
  cx,
  cy,
  r,
  color,
  pulseSpeed = 'medium',
  opacity = 0.9
}: Props) {
  const dur =
    pulseSpeed === 'slow' ? '3s' : pulseSpeed === 'fast' ? '0.8s' : '1.6s'

  return (
    <g opacity={opacity}>
      {/* Outer glow pulse */}
      <circle cx={cx} cy={cy} r={r * 1.8} fill={color} opacity={0}>
        <animate
          attributeName="opacity"
          values="0;0.15;0"
          dur={dur}
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values={`${r * 1.5};${r * 2.2};${r * 1.5}`}
          dur={dur}
          repeatCount="indefinite"
        />
      </circle>
      {/* Core body */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85}>
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur={dur}
          repeatCount="indefinite"
        />
      </circle>
      {/* Highlight */}
      <circle
        cx={cx - r * 0.25}
        cy={cy - r * 0.25}
        r={r * 0.3}
        fill="#ffffff"
        opacity={0.3}
      />
    </g>
  )
}
