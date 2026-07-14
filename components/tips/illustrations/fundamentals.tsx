import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#f5c518' // fundamentals category color

function BuildARepeatableStance() {
  return (
    <g>
      <style>{`
        @keyframes fnd-bob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
        @keyframes fnd-ghost { 0%,100%{opacity:0.22} 50%{opacity:0.38} }
      `}</style>
      <Felt />
      <g style={{animation:'fnd-ghost 2s ease-in-out infinite'}} transform="translate(4,2)">
        <StickFigure cx={70} cy={95} color={ACCENT} pose="stand" />
      </g>
      <g style={{animation:'fnd-bob 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <StickFigure cx={70} cy={95} color={ACCENT} pose="stand" />
      </g>
      <Ball cx={200} cy={75} r={7} color={CHALK} />
      <Label x={150} y={140} size={7} opacity={0.7}>same setup, every single time</Label>
    </g>
  )
}

function ThePendulumGrip() {
  return (
    <g>
      <style>{`
        @keyframes fnd-pendulum { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
        @keyframes fnd-arc-draw { 0%,10%{stroke-dashoffset:75} 55%,80%{stroke-dashoffset:0} 100%{stroke-dashoffset:75} }
      `}</style>
      <Felt pockets={false} />
      <g style={{transformOrigin:'175px 88px', animation:'fnd-pendulum 2s ease-in-out infinite'}}>
        <Cue x1={60} y1={108} x2={235} y2={62} />
      </g>
      {/* hand / grip */}
      <ellipse cx={175} cy={88} rx="11" ry="7" fill="none" stroke={ACCENT} strokeWidth="1.5" />
      {/* pendulum swing arc */}
      <path
        d="M 150 60 A 40 40 0 0 1 200 116"
        fill="none" stroke={CHALK} strokeWidth="1" opacity="0.6"
        style={{strokeDasharray:75, strokeDashoffset:75, animation:'fnd-arc-draw 2s ease-in-out infinite'}}
      />
      <Label x={175} y={45} size={7} opacity={0.7}>swing from the elbow</Label>
      <Label x={175} y={130} size={7} opacity={0.6}>loose grip = free pendulum</Label>
    </g>
  )
}

function BridgeHandUnsungHero() {
  return (
    <g>
      <style>{`
        @keyframes fnd-cue-stroke { 0%,100%{transform:translateX(0px) translateY(0px)} 40%,60%{transform:translateX(-6px) translateY(2px)} }
      `}</style>
      <Felt />
      {/* bridge "V" on the felt */}
      <line x1={108} y1={100} x2={150} y2={84} stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1={132} y1={100} x2={150} y2={84} stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <g style={{animation:'fnd-cue-stroke 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={70} y1={120} x2={195} y2={78} />
      </g>
      <Ball cx={200} cy={75} r={7} color={CHALK} />
      <Ball cx={250} cy={60} r={7} color="#ef4444" />
      <Label x={130} y={118} size={7} opacity={0.75}>a steady bridge = a steady aim</Label>
    </g>
  )
}

function AnatomyOfASmoothStroke() {
  return (
    <g>
      <style>{`
        @keyframes fnd-stroke-a { 0%,100%{opacity:0.8} 50%{opacity:0.2} }
        @keyframes fnd-stroke-b { 0%,100%{opacity:0.2} 50%{opacity:0.85} }
      `}</style>
      <Felt />
      <StickFigure cx={68} cy={95} color={ACCENT} pose="aim" />
      <Cue x1={95} y1={105} x2={205} y2={80} />
      <Ball cx={210} cy={78} r={7} color={CHALK} />
      <Ball cx={262} cy={55} r={7} color="#22c55e" />
      {/* back-and-forth stroke indicator */}
      <path
        d="M 110 118 L 175 105"
        fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" markerEnd="none"
        style={{animation:'fnd-stroke-a 2s ease-in-out infinite'}}
      />
      <path
        d="M 110 118 L 175 105"
        fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" transform="translate(0,6)"
        style={{animation:'fnd-stroke-b 2s ease-in-out infinite'}}
      />
      <Label x={140} y={138} size={7} opacity={0.7}>smooth back, smooth through</Label>
    </g>
  )
}

function EyePatternAndAlignment() {
  return (
    <g>
      <style>{`
        @keyframes fnd-eye1 {
          0%,5%{opacity:0} 20%,70%{opacity:0.7} 90%,100%{opacity:0}
        }
        @keyframes fnd-eye2 {
          0%,20%{opacity:0} 40%,70%{opacity:0.7} 90%,100%{opacity:0}
        }
        @keyframes fnd-eye3 {
          0%,40%{opacity:0} 60%,80%{opacity:0.5} 95%,100%{opacity:0}
        }
      `}</style>
      <Felt />
      <Emoji x={45} y={45} size={26}>👁️</Emoji>
      <line x1={58} y1={50} x2={150} y2={90} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'fnd-eye1 3s ease-in-out infinite'}} />
      <line x1={150} y1={90} x2={230} y2={55} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'fnd-eye2 3s ease-in-out infinite'}} />
      <line x1={230} y1={55} x2={285} y2={14} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'fnd-eye3 3s ease-in-out infinite'}} />
      <Ball cx={150} cy={90} r={7} color={CHALK} />
      <Ball cx={230} cy={55} r={7} color="#f87171" />
      <Label x={150} y={138} size={7} opacity={0.7}>let your eyes walk the line first</Label>
    </g>
  )
}

function FollowThroughFinishingTheShot() {
  return (
    <g>
      <style>{`
        @keyframes fnd-follow-ball { 0%,15%{transform:translate(0px,0px)} 50%,65%{transform:translate(7px,-2px)} 100%{transform:translate(0px,0px)} }
        @keyframes fnd-follow-cue { 0%,15%{transform:translate(0px,0px)} 50%,65%{transform:translate(8px,-2px)} 100%{transform:translate(0px,0px)} }
      `}</style>
      <Felt />
      {/* cue ball mid-roll toward object ball */}
      <g style={{animation:'fnd-follow-ball 2.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={150} cy={85} r={7} color={CHALK} />
      </g>
      <Ball cx={235} cy={62} r={7} color="#60a5fa" />
      <line x1={120} y1={97} x2={150} y2={85} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* cue follows through past where the ball was struck */}
      <g style={{animation:'fnd-follow-cue 2.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={45} y1={118} x2={170} y2={80} />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>the cue finishes where the ball started</Label>
    </g>
  )
}

function WarmUpRoutineBeforeYouPlay() {
  return (
    <g>
      <style>{`
        @keyframes fnd-ball1 { 0%,5%{opacity:0} 20%,90%{opacity:1} 100%{opacity:0} }
        @keyframes fnd-ball2 { 0%,20%{opacity:0} 35%,90%{opacity:1} 100%{opacity:0} }
        @keyframes fnd-ball3 { 0%,35%{opacity:0} 50%,90%{opacity:1} 100%{opacity:0} }
        @keyframes fnd-ball-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}</style>
      <Felt />
      <Emoji x={150} y={68} size={34}>🤸</Emoji>
      <g style={{animation:'fnd-ball1 3s ease-in-out infinite'}}>
        <Ball cx={60} cy={120} r={6} color="#f5c518" />
      </g>
      <g style={{animation:'fnd-ball2 3s ease-in-out infinite'}}>
        <Ball cx={80} cy={120} r={6} color="#60a5fa" />
      </g>
      <g style={{animation:'fnd-ball3 3s ease-in-out infinite'}}>
        <Ball cx={100} cy={120} r={6} color="#22c55e" />
      </g>
      <Emoji x={250} y={40} size={20}>⏱️</Emoji>
      <Label x={150} y={138} size={7} opacity={0.7}>loosen up before it counts</Label>
    </g>
  )
}

export const FUNDAMENTALS_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'build-a-repeatable-stance': BuildARepeatableStance,
  'the-pendulum-grip': ThePendulumGrip,
  'bridge-hand-unsung-hero': BridgeHandUnsungHero,
  'anatomy-of-a-smooth-stroke': AnatomyOfASmoothStroke,
  'eye-pattern-and-alignment': EyePatternAndAlignment,
  'follow-through-finishing-the-shot': FollowThroughFinishingTheShot,
  'warm-up-routine-before-you-play': WarmUpRoutineBeforeYouPlay,
}
