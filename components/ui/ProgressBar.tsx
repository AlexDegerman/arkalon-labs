'use client'

interface Props {
  // 0.0 to 1.0
  progress: number
  variant?: 'default' | 'success' | 'warning'
  height?: number
  label?: string
  showPercent?: boolean
  animated?: boolean
}

export default function ProgressBar({
  progress,
  variant = 'default',
  height = 6,
  label,
  showPercent = false,
  animated = true
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress))
  const pct = Math.round(clamped * 100)

  const fillClass =
    variant === 'success'
      ? 'progress-fill-success'
      : variant === 'warning'
        ? 'progress-fill-warning'
        : 'progress-fill'

  return (
    <div className="flex flex-col gap-1 w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-mono text-(--text-secondary)">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-mono text-(--text-accent)">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className="progress-track w-full"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={[fillClass, animated ? '' : 'transition-none!'].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
