'use client'

import { formatPoints } from '@/lib/format'

interface Props {
  cost: bigint
  canAfford: boolean
  onClick: () => void
  label?: string
  disabled?: boolean
}

export default function BuyButton({
  cost,
  canAfford,
  onClick,
  label = 'BUY',
  disabled = false
}: Props) {
  const isDisabled = disabled || (!canAfford && cost > 0n)

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`${label} - costs ${formatPoints(cost)} RP`}
      className={[
        'px-3 py-1.5 text-xs font-mono font-bold rounded border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
        canAfford && !disabled
          ? 'border-(--status-success) text-(--status-success) hover:bg-(--status-success) hover:text-black'
          : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
      ].join(' ')}
    >
      {label}
    </button>
  )
}
