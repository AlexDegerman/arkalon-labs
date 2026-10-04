'use client'

import WorkspaceTabBar from '@/components/layout/WorkspaceTabBar'
import WorkspacePanel from '@/components/layout/WorkspacePanel'

export default function RightColumn() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WorkspaceTabBar />
      <WorkspacePanel />
    </div>
  )
}
