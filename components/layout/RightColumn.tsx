'use client'

import WorkspaceTabBar from '@/components/layout/WorkspaceTabBar'
import WorkspacePanel from '@/components/layout/WorkspacePanel'

export default function RightColumn() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--bg-primary)/30">
      <WorkspaceTabBar />
      <WorkspacePanel />
    </div>
  )
}
