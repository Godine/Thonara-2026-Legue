import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#fb923c' // strategy category color

function ThinkThreeShotsAhead() {
  return (
    <g>
      <Felt />
      {/* cue ball */}
      <Ball cx={55} cy={108} r={7} color={CHALK} />
      {/* the route: cue -> ball 1 -> ball 2 -> ball 3 */}
      <path d="M 55 108 L 120 85 L 185 95 L 245 55" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      <Ball cx={120} cy={85} r={7} color="#60a5fa" label="1" />
      <Ball cx={185} cy={95} r={7} color="#22c55e" label="2" />
      <Ball cx={245} cy={55} r={7} color="#ef4444" label="3" />
      <Label x={150} y={138} size={7} opacity={0.7}>plan the route, not just the shot</Label>
    </g>
  )
}

function ClearClustersEarly() {
  return (
    <g>
      <Felt />
      {/* cue ball */}
      <Ball cx={50} cy={105} r={7} color={CHALK} />
      {/* tight cluster of balls grouped together */}
      <Ball cx={210} cy={60} r={6} color="#f5c518" />
      <Ball cx={222} cy={70} r={6} color="#60a5fa" />
      <Ball cx={208} cy={75} r={6} color="#22c55e" />
      <Ball cx={220} cy={50} r={6} color="#ef4444" />
      {/* dashed line nudging through the cluster to spread it */}
      <path d="M 50 105 L 150 80 L 212 64" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      {/* faint arrows showing the spread */}
      <path d="M 212 64 L 232 48" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.35" />
      <path d="M 212 64 L 235 80" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.35" />
      <Label x={150} y={138} size={7} opacity={0.7}>spread it out while it's cheap</Label>
    </g>
  )
}

function ReadingTheTableLayout() {
  return (
    <g>
      <Felt />
      <StickFigure cx={45} cy={98} color={ACCENT} pose="stand" />
      {/* wide scanning arc sweeping across the table */}
      <path d="M 75 35 A 95 95 0 0 1 75 160" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      {/* scattered balls of different colors */}
      <Ball cx={150} cy={45} r={6} color="#f5c518" />
      <Ball cx={205} cy={95} r={6} color="#60a5fa" />
      <Ball cx={135} cy={110} r={6} color="#ef4444" />
      <Ball cx={250} cy={50} r={6} color="#22c55e" />
      <Ball cx={265} cy={105} r={6} color={CHALK} />
      <Label x={150} y={138} size={7} opacity={0.7}>scan the whole table first</Label>
    </g>
  )
}

function BankShotsTheMirrorMethod() {
  return (
    <g>
      <Felt />
      {/* object ball */}
      <Ball cx={90} cy={95} r={7} color="#60a5fa" />
      {/* path to the rail and reflecting toward a pocket */}
      <path d="M 90 95 L 180 30 L 270 80" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      {/* rail contact mark */}
      <circle cx={180} cy={30} r="2" fill={GOLD} opacity="0.8" />
      {/* faint mirrored/ghosted pocket reflected across the rail */}
      <g opacity="0.25">
        <circle cx={180} cy={-6} r="7.5" fill="#050d07" />
        <path d="M 90 95 L 180 -6" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>aim at the mirrored pocket</Label>
    </g>
  )
}

function KickShotsOneTwoThreeRail() {
  return (
    <g>
      <Felt />
      {/* cue ball */}
      <Ball cx={45} cy={50} r={7} color={CHALK} />
      {/* dashed path bouncing off two rails before reaching the object ball */}
      <path d="M 45 50 L 130 128 L 230 35 L 255 70" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      {/* two bounce points */}
      <circle cx={130} cy={128} r="2" fill={GOLD} opacity="0.8" />
      <circle cx={230} cy={35} r="2" fill={GOLD} opacity="0.8" />
      {/* object ball */}
      <Ball cx={255} cy={70} r={7} color="#ef4444" />
      <Label x={150} y={138} size={7} opacity={0.7}>bounce your way to the ball</Label>
    </g>
  )
}

function TrackingYourStatsToFindPatterns() {
  const bars = [18, 32, 24, 40, 28]
  return (
    <g>
      <Felt pockets={false} />
      <Emoji x={55} y={45} size={26}>📊</Emoji>
      {/* simple bar chart */}
      <line x1={110} y1={118} x2={270} y2={118} stroke={CHALK} strokeWidth="1" opacity="0.5" />
      {bars.map((h, i) => {
        const x = 120 + i * 32
        return (
          <rect key={i} x={x} y={118 - h} width="16" height={h} fill={i % 2 === 0 ? ACCENT : GOLD} opacity="0.85" rx="1" />
        )
      })}
      {/* trend line across the bars */}
      <path d="M 128 100 L 160 86 L 192 94 L 224 78 L 256 90" fill="none" stroke={CHALK} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
      <Label x={150} y={138} size={7} opacity={0.7}>let your data find the pattern</Label>
    </g>
  )
}

export const STRATEGY_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'think-three-shots-ahead': ThinkThreeShotsAhead,
  'clear-clusters-early': ClearClustersEarly,
  'reading-the-table-layout': ReadingTheTableLayout,
  'bank-shots-the-mirror-method': BankShotsTheMirrorMethod,
  'kick-shots-one-two-three-rail': KickShotsOneTwoThreeRail,
  'tracking-your-stats-to-find-patterns': TrackingYourStatsToFindPatterns,
}
