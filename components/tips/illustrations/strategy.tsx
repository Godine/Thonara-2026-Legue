import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#fb923c' // strategy category color

function ThinkThreeShotsAhead() {
  return (
    <g>
      <style>{`
        @keyframes str-route-draw {
          0%,5%{stroke-dashoffset:207; stroke-dasharray:207} 80%,90%{stroke-dashoffset:0; stroke-dasharray:207} 100%{stroke-dashoffset:207; stroke-dasharray:207}
        }
        @keyframes str-ball1-hi { 0%,28%{transform:scale(1)} 33%,40%{transform:scale(1.35)} 46%,100%{transform:scale(1)} }
        @keyframes str-ball2-hi { 0%,58%{transform:scale(1)} 63%,70%{transform:scale(1.35)} 76%,100%{transform:scale(1)} }
        @keyframes str-ball3-hi { 0%,82%{transform:scale(1)} 87%,94%{transform:scale(1.35)} 100%{transform:scale(1)} }
      `}</style>
      <Felt />
      {/* cue ball */}
      <Ball cx={55} cy={108} r={7} color={CHALK} />
      {/* the route: cue -> ball 1 -> ball 2 -> ball 3 */}
      <path d="M 55 108 L 120 85 L 185 95 L 245 55" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85"
        style={{animation:'str-route-draw 3s ease-in-out infinite'}} />
      <g style={{animation:'str-ball1-hi 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={120} cy={85} r={7} color="#60a5fa" label="1" />
      </g>
      <g style={{animation:'str-ball2-hi 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={185} cy={95} r={7} color="#22c55e" label="2" />
      </g>
      <g style={{animation:'str-ball3-hi 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={245} cy={55} r={7} color="#ef4444" label="3" />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>plan the route, not just the shot</Label>
    </g>
  )
}

function ClearClustersEarly() {
  return (
    <g>
      <style>{`
        @keyframes str-approach-draw {
          0%,5%{stroke-dashoffset:167; stroke-dasharray:167} 40%,100%{stroke-dashoffset:0; stroke-dasharray:167}
        }
        @keyframes str-scatter1 { 0%,45%{transform:translate(0px,0px)} 70%,85%{transform:translate(-8px,-6px)} 100%{transform:translate(0px,0px)} }
        @keyframes str-scatter2 { 0%,45%{transform:translate(0px,0px)} 70%,85%{transform:translate(8px,6px)} 100%{transform:translate(0px,0px)} }
        @keyframes str-scatter3 { 0%,45%{transform:translate(0px,0px)} 70%,85%{transform:translate(-6px,9px)} 100%{transform:translate(0px,0px)} }
        @keyframes str-scatter4 { 0%,45%{transform:translate(0px,0px)} 70%,85%{transform:translate(4px,-10px)} 100%{transform:translate(0px,0px)} }
      `}</style>
      <Felt />
      {/* cue ball */}
      <Ball cx={50} cy={105} r={7} color={CHALK} />
      {/* tight cluster of balls grouped together */}
      <g style={{animation:'str-scatter1 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={210} cy={60} r={6} color="#f5c518" />
      </g>
      <g style={{animation:'str-scatter2 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={222} cy={70} r={6} color="#60a5fa" />
      </g>
      <g style={{animation:'str-scatter3 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={208} cy={75} r={6} color="#22c55e" />
      </g>
      <g style={{animation:'str-scatter4 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={220} cy={50} r={6} color="#ef4444" />
      </g>
      {/* dashed line nudging through the cluster to spread it */}
      <path d="M 50 105 L 150 80 L 212 64" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85"
        style={{animation:'str-approach-draw 3.5s ease-in-out infinite'}} />
      {/* faint arrows showing the spread */}
      <path d="M 212 64 L 232 48" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.35" />
      <path d="M 212 64 L 235 80" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.35" />
      <Label x={150} y={138} size={7} opacity={0.7}>{"spread it out while it's cheap"}</Label>
    </g>
  )
}

function ReadingTheTableLayout() {
  return (
    <g>
      <style>{`
        @keyframes str-scan-draw {
          0%,5%{stroke-dashoffset:200; stroke-dasharray:200} 70%,85%{stroke-dashoffset:0; stroke-dasharray:200} 100%{stroke-dashoffset:200; stroke-dasharray:200}
        }
      `}</style>
      <Felt />
      <StickFigure cx={45} cy={98} color={ACCENT} pose="stand" />
      {/* wide scanning arc sweeping across the table */}
      <path d="M 75 35 A 95 95 0 0 1 75 160" fill="none" stroke={CHALK} strokeWidth="1" opacity="0.4"
        style={{animation:'str-scan-draw 3s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes str-bank-draw {
          0%,5%{stroke-dashoffset:214; stroke-dasharray:214} 50%,75%{stroke-dashoffset:0; stroke-dasharray:214} 90%,100%{stroke-dashoffset:214; stroke-dasharray:214}
        }
        @keyframes str-rail-flash {
          0%,47%{opacity:0.5} 52%,58%{opacity:1} 63%,100%{opacity:0.5}
        }
      `}</style>
      <Felt />
      {/* object ball */}
      <Ball cx={90} cy={95} r={7} color="#60a5fa" />
      {/* path to the rail and reflecting toward a pocket */}
      <path d="M 90 95 L 180 30 L 270 80" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85"
        style={{animation:'str-bank-draw 3s ease-in-out infinite'}} />
      {/* rail contact mark */}
      <circle cx={180} cy={30} r="2" fill={GOLD}
        style={{animation:'str-rail-flash 3s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes str-kick-draw {
          0%,5%{stroke-dashoffset:294; stroke-dasharray:294} 65%,80%{stroke-dashoffset:0; stroke-dasharray:294} 95%,100%{stroke-dashoffset:294; stroke-dasharray:294}
        }
        @keyframes str-kick-dot1 {
          0%,36%{opacity:0.5} 40%,48%{opacity:1} 54%,100%{opacity:0.5}
        }
        @keyframes str-kick-dot2 {
          0%,58%{opacity:0.5} 62%,70%{opacity:1} 76%,100%{opacity:0.5}
        }
      `}</style>
      <Felt />
      {/* cue ball */}
      <Ball cx={45} cy={50} r={7} color={CHALK} />
      {/* dashed path bouncing off two rails before reaching the object ball */}
      <path d="M 45 50 L 130 128 L 230 35 L 255 70" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85"
        style={{animation:'str-kick-draw 3s ease-in-out infinite'}} />
      {/* two bounce points */}
      <circle cx={130} cy={128} r="2" fill={GOLD}
        style={{animation:'str-kick-dot1 3s ease-in-out infinite'}} />
      <circle cx={230} cy={35} r="2" fill={GOLD}
        style={{animation:'str-kick-dot2 3s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes str-bar {
          0%,5%{transform:scaleY(0)} 30%{transform:scaleY(1)} 80%{transform:scaleY(1)} 100%{transform:scaleY(0)}
        }
        @keyframes str-trend-draw {
          0%,35%{stroke-dashoffset:138; stroke-dasharray:138} 70%,82%{stroke-dashoffset:0; stroke-dasharray:138} 100%{stroke-dashoffset:138; stroke-dasharray:138}
        }
      `}</style>
      <Felt pockets={false} />
      <Emoji x={55} y={45} size={26}>📊</Emoji>
      {/* simple bar chart */}
      <line x1={110} y1={118} x2={270} y2={118} stroke={CHALK} strokeWidth="1" opacity="0.5" />
      {bars.map((h, i) => {
        const x = 120 + i * 32
        return (
          <rect key={i} x={x} y={118 - h} width="16" height={h}
            fill={i % 2 === 0 ? ACCENT : GOLD} opacity="0.85" rx="1"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center bottom',
              animation: `str-bar 4s ease-in-out ${i * 0.25}s infinite`,
              animationFillMode: 'backwards',
            }}
          />
        )
      })}
      {/* trend line across the bars */}
      <path d="M 128 100 L 160 86 L 192 94 L 224 78 L 256 90" fill="none" stroke={CHALK} strokeWidth="1.2"
        style={{animation:'str-trend-draw 4s ease-in-out infinite'}} />
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
