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
  const clamped = Math.max(0, Math.min(1, progress))
  const pct = Math.round(clamped * 100)

  const fillColor =
    variant === 'success'
      ? 'bg-(--status-success) shadow-[0_0_8px_rgba(57,255,138,0.4)]'
      : variant === 'warning'
        ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
        : 'bg-(--border-accent) shadow-[0_0_8px_rgba(0,240,255,0.4)]'

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
        className="w-full bg-(--bg-elevated) border border-(--border-default)/70 rounded-full overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={[
            fillColor,
            'h-full rounded-full',
            animated ? 'transition-all duration-300' : 'transition-none'
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
