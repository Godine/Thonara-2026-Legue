import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#f5c518' // fundamentals category color

function BuildARepeatableStance() {
  // Bridge pose body geometry: hip at (cx,cy), head at (cx+5,cy-15),
  // bridge-hand arm end at (cx+15,cy+7), legs at (cx-2/+10, cy+16/17)
  return (
    <g>
      <style>{`
        @keyframes fnd-ring1 {
          0%,5%{transform:scale(0);opacity:0}
          18%,35%{transform:scale(1);opacity:1}
          55%,100%{transform:scale(0.6);opacity:0.25}
        }
        @keyframes fnd-ring2 {
          0%,38%{transform:scale(0);opacity:0}
          51%,68%{transform:scale(1);opacity:1}
          82%,100%{transform:scale(0.6);opacity:0.25}
        }
        @keyframes fnd-ring3 {
          0%,62%{transform:scale(0);opacity:0}
          75%,90%{transform:scale(1);opacity:1}
          98%,100%{transform:scale(0.6);opacity:0.25}
        }
        @keyframes fnd-lock {
          0%,90%{opacity:0;transform:scale(0.5)}
          95%,98%{opacity:1;transform:scale(1)}
          100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={100} cy={95} color={ACCENT} pose="bridge" />
      <Ball cx={205} cy={73} r={7} color={CHALK} />
      {/* ring 1: feet — legs extend to ~(cy+16) */}
      <circle cx={104} cy={112} r="11" fill="none" stroke={ACCENT} strokeWidth="1.8"
        style={{transformBox:'fill-box', transformOrigin:'center', animation:'fnd-ring1 4s ease-in-out infinite'}} />
      {/* ring 2: bridge hand — right arm end at (cx+15, cy+7) */}
      <circle cx={115} cy={102} r="10" fill="none" stroke={ACCENT} strokeWidth="1.8"
        style={{transformBox:'fill-box', transformOrigin:'center', animation:'fnd-ring2 4s ease-in-out infinite'}} />
      {/* ring 3: shooting eye — head at (cx+5, cy-15) */}
      <circle cx={105} cy={80} r="9" fill="none" stroke={ACCENT} strokeWidth="1.8"
        style={{transformBox:'fill-box', transformOrigin:'center', animation:'fnd-ring3 4s ease-in-out infinite'}} />
      <g style={{transformOrigin:'100px 58px', animation:'fnd-lock 4s ease-in-out infinite'}}>
        <Label x={100} y={60} size={11} color={GOLD} weight="bold">✓</Label>
      </g>
      <Label x={200} y={138} size={7} opacity={0.7}>same checkpoints, every time</Label>
    </g>
  )
}

function ThePendulumGrip() {
  // ±12° rotation around elbow/grip pivot (175,88)
  // tip swings from y≈84 (at -12°) to y≈131 (at +12°) — 47px visible arc
  return (
    <g>
      <style>{`
        @keyframes fnd-pendulum {
          0%,100%{transform:rotate(-12deg)}
          50%{transform:rotate(12deg)}
        }
        @keyframes fnd-arc-draw {
          0%,5%{stroke-dashoffset:110;stroke-dasharray:110}
          60%,80%{stroke-dashoffset:0;stroke-dasharray:110}
          100%{stroke-dashoffset:110;stroke-dasharray:110}
        }
      `}</style>
      <Felt pockets={false} />
      {/* cue swings around elbow pivot */}
      <g style={{transformOrigin:'175px 88px', animation:'fnd-pendulum 2s ease-in-out infinite'}}>
        <Cue x1={60} y1={108} x2={235} y2={62} />
      </g>
      {/* grip oval marks the pivot point */}
      <ellipse cx={175} cy={88} rx="11" ry="7" fill="none" stroke={ACCENT} strokeWidth="1.8" />
      {/* arc tracing the tip's range of motion */}
      <path d="M 61 85 A 117 117 0 0 1 68 131"
        fill="none" stroke={CHALK} strokeWidth="1.2" opacity="0.5"
        style={{strokeDasharray:110, strokeDashoffset:110, animation:'fnd-arc-draw 2s ease-in-out infinite'}} />
      <Label x={175} y={40} size={7} opacity={0.7}>pivot at the elbow</Label>
      <Label x={175} y={130} size={7} opacity={0.6}>loose grip = free pendulum</Label>
    </g>
  )
}

function BridgeHandUnsungHero() {
  // cue direction (70,120)→(195,78): unit=(0.947,-0.318)
  // 26px stroke → translate(24.6,-8.3) ≈ (25,-8)
  return (
    <g>
      <style>{`
        @keyframes fnd-cue-stroke {
          0%,10%{transform:translate(0px,0px)}
          35%,58%{transform:translate(25px,-8px)}
          80%,100%{transform:translate(0px,0px)}
        }
      `}</style>
      <Felt />
      {/* V bridge groove — fixed anchor, does not move */}
      <line x1={108} y1={100} x2={150} y2={84} stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={132} y1={100} x2={150} y2={84} stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
      {/* cue slides 25px through the groove and back */}
      <g style={{animation:'fnd-cue-stroke 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={70} y1={120} x2={195} y2={78} />
      </g>
      <Ball cx={200} cy={75} r={7} color={CHALK} />
      <Ball cx={255} cy={58} r={7} color="#ef4444" />
      <Label x={155} y={138} size={7} opacity={0.75}>bridge locks the line</Label>
    </g>
  )
}

function AnatomyOfASmoothStroke() {
  // cue (95,105)→(210,78): direction unit=(0.974,-0.229)
  // back 19px → translate(-18.5,4.4) ≈ (-19,4)
  // through 26px past start → translate(25.3,-5.9) ≈ (25,-6)
  // ball at (215,76) rolls 52px to (267,64) where green target ball sits
  return (
    <g>
      <style>{`
        @keyframes fnd-cue-anim {
          0%,5%{transform:translate(0px,0px)}
          22%,40%{transform:translate(-19px,4px)}
          55%,70%{transform:translate(25px,-6px)}
          85%,100%{transform:translate(0px,0px)}
        }
        @keyframes fnd-ball-roll {
          0%,53%{transform:translate(0px,0px)}
          70%,82%{transform:translate(52px,-12px)}
          97%,100%{transform:translate(0px,0px)}
        }
        @keyframes fnd-lbl-back {
          0%,15%{opacity:0} 25%,40%{opacity:1} 50%,100%{opacity:0}
        }
        @keyframes fnd-lbl-thru {
          0%,50%{opacity:0} 58%,70%{opacity:1} 80%,100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={68} cy={95} color={ACCENT} pose="aim" />
      <g style={{animation:'fnd-cue-anim 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={95} y1={105} x2={210} y2={78} />
      </g>
      <g style={{animation:'fnd-ball-roll 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={215} cy={76} r={7} color={CHALK} />
      </g>
      <Ball cx={267} cy={64} r={7} color="#22c55e" />
      <g style={{animation:'fnd-lbl-back 3.5s ease-in-out infinite'}}>
        <Label x={155} y={125} size={8} color={ACCENT} weight="bold">BACK</Label>
      </g>
      <g style={{animation:'fnd-lbl-thru 3.5s ease-in-out infinite'}}>
        <Label x={155} y={125} size={8} color={GOLD} weight="bold">THROUGH</Label>
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>smooth back, smooth through</Label>
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
  // Ball rolls 140px from (120,92) to (260,66) — huge visible travel
  // Cue tip extends 34px so it reaches ~where ball started
  // cue direction (45,118)→(85,102): unit=(0.928,-0.372) → 34px=(31.6,-12.6)≈(32,-13)
  return (
    <g>
      <style>{`
        @keyframes fnd-foll-ball {
          0%,12%{transform:translate(0px,0px)}
          50%,68%{transform:translate(140px,-26px)}
          85%,100%{transform:translate(0px,0px)}
        }
        @keyframes fnd-foll-cue {
          0%,12%{transform:translate(0px,0px)}
          50%,68%{transform:translate(32px,-13px)}
          85%,100%{transform:translate(0px,0px)}
        }
      `}</style>
      <Felt />
      {/* dashed guide showing cue-to-ball gap before shot */}
      <line x1={85} y1={102} x2={120} y2={92} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      {/* cue follows through as ball leaves */}
      <g style={{animation:'fnd-foll-cue 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={45} y1={118} x2={85} y2={102} />
      </g>
      {/* ball rolls the full width of the table */}
      <g style={{animation:'fnd-foll-ball 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={120} cy={92} r={7} color={CHALK} />
      </g>
      <Ball cx={260} cy={66} r={7} color="#60a5fa" />
      <Label x={150} y={138} size={7} opacity={0.7}>cue tip reaches where ball started</Label>
    </g>
  )
}

function WarmUpRoutineBeforeYouPlay() {
  return (
    <g>
      <style>{`
        @keyframes fnd-stroke {
          0%,10%{transform:translate(0px,0px)}
          30%,52%{transform:translate(20px,-5px)}
          72%,100%{transform:translate(0px,0px)}
        }
        @keyframes fnd-ball1 {
          0%,5%{opacity:0;transform:scale(0)} 22%,85%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0)}
        }
        @keyframes fnd-ball2 {
          0%,22%{opacity:0;transform:scale(0)} 40%,85%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0)}
        }
        @keyframes fnd-ball3 {
          0%,40%{opacity:0;transform:scale(0)} 58%,85%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0)}
        }
      `}</style>
      <Felt />
      <StickFigure cx={70} cy={98} color={ACCENT} pose="aim" />
      <g style={{animation:'fnd-stroke 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Cue x1={95} y1={110} x2={175} y2={88} />
      </g>
      <Ball cx={180} cy={86} r={6} color={CHALK} />
      <g style={{animation:'fnd-ball1 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={215} cy={74} r={5} color="#f5c518" />
      </g>
      <g style={{animation:'fnd-ball2 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={237} cy={66} r={5} color="#60a5fa" />
      </g>
      <g style={{animation:'fnd-ball3 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={259} cy={58} r={5} color="#22c55e" />
      </g>
      <Emoji x={250} y={38} size={20}>⏱️</Emoji>
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
