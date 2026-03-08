// src/components/sidebar-left/tabs/StrategyTab.tsx
import { useMarketStore } from '../../../store/useMarketStore'
import { StructureModule } from '../modules/StructureModule'
import { LiquidityModule } from '../modules/LiquidityModule'
import { OrderBlockModule } from '../modules/OrderBlockModule'
import { FVGModule } from '../modules/FVGModule'
import { SignalModule } from '../modules/SignalModule'

export function StrategyTab() {
  const activeTF = useMarketStore(s => s.activeTF)
  const tfAnalysis = useMarketStore(s => s.tfAnalysis)
  const analysis = tfAnalysis[activeTF] ?? null

  return (
    <div>
      <StructureModule analysis={analysis} />
      <LiquidityModule analysis={analysis} />
      <OrderBlockModule analysis={analysis} />
      <FVGModule analysis={analysis} />
      <SignalModule analysis={analysis} />
    </div>
  )
}
