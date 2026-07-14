import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#22c55e' // position play category color

function MasteringTheFollowShot() {
  // ONE cue ball travels: start (155,87) → contact (205,73) → PAST to (258,56)
  // translate to contact: (50,-14); translate past OB: (103,-31)
  // The ball CONTINUES forward = topspin follow shot
  return (
    <g>
      <style>{`
        @keyframes pos-follow-travel {
          0%,8%{transform:translate(0px,0px)}
          40%{transform:translate(50px,-14px)}
          43%{transform:translate(50px,-14px)}
          72%{transform:translate(103px,-31px)}
          85%{transform:translate(103px,-31px)}
          100%{transform:translate(0px,0px)}
        }
        @keyframes pos-follow-flash {
          0%,40%{opacity:0} 42%,48%{opacity:0.85} 55%,100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={55} cy={95} color={ACCENT} pose="bridge" />
      <Cue x1={80} y1={108} x2={152} y2={88} />
      {/* approach guide */}
      <line x1={95} y1={104} x2={150} y2={88} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      {/* object ball — stays fixed */}
      <Ball cx={205} cy={73} r={7} color="#60a5fa" />
      {/* ONE cue ball: travels forward through the object ball and continues past it */}
      <g style={{animation:'pos-follow-travel 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={155} cy={87} r={7} color={CHALK} />
      </g>
      {/* contact flash ring at object ball position */}
      <circle cx={205} cy={73} r="13" fill="none" stroke={CHALK} strokeWidth="1.5" opacity="0"
        style={{animation:'pos-follow-flash 3.5s ease-in-out infinite'}} />
      <Label x={150} y={138} size={7} opacity={0.7}>topspin rolls through contact</Label>
    </g>
  )
}

function MasteringTheDrawShot() {
  // ONE cue ball travels: start (155,87) → contact (205,72) → REVERSES to (112,99)
  // translate to contact: (50,-15); translate back: (-43,12)
  // The ball REVERSES = backspin draw shot
  return (
    <g>
      <style>{`
        @keyframes pos-draw-travel {
          0%,8%{transform:translate(0px,0px)}
          40%{transform:translate(50px,-15px)}
          43%{transform:translate(50px,-15px)}
          72%{transform:translate(-43px,12px)}
          85%{transform:translate(-43px,12px)}
          100%{transform:translate(0px,0px)}
        }
        @keyframes pos-draw-flash {
          0%,40%{opacity:0} 42%,48%{opacity:0.85} 55%,100%{opacity:0}
        }
      `}</style>
      <Felt />
      <StickFigure cx={55} cy={95} color={ACCENT} pose="bridge" />
      <Cue x1={80} y1={108} x2={152} y2={88} />
      <line x1={95} y1={104} x2={150} y2={88} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      {/* object ball — stays fixed */}
      <Ball cx={205} cy={72} r={7} color="#60a5fa" />
      {/* ONE cue ball: travels forward then REVERSES back toward the player */}
      <g style={{animation:'pos-draw-travel 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={155} cy={87} r={7} color={CHALK} />
      </g>
      <circle cx={205} cy={72} r="13" fill="none" stroke={CHALK} strokeWidth="1.5" opacity="0"
        style={{animation:'pos-draw-flash 3.5s ease-in-out infinite'}} />
      <Label x={150} y={138} size={7} opacity={0.7}>backspin reverses after contact</Label>
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
      {/* marker sweeps across the scale to show choosing a power level */}
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
      {/* object ball — the pivot */}
      <Ball cx={200} cy={75} r={7} color="#60a5fa" />
      <line x1={145} y1={91} x2={200} y2={75} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* path A: pot attempt toward corner pocket */}
      <path d="M 200 75 L 270 22" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 2"
        style={{animation:'pos-pot-path 4s ease-in-out infinite'}} />
      <Label x={250} y={40} size={7} color={GOLD} opacity={0.9}>pot</Label>
      {/* path B: on miss, cue ball tucks safe near the rail */}
      <path d="M 200 75 Q 175 110 120 122" fill="none" stroke={CHALK} strokeWidth="1.2" strokeDasharray="2 2"
        style={{animation:'pos-miss-path 4s ease-in-out infinite'}} />
      <Ball cx={120} cy={122} r={6} color={CHALK} />
      <Label x={120} y={108} size={6} opacity={0.6}>miss → safe</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>a good shot either way</Label>
    </g>
  )
}

function PositionZonesNotPoints() {
  return (
    <g>
      <style>{`
        @keyframes pos-zone-pulse { 0%,100%{opacity:0.18} 50%{opacity:0.38} }
        @keyframes pos-zone-ball {
          0%,100%{transform:translateX(0px) translateY(0px)}
          33%{transform:translateX(-10px) translateY(5px)}
          66%{transform:translateX(10px) translateY(-5px)}
        }
      `}</style>
      <Felt />
      <Ball cx={120} cy={80} r={7} color="#60a5fa" />
      {/* generous landing zone — aim for any spot in here */}
      <ellipse cx={205} cy={65} rx="38" ry="24" fill={ACCENT} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'pos-zone-pulse 2.5s ease-in-out infinite'}} />
      {/* cue ball wanders within the zone to show "anywhere here is fine" */}
      <g style={{animation:'pos-zone-ball 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={205} cy={65} r={7} color={CHALK} />
      </g>
      {/* tiny gold dot = the old "must hit this exact spot" mindset */}
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
