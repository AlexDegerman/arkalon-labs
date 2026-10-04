'use client'

interface Props {
  x: number
  y: number
  width?: number
  height?: number
  rows?: number
  cols?: number
  color: string
  animationSpeed?: 'slow' | 'medium' | 'fast'
  opacity?: number
}

// Reusable LED grid panel - rectangular array of small indicator lights
export default function LEDPanel({
  x,
  y,
  width = 24,
  height = 12,
  rows = 2,
  cols = 4,
  color,
  animationSpeed = 'medium',
  opacity = 0.8
}: Props) {
  const dotW = width / cols
  const dotH = height / rows
  const dur =
    animationSpeed === 'slow'
      ? '3s'
      : animationSpeed === 'fast'
        ? '0.8s'
        : '1.5s'

  return (
    <g opacity={opacity}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cx = x + c * dotW + dotW / 2
          const cy = y + r * dotH + dotH / 2
          const delay = `${((r * cols + c) * 0.15).toFixed(2)}s`
          return (
            <circle
              key={`${r}-${c}`}
              cx={cx}
              cy={cy}
              r={Math.min(dotW, dotH) * 0.3}
            >
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur={dur}
                begin={delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill"
                values={`${color};#ffffff;${color}`}
                dur={dur}
                begin={delay}
                repeatCount="indefinite"
              />
            </circle>
          )
        })
      )}
    </g>
  )
}
