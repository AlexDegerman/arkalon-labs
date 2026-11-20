'use client'

interface Props {
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
  height = 5,
  label,
  showPercent = false,
  animated = true
}: Props) {
  const safeProgress = Number.isFinite(progress) ? progress : 0
  const clamped = Math.max(0, Math.min(1, safeProgress))
  const pct = Math.round(clamped * 100)

  const liquidFillClass =
    variant === 'success'
      ? 'progress-fill-liquid-success'
      : variant === 'warning'
        ? 'progress-fill-liquid-warning'
        : 'progress-fill-liquid'

  return (
    <div className="flex flex-col gap-1 w-full font-mono text-[11px]">
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-(--text-secondary) font-bold truncate">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-(--text-accent) font-bold ml-auto shrink-0">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full progress-track border border-(--border-default)/70 relative overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={[
            liquidFillClass,
            animated ? 'transition-[width] duration-300' : 'transition-none'
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}