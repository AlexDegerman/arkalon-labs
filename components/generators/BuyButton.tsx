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
        'min-w-16 sm:min-w-20 px-3 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-lg border transition-all duration-150',
        'active:scale-95 cursor-pointer select-none',
        canAfford && !disabled
          ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.35)]'
          : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
      ].join(' ')}
    >
      {label}
    </button>
  )
}
