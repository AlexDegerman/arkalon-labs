'use client'

interface Props {
  cx: number
  cy: number
  size?: number
  color: string
  floatRange?: number
  speed?: 'slow' | 'medium' | 'fast'
  opacity?: number
}

// Small floating drone - minimal diamond shape with hover animation
export default function FloatingDrone({
  cx,
  cy,
  size = 6,
  color,
  floatRange = 4,
  speed = 'medium',
  opacity = 0.85
}: Props) {
  const dur = speed === 'slow' ? '4s' : speed === 'fast' ? '1.2s' : '2.2s'

  const points = [
    `${cx},${cy - size}`,
    `${cx + size * 0.6},${cy}`,
    `${cx},${cy + size * 0.6}`,
    `${cx - size * 0.6},${cy}`
  ].join(' ')

  return (
    <g opacity={opacity}>
      <polygon points={points} fill={color}>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0,0; 0,${-floatRange}; 0,0; 0,${floatRange}; 0,0`}
          dur={dur}
          repeatCount="indefinite"
        />
      </polygon>
      {/* Drone light */}
      <circle cx={cx} cy={cy} r={size * 0.2} fill="#ffffff" opacity={0.8}>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0,0; 0,${-floatRange}; 0,0; 0,${floatRange}; 0,0`}
          dur={dur}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0.3;0.8"
          dur={dur}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}
