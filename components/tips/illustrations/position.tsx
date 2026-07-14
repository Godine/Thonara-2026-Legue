import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#22c55e' // position play category color

function MasteringTheFollowShot() {
  return (
    <g>
      <style>{`
        @keyframes pos-follow-ball {
          0%,5%{transform:translateX(-105px) translateY(29px)}
          50%,65%{transform:translateX(0px) translateY(0px)}
          80%,100%{transform:translateX(-105px) translateY(29px)}
        }
        @keyframes pos-follow-line {
          0%,5%{stroke-dashoffset:109; stroke-dasharray:109}
          50%,70%{stroke-dashoffset:0; stroke-dasharray:109}
          85%,100%{stroke-dashoffset:109; stroke-dasharray:109}
        }
      `}</style>
      <Felt />
      <StickFigure cx={55} cy={95} color={ACCENT} pose="bridge" />
      <Cue x1={80} y1={108} x2={150} y2={88} />
      {/* cue ball incoming */}
      <Ball cx={155} cy={87} r={7} color={CHALK} />
      <line x1={95} y1={104} x2={150} y2={88} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* object ball at contact point */}
      <Ball cx={205} cy={73} r={7} color="#60a5fa" />
      {/* cue ball rolls through and past the object ball */}
      <line x1={155} y1={87} x2={260} y2={58} stroke={CHALK} strokeWidth="1.5" opacity="0.7"
        style={{animation:'pos-follow-line 3s ease-in-out infinite'}} />
      <g style={{animation:'pos-follow-ball 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={260} cy={58} r={7} color={CHALK} />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>rolls through after contact</Label>
    </g>
  )
}

function MasteringTheDrawShot() {
  return (
    <g>
      <style>{`
        @keyframes pos-draw-ball {
          0%,5%{transform:translateX(55px) translateY(-9px)}
          50%,65%{transform:translateX(0px) translateY(0px)}
          80%,100%{transform:translateX(55px) translateY(-9px)}
        }
        @keyframes pos-draw-path {
          0%,5%{stroke-dashoffset:62; stroke-dasharray:62}
          50%,70%{stroke-dashoffset:0; stroke-dasharray:62}
          85%,100%{stroke-dashoffset:62; stroke-dasharray:62}
        }
      `}</style>
      <Felt />
      <StickFigure cx={55} cy={95} color={ACCENT} pose="bridge" />
      <Cue x1={80} y1={108} x2={150} y2={88} />
      {/* cue ball incoming */}
      <Ball cx={155} cy={87} r={7} color={CHALK} />
      <line x1={95} y1={104} x2={150} y2={88} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* object ball at contact point */}
      <Ball cx={210} cy={72} r={7} color="#60a5fa" />
      {/* cue ball spins back toward where it came from */}
      <path d="M 155 87 Q 130 100 100 96" fill="none" stroke={CHALK} strokeWidth="1.5" opacity="0.7"
        style={{animation:'pos-draw-path 3s ease-in-out infinite'}} />
      <g style={{animation:'pos-draw-ball 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={100} cy={96} r={7} color={CHALK} />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>spins back after contact</Label>
    </g>
  )
}

function SpeedControlPowerScale() {
  const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <g>
      <style>{`
        @keyframes pos-marker-slide {
          0%,10%{transform:translateX(0px)} 35%{transform:translateX(-60px)} 65%{transform:translateX(60px)} 90%,100%{transform:translateX(0px)}
        }
        @keyframes pos-label-pulse { 0%,100%{opacity:0.9} 50%{opacity:0.4} }
      `}</style>
      <Felt pockets={false} />
      <StickFigure cx={45} cy={100} color={ACCENT} pose="aim" flip />
      <Ball cx={75} cy={95} r={6} color={CHALK} />
      {/* gauge line */}
      <line x1={95} y1={75} x2={275} y2={75} stroke={CHALK} strokeWidth="1.5" opacity="0.6" />
      {ticks.map((t, i) => {
        const x = 95 + (i * 180) / 9
        return (
          <g key={t}>
            <line x1={x} y1={70} x2={x} y2={80} stroke={CHALK} strokeWidth="1" opacity="0.5" />
            <Label x={x} y={92} size={6} opacity={0.6}>{t}</Label>
          </g>
        )
      })}
      {/* marker on "5" */}
      <g style={{animation:'pos-marker-slide 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <circle cx={95 + (4 * 180) / 9} cy={75} r="5" fill={GOLD} opacity="0.85" />
        <Label x={95 + (4 * 180) / 9} y={55} size={7} color={GOLD} weight="bold">5</Label>
      </g>
      <Label x={185} y={138} size={7} opacity={0.7}>give every shot a number</Label>
    </g>
  )
}

function TheTwoWayShot() {
  return (
    <g>
      <style>{`
        @keyframes pos-pot-path {
          0%,5%{opacity:0} 15%,45%{opacity:0.85} 55%,100%{opacity:0}
        }
        @keyframes pos-miss-path {
          0%,55%{opacity:0} 65%,90%{opacity:0.6} 100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={50} cy={98} color={ACCENT} pose="bridge" />
      <Cue x1={75} y1={110} x2={140} y2={92} />
      <Ball cx={145} cy={91} r={7} color={CHALK} />
      {/* object ball as the pivot */}
      <Ball cx={200} cy={75} r={7} color="#60a5fa" />
      {/* path A: the pot attempt, toward a corner pocket */}
      <line x1={145} y1={91} x2={200} y2={75} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      <path d="M 200 75 L 270 22" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 2"
        style={{animation:'pos-pot-path 4s ease-in-out infinite'}} />
      <Label x={250} y={40} size={7} color={GOLD} opacity={0.9}>pot</Label>
      {/* path B: if it misses, cue ball tucks safe near a rail */}
      <path d="M 200 75 Q 175 110 120 122" fill="none" stroke={CHALK} strokeWidth="1.2" strokeDasharray="2 2"
        style={{animation:'pos-miss-path 4s ease-in-out infinite'}} />
      <Ball cx={120} cy={122} r={6} color={CHALK} />
      <Label x={120} y={108} size={6} opacity={0.6}>miss</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>a good shot either way</Label>
    </g>
  )
}

function PositionZonesNotPoints() {
  return (
    <g>
      <style>{`
        @keyframes pos-zone-pulse { 0%,100%{opacity:0.18} 50%{opacity:0.35} }
        @keyframes pos-zone-ball { 0%,100%{transform:translateX(0px) translateY(0px)} 33%{transform:translateX(-4px) translateY(2px)} 66%{transform:translateX(4px) translateY(-2px)} }
      `}</style>
      <Felt />
      <Ball cx={120} cy={80} r={7} color="#60a5fa" />
      {/* generous landing zone */}
      <ellipse cx={205} cy={65} rx="38" ry="24" fill={ACCENT} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'pos-zone-pulse 2.5s ease-in-out infinite'}} />
      <g style={{animation:'pos-zone-ball 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={205} cy={65} r={7} color={CHALK} />
      </g>
      {/* old pinpoint approach, a tiny dot */}
      <circle cx={205} cy={65} r="1.5" fill={GOLD} opacity="0.9" />
      <line x1={120} y1={80} x2={205} y2={65} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      <Label x={205} y={40} size={7} opacity={0.7}>any spot in here works</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>aim for a zone, not a pin</Label>
    </g>
  )
}

export const POSITION_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'mastering-the-follow-shot': MasteringTheFollowShot,
  'mastering-the-draw-shot': MasteringTheDrawShot,
  'speed-control-power-scale': SpeedControlPowerScale,
  'the-two-way-shot': TheTwoWayShot,
  'position-zones-not-points': PositionZonesNotPoints,
}
