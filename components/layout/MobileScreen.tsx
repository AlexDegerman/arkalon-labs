'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import MobileMoreDrawer from '@/components/layout/MobileMoreDrawer'

export default function MobileScreen() {
  const { mobileTab, moreDrawerOpen, setMoreDrawerOpen } = useActiveTab()

  return (
    <div className="lg:hidden flex-1 overflow-hidden relative min-h-0">
      {/* Lab tab */}
      {mobileTab === 'lab' && (
        <div className="h-full overflow-y-auto p-3">
          <p className="terminal text-(--text-secondary) text-xs">
            Facility Equipment - generator list renders here in Phase 3
          </p>
        </div>
      )}

      {/* Arkalon tab */}
      {mobileTab === 'arkalon' && (
        <div className="h-full overflow-y-auto p-3 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border border-(--border-accent) opacity-30 mt-8" />
          <p className="terminal text-(--text-secondary) text-xs">
            Arkalon core renders here in Phase 2
          </p>
        </div>
      )}

      {/* Research tab */}
      {mobileTab === 'research' && (
        <div className="h-full overflow-y-auto p-3">
          <p className="terminal text-(--text-secondary) text-xs">
            Research workspace renders here in Phase 5
          </p>
        </div>
      )}

      {/* Relics tab */}
      {mobileTab === 'relics' && (
        <div className="h-full overflow-y-auto p-3">
          <p className="terminal text-(--text-secondary) text-xs">
            Relics tab renders here in Phase 9
          </p>
        </div>
      )}

      {/* More drawer */}
      {moreDrawerOpen && (
        <MobileMoreDrawer onClose={() => setMoreDrawerOpen(false)} />
      )}
    </div>
  )
}
