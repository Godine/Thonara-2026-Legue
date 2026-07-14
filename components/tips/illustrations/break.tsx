import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#e8c547' // break category color

function PowerVsControlTheTwoThirdsRule() {
  return (
    <g>
      <style>{`
        @keyframes brk-bar-fill {
          0%,5%{transform:scaleX(0)} 45%,70%{transform:scaleX(1)} 90%,100%{transform:scaleX(0)}
        }
        @keyframes brk-sweet-pulse {
          0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.6; transform:scale(1.2)}
        }
      `}</style>
      <Felt pockets={false} />
      {/* power gauge bar */}
      <rect x={50} y={70} width={200} height={8} rx={4} fill="#0d2010" stroke={CHALK} strokeWidth="0.5" opacity="0.6" />
      {/* filled portion up to ~2/3 — animated fill */}
      <rect x={50} y={70} width={133} height={8} rx={4} fill={ACCENT} opacity="0.85"
        style={{transformBox:'fill-box', transformOrigin:'left center', animation:'brk-bar-fill 2.5s ease-in-out infinite'}} />
      {/* tick marks */}
      <line x1={50} y1={64} x2={50} y2={82} stroke={CHALK} strokeWidth="1" opacity="0.4" />
      <line x1={250} y1={64} x2={250} y2={82} stroke={CHALK} strokeWidth="1" opacity="0.4" />
      {/* 2/3 marker, highlighted */}
      <line x1={183} y1={60} x2={183} y2={86} stroke={GOLD} strokeWidth="2" />
      <circle cx={183} cy={60} r={3} fill={GOLD}
        style={{animation:'brk-sweet-pulse 1.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}} />
      <Label x={50} y={55} size={6} opacity={0.5} anchor="middle">0</Label>
      <Label x={250} y={55} size={6} opacity={0.5} anchor="middle">MAX</Label>
      <Label x={183} y={48} size={7} color={GOLD} weight="bold">sweet spot</Label>
      {/* cue stick pointing down at the 2/3 mark */}
      <Cue x1={183} y1={20} x2={183} y2={56} />
      <Label x={150} y={138} size={7} opacity={0.7}>2/3 power, full control</Label>
    </g>
  )
}

function RackTightnessMatters() {
  return (
    <g>
      <style>{`
        @keyframes brk-cue-approach {
          0%,10%{transform:translateX(0px)} 55%,70%{transform:translateX(140px)} 85%,100%{transform:translateX(0px)}
        }
      `}</style>
      <Felt />
      {/* faint triangle outline for the rack shape */}
      <polygon points="225,75 270,50 270,100" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      {/* tight triangular cluster of balls, touching, no gaps */}
      <Ball cx={225} cy={75} r={7} color={CHALK} label="1" />
      <Ball cx={239} cy={62} r={7} color="#f5c518" label="9" />
      <Ball cx={239} cy={88} r={7} color="#ef4444" label="3" />
      <Ball cx={253} cy={49} r={7} color="#60a5fa" label="2" />
      <Ball cx={253} cy={75} r={7} color="#22c55e" label="6" />
      <Ball cx={253} cy={101} r={7} color="#a855f7" label="7" />
      <Ball cx={267} cy={36} r={7} color="#f97316" label="5" />
      <Ball cx={267} cy={62} r={7} color="#1a1a1a" label="8" />
      <Ball cx={267} cy={88} r={7} color="#06b6d4" label="4" />
      <Ball cx={267} cy={114} r={7} color="#eab308" label="0" />
      {/* cue ball approaching from the left */}
      <g style={{animation:'brk-cue-approach 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={70} cy={75} r={7} color={CHALK} />
      </g>
      <line x1={85} y1={75} x2={210} y2={75} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      <Label x={150} y={138} size={7} opacity={0.7}>no gaps, no wasted energy</Label>
    </g>
  )
}

function TheSoftBreakForPositionGames() {
  return (
    <g>
      <style>{`
        @keyframes brk-soft-draw {
          0%,5%{stroke-dashoffset:75; stroke-dasharray:75} 50%,75%{stroke-dashoffset:0; stroke-dasharray:75} 90%,100%{stroke-dashoffset:75; stroke-dasharray:75}
        }
      `}</style>
      <Felt />
      {/* cue ball on the left */}
      <Ball cx={60} cy={100} r={7} color={CHALK} />
      {/* short, soft dashed path toward the cluster */}
      <path d="M 72 96 Q 110 80 145 76" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6"
        style={{animation:'brk-soft-draw 2.5s ease-in-out infinite'}} />
      {/* tight cluster of balls staying near center, barely disturbed */}
      <Ball cx={155} cy={75} r={7} color="#f5c518" label="1" />
      <Ball cx={167} cy={68} r={7} color="#ef4444" label="3" />
      <Ball cx={167} cy={82} r={7} color="#60a5fa" label="2" />
      <Ball cx={179} cy={75} r={7} color="#22c55e" label="6" />
      {/* faint scattered "ghost" balls showing what NOT to do, far corners, dimmed */}
      <g opacity="0.18">
        <Ball cx={270} cy={30} r={5} color="#a855f7" />
        <Ball cx={250} cy={120} r={5} color="#f97316" />
        <Ball cx={285} cy={125} r={5} color="#1a1a1a" />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>soft hit, tight cluster stays</Label>
    </g>
  )
}

function RecoveringFromABadBreak() {
  return (
    <g>
      <style>{`
        @keyframes brk-figure-bob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
        @keyframes brk-oval-pulse { 0%,100%{opacity:0.6} 50%{opacity:0.3} }
      `}</style>
      <Felt />
      {/* messy scattered balls */}
      <Ball cx={90} cy={40} r={6} color="#f5c518" />
      <Ball cx={200} cy={35} r={6} color="#ef4444" />
      <Ball cx={245} cy={95} r={6} color="#60a5fa" />
      <Ball cx={130} cy={115} r={6} color="#22c55e" />
      <Ball cx={75} cy={90} r={6} color="#a855f7" />
      {/* dashed loop path around the table edge - "take a lap" */}
      <path
        d="M 40 30 A 1 1 0 0 1 260 30 A 1 1 0 0 1 260 120 A 1 1 0 0 1 40 120 A 1 1 0 0 1 40 30"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.2"
        strokeDasharray="3 3"
        style={{animation:'brk-oval-pulse 2s ease-in-out infinite'}}
      />
      {/* stick figure walking the lap */}
      <g style={{animation:'brk-figure-bob 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <StickFigure cx={48} cy={95} color={ACCENT} pose="walk" />
        <Emoji x={48} y={65} size={16}>🤔</Emoji>
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>slow down, take a lap</Label>
    </g>
  )
}

export const BREAK_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'power-vs-control-the-two-thirds-rule': PowerVsControlTheTwoThirdsRule,
  'rack-tightness-matters': RackTightnessMatters,
  'the-soft-break-for-position-games': TheSoftBreakForPositionGames,
  'recovering-from-a-bad-break': RecoveringFromABadBreak,
}
