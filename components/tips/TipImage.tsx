import type { TipArticle } from '@/lib/tips-content'
import TipDiagram from './TipDiagram'
import { FUNDAMENTALS_ILLUSTRATIONS } from './illustrations/fundamentals'
import { AIMING_ILLUSTRATIONS } from './illustrations/aiming'
import { POSITION_ILLUSTRATIONS } from './illustrations/position'
import { SPIN_ILLUSTRATIONS } from './illustrations/spin'
import { SAFETY_ILLUSTRATIONS } from './illustrations/safety'
import { BREAK_ILLUSTRATIONS } from './illustrations/break'
import { MENTAL_ILLUSTRATIONS } from './illustrations/mental'
import { STRATEGY_ILLUSTRATIONS } from './illustrations/strategy'

const ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  ...FUNDAMENTALS_ILLUSTRATIONS,
  ...AIMING_ILLUSTRATIONS,
  ...POSITION_ILLUSTRATIONS,
  ...SPIN_ILLUSTRATIONS,
  ...SAFETY_ILLUSTRATIONS,
  ...BREAK_ILLUSTRATIONS,
  ...MENTAL_ILLUSTRATIONS,
  ...STRATEGY_ILLUSTRATIONS,
}

export default function TipImage({ tip }: { tip: TipArticle }) {
  if (tip.diagram) return <TipDiagram type={tip.diagram} />

  const Illustration = ILLUSTRATIONS[tip.slug]
  if (!Illustration) return null

  return (
    <div className="h-full rounded-xl overflow-hidden border border-pool-border" style={{ background: '#0d2010' }}>
      <svg viewBox="0 0 300 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Illustration />
      </svg>
    </div>
  )
}
