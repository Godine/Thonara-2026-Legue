import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#a855f7' // safety & defense category color

function WhenToPlayASafety() {
  return (
    <g>
      <Felt />
      <StickFigure cx={55} cy={98} color={ACCENT} pose="stand" />
      <Emoji x={55} y={65} size={20}>🤔</Emoji>
      {/* thinking line scanning across the table */}
      <line x1={70} y1={92} x2={230} y2={70} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      {/* awkward scattered layout */}
      <Ball cx={165} cy={100} r={6} color="#f5c518" />
      <Ball cx={195} cy={55} r={6} color="#ef4444" />
      <Ball cx={240} cy={88} r={6} color="#60a5fa" />
      <Ball cx={255} cy={45} r={6} color={CHALK} />
      <Label x={150} y={138} size={7} opacity={0.7}>scan for safety first</Label>
    </g>
  )
}

function DistanceSafetiesOutOfReach() {
  return (
    <g>
      <Felt />
      {/* cue ball starting near one side */}
      <Ball cx={55} cy={50} r={7} color={CHALK} />
      <Ball cx={75} cy={108} r={6} color="#ef4444" />
      {/* long travel path across the table */}
      <path d="M 55 50 Q 150 35 240 110" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />
      <g opacity="0.9">
        <Ball cx={240} cy={110} r={7} color={CHALK} />
      </g>
      {/* cluster of object balls grouped far away on the right */}
      <Ball cx={255} cy={45} r={6} color="#f5c518" />
      <Ball cx={268} cy={58} r={6} color="#60a5fa" />
      <Ball cx={258} cy={70} r={6} color="#22c55e" />
      <Label x={150} y={138} size={7} opacity={0.7}>send it far, far away</Label>
    </g>
  )
}

function TheSnookerBlockingThePath() {
  return (
    <g>
      <Felt />
      <Ball cx={60} cy={105} r={7} color={CHALK} />
      {/* blocker ball sitting directly in the path */}
      <Ball cx={155} cy={78} r={7} color={ACCENT} />
      {/* intended target, out of reach behind the blocker */}
      <Ball cx={235} cy={52} r={7} color="#ef4444" />
      {/* line stops dead at the blocker */}
      <line x1={60} y1={105} x2={148} y2={80} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      {/* faded continuation that never happens */}
      <line x1={162} y1={75} x2={235} y2={52} stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.2" />
      {/* blocked mark */}
      <g opacity="0.85" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round">
        <line x1={150} y1={68} x2={160} y2={88} />
        <line x1={160} y1={68} x2={150} y2={88} />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>no straight line, no shot</Label>
    </g>
  )
}

function EscapingASnooker() {
  return (
    <g>
      <Felt />
      <Ball cx={55} cy={108} r={7} color={CHALK} />
      {/* blocker directly in front */}
      <Ball cx={130} cy={88} r={7} color={ACCENT} />
      {/* target ball tucked behind the blocker */}
      <Ball cx={245} cy={95} r={7} color="#ef4444" />
      {/* kick path: bounce off the top rail, around the blocker, to the target */}
      <path d="M 55 108 L 110 32 L 215 30 L 245 95" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
      {/* rail contact marks */}
      <circle cx={110} cy={32} r="2" fill={GOLD} opacity="0.8" />
      <circle cx={215} cy={30} r="2" fill={GOLD} opacity="0.8" />
      <Label x={150} y={138} size={7} opacity={0.7}>kick off the rail to escape</Label>
    </g>
  )
}

function TwoWayShotsRevisited() {
  return (
    <g>
      <Felt />
      <StickFigure cx={50} cy={98} color={ACCENT} pose="bridge" />
      <Cue x1={75} y1={110} x2={140} y2={92} />
      <Ball cx={145} cy={91} r={7} color={CHALK} />
      {/* object ball as the pivot */}
      <Ball cx={200} cy={70} r={7} color="#f5c518" />
      <line x1={145} y1={91} x2={200} y2={70} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* path A: object ball toward the pocket if it drops */}
      <path d="M 200 70 L 270 22" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />
      <Label x={252} y={36} size={7} color={GOLD} opacity={0.9}>pot</Label>
      {/* path B: if it doesn't drop, cue ball ends up blocking the opponent's ball */}
      <path d="M 200 70 Q 175 105 130 118" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7" />
      <g opacity="0.9">
        <Ball cx={130} cy={118} r={6} color={CHALK} />
      </g>
      <Ball cx={108} cy={128} r={6} color="#ef4444" />
      <Label x={170} y={147} size={7} opacity={0.7}>good shot either way</Label>
    </g>
  )
}

export const SAFETY_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'when-to-play-a-safety': WhenToPlayASafety,
  'distance-safeties-out-of-reach': DistanceSafetiesOutOfReach,
  'the-snooker-blocking-the-path': TheSnookerBlockingThePath,
  'escaping-a-snooker': EscapingASnooker,
  'two-way-shots-revisited': TwoWayShotsRevisited,
}
