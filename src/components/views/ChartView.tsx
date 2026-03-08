// src/components/views/ChartView.tsx
import { LeftSidebar }    from '../sidebar-left/LeftSidebar'
import { ChartCanvas }    from '../chart/ChartCanvas'
import { RightSidebar }   from '../sidebar-right/RightSidebar'

export function ChartView() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ChartCanvas />
      </div>
      <RightSidebar />
    </div>
  )
}
