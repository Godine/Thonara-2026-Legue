import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#e8c547' // break category color

function PowerVsControlTheTwoThirdsRule() {
  return (
    <g>
      <Felt pockets={false} />
      {/* power gauge bar */}
      <rect x={50} y={70} width={200} height={8} rx={4} fill="#0d2010" stroke={CHALK} strokeWidth="0.5" opacity="0.6" />
      {/* filled portion up to ~2/3 */}
      <rect x={50} y={70} width={133} height={8} rx={4} fill={ACCENT} opacity="0.85" />
      {/* tick marks */}
      <line x1={50} y1={64} x2={50} y2={82} stroke={CHALK} strokeWidth="1" opacity="0.4" />
      <line x1={250} y1={64} x2={250} y2={82} stroke={CHALK} strokeWidth="1" opacity="0.4" />
      {/* 2/3 marker, highlighted */}
      <line x1={183} y1={60} x2={183} y2={86} stroke={GOLD} strokeWidth="2" />
      <circle cx={183} cy={60} r={3} fill={GOLD} />
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
      <Ball cx={70} cy={75} r={7} color={CHALK} />
      <line x1={85} y1={75} x2={210} y2={75} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      <Label x={150} y={138} size={7} opacity={0.7}>no gaps, no wasted energy</Label>
    </g>
  )
}

function TheSoftBreakForPositionGames() {
  return (
    <g>
      <Felt />
      {/* cue ball on the left */}
      <Ball cx={60} cy={100} r={7} color={CHALK} />
      {/* short, soft dashed path toward the cluster */}
      <path d="M 72 96 Q 110 80 145 76" fill="none" stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
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
        opacity="0.6"
      />
      {/* stick figure walking the lap */}
      <StickFigure cx={48} cy={95} color={ACCENT} pose="walk" />
      <Emoji x={48} y={65} size={16}>🤔</Emoji>
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
