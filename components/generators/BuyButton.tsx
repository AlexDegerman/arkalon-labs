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
  const isDisabled = disabled || !canAfford

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`${label} - costs ${formatPoints(cost)} RP`}
      className={[
        'min-w-16 sm:min-w-22 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg border transition-all duration-150 whitespace-nowrap select-none',
        canAfford && !disabled
          ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) hover:bg-(--status-success) hover:text-[#080c14] shadow-[0_0_14px_rgba(57,255,138,0.3)] cursor-pointer'
          : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
      ].join(' ')}
    >
      {label}
    </button>
  )
}
