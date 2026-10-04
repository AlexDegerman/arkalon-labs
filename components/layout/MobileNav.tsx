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
      className="lg:hidden flex items-stretch border-t border-(--border-default) bg-(--bg-surface) shrink-0"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = mobileTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setMobileTab(item.id)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--border-accent)',
              isActive
                ? 'text-(--text-accent) border-t border-(--border-accent) -mt-px'
                : 'text-(--text-secondary)'
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="font-sans">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
