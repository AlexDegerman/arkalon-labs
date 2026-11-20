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
    <g opacity={opacity} data-speed={dur}>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={r * 1.6} fill={color} opacity={0.12} />
      {/* Core body */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} />
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
