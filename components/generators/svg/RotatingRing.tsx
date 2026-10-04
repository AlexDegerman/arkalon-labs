'use client'

interface Props {
  cx: number
  cy: number
  r: number
  color: string
  strokeWidth?: number
  speed?: 'slow' | 'medium' | 'fast'
  direction?: 'cw' | 'ccw'
  dashArray?: string
  opacity?: number
}

// Rotating ring with optional dash pattern
export default function RotatingRing({
  cx,
  cy,
  r,
  color,
  strokeWidth = 1.5,
  speed = 'medium',
  direction = 'cw',
  dashArray,
  opacity = 0.8
}: Props) {
  const dur = speed === 'slow' ? '6s' : speed === 'fast' ? '1.5s' : '3s'
  const fromAngle = direction === 'cw' ? 0 : 360
  const toAngle = direction === 'cw' ? 360 : 0

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray ?? `${r * 0.5} ${r * 0.3}`}
      opacity={opacity}
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from={`${fromAngle} ${cx} ${cy}`}
        to={`${toAngle} ${cx} ${cy}`}
        dur={dur}
        repeatCount="indefinite"
      />
    </circle>
  )
}
