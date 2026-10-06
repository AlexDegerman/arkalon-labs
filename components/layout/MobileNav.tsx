'use client'

import { useActiveTab, MobileTab } from '@/hooks/useActiveTab'

interface NavItem {
  id: MobileTab
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'lab', label: 'Lab', icon: '⚗' },
  { id: 'arkalon', label: 'Arkalon', icon: '◎' },
  { id: 'research', label: 'Research', icon: '◈' },
  { id: 'relics', label: 'Relics', icon: '◆' },
  { id: 'more', label: 'More', icon: '≡' }
]

export default function MobileNav() {
  const { mobileTab, setMobileTab } = useActiveTab()

  return (
    <nav
      className="lg:hidden flex items-stretch border-t border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 z-30"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = mobileTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setMobileTab(item.id)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer',
              isActive
                ? 'text-(--border-accent) bg-(--border-accent)/10 border-t-2 border-(--border-accent) -mt-px shadow-[0_-4px_12px_rgba(0,240,255,0.2)]'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
