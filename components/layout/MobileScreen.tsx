'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import MobileMoreDrawer from '@/components/layout/MobileMoreDrawer'
import ArkalonSphere from '../arkalon/ArkalonSphere'

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
        <div className="h-full overflow-y-auto p-4 flex flex-col items-center gap-6 scrollbar-dark">
          <div className="mt-6">
            <ArkalonSphere state="idle" interactive={false} size={140} />
          </div>
          {/* Terminal console renders here in Commit 2.3 */}
          <div className="w-full glass rounded p-3">
            <p className="terminal text-(--text-secondary) text-xs">
              &gt; System standby...
            </p>
          </div>
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
