import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#a855f7' // safety & defense category color

function WhenToPlayASafety() {
  return (
    <g>
      <style>{`
        @keyframes saf-scan { 0%,100%{opacity:0.15} 50%{opacity:0.55} }
        @keyframes saf-emoji-bob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }
      `}</style>
      <Felt />
      <StickFigure cx={55} cy={98} color={ACCENT} pose="stand" />
      <g style={{animation:'saf-emoji-bob 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Emoji x={55} y={65} size={20}>🤔</Emoji>
      </g>
      {/* thinking line scanning across the table */}
      <line x1={70} y1={92} x2={230} y2={70} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'saf-scan 2s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes saf-path-travel {
          0%,5%{stroke-dashoffset:200; stroke-dasharray:200} 50%,70%{stroke-dashoffset:0; stroke-dasharray:200} 85%,100%{stroke-dashoffset:200; stroke-dasharray:200}
        }
        @keyframes saf-cue-travel {
          0%,5%{transform:translate(0px,0px)} 50%,70%{transform:translate(185px,60px)} 85%,100%{transform:translate(0px,0px)}
        }
      `}</style>
      <Felt />
      {/* cue ball starting near one side */}
      <g style={{animation:'saf-cue-travel 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={55} cy={50} r={7} color={CHALK} />
      </g>
      <Ball cx={75} cy={108} r={6} color="#ef4444" />
      {/* long travel path across the table */}
      <path d="M 55 50 Q 150 35 240 110" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.8"
        style={{animation:'saf-path-travel 3s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes saf-block-blink { 0%,100%{opacity:0.85} 40%,60%{opacity:0.15} }
        @keyframes saf-line-pulse { 0%,100%{opacity:0.6} 50%{opacity:0.9} }
      `}</style>
      <Felt />
      <Ball cx={60} cy={105} r={7} color={CHALK} />
      {/* blocker ball sitting directly in the path */}
      <Ball cx={155} cy={78} r={7} color={ACCENT} />
      {/* intended target, out of reach behind the blocker */}
      <Ball cx={235} cy={52} r={7} color="#ef4444" />
      {/* line stops dead at the blocker */}
      <line x1={60} y1={105} x2={148} y2={80} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'saf-line-pulse 2s ease-in-out infinite'}} />
      {/* faded continuation that never happens */}
      <line x1={162} y1={75} x2={235} y2={52} stroke={CHALK} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.2" />
      {/* blocked mark */}
      <g stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"
        style={{animation:'saf-block-blink 1.5s ease-in-out infinite'}}>
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
      <style>{`
        @keyframes saf-kick-draw {
          0%,5%{stroke-dashoffset:271; stroke-dasharray:271} 55%,75%{stroke-dashoffset:0; stroke-dasharray:271} 90%,100%{stroke-dashoffset:271; stroke-dasharray:271}
        }
        @keyframes saf-dot1-flash {
          0%,17%{opacity:0.4} 21%,28%{opacity:1} 35%,100%{opacity:0.4}
        }
        @keyframes saf-dot2-flash {
          0%,42%{opacity:0.4} 46%,53%{opacity:1} 60%,100%{opacity:0.4}
        }
      `}</style>
      <Felt />
      <Ball cx={55} cy={108} r={7} color={CHALK} />
      {/* blocker directly in front */}
      <Ball cx={130} cy={88} r={7} color={ACCENT} />
      {/* target ball tucked behind the blocker */}
      <Ball cx={245} cy={95} r={7} color="#ef4444" />
      {/* kick path: bounce off the top rail, around the blocker, to the target */}
      <path d="M 55 108 L 110 32 L 215 30 L 245 95" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.85"
        style={{animation:'saf-kick-draw 3s ease-in-out infinite'}} />
      {/* rail contact marks */}
      <circle cx={110} cy={32} r="2" fill={GOLD}
        style={{animation:'saf-dot1-flash 3s ease-in-out infinite'}} />
      <circle cx={215} cy={30} r="2" fill={GOLD}
        style={{animation:'saf-dot2-flash 3s ease-in-out infinite'}} />
      <Label x={150} y={138} size={7} opacity={0.7}>kick off the rail to escape</Label>
    </g>
  )
}

function TwoWayShotsRevisited() {
  return (
    <g>
      <style>{`
        @keyframes saf-pot-path {
          0%,5%{opacity:0} 15%,45%{opacity:0.85} 55%,100%{opacity:0}
        }
        @keyframes saf-miss-path {
          0%,55%{opacity:0} 65%,90%{opacity:0.7} 100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={50} cy={98} color={ACCENT} pose="bridge" />
      <Cue x1={75} y1={110} x2={140} y2={92} />
      <Ball cx={145} cy={91} r={7} color={CHALK} />
      {/* object ball as the pivot */}
      <Ball cx={200} cy={70} r={7} color="#f5c518" />
      <line x1={145} y1={91} x2={200} y2={70} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* path A: object ball toward the pocket if it drops */}
      <path d="M 200 70 L 270 22" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 2"
        style={{animation:'saf-pot-path 4s ease-in-out infinite'}} />
      <Label x={252} y={36} size={7} color={GOLD} opacity={0.9}>pot</Label>
      {/* path B: if it doesn't drop, cue ball ends up blocking the opponent's ball */}
      <path d="M 200 70 Q 175 105 130 118" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="2 2"
        style={{animation:'saf-miss-path 4s ease-in-out infinite'}} />
      <g opacity="0.9">
        <Ball cx={130} cy={118} r={6} color={CHALK} />
      </g>
      <Ball cx={108} cy={128} r={6} color="#ef4444" />
      <Label x={150} y={138} size={7} opacity={0.7}>good shot either way</Label>
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
