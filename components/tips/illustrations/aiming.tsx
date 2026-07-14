import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#60a5fa' // aiming category color

function FractionalAiming() {
  // Cueball travels 105px from (78,112) to contact ghost (183,80) near object ball
  // Deflection line draws in at the moment of contact
  return (
    <g>
      <style>{`
        @keyframes aim-cueball-slide {
          0%,8%{transform:translate(0px,0px)}
          45%,65%{transform:translate(105px,-32px)}
          82%,100%{transform:translate(0px,0px)}
        }
        @keyframes aim-deflect-draw {
          0%,43%{stroke-dashoffset:92;stroke-dasharray:92}
          65%,80%{stroke-dashoffset:0;stroke-dasharray:92}
          94%,100%{stroke-dashoffset:92;stroke-dasharray:92}
        }
      `}</style>
      <Felt />
      {/* ghost outline shows the required contact position */}
      <circle cx={183} cy={80} r="7" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.45" />
      {/* cue ball slides 105px from far left to the contact position */}
      <g style={{animation:'aim-cueball-slide 3.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={78} cy={112} r={7} color={CHALK} />
      </g>
      {/* object ball */}
      <Ball cx={195} cy={75} r={7} color="#ef4444" />
      {/* half-ball divider */}
      <line x1={195} y1={62} x2={195} y2={88} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      {/* quarter mark */}
      <line x1={189} y1={64} x2={189} y2={86} stroke={ACCENT} strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.4" />
      {/* deflection line to pocket — draws in after contact */}
      <line x1={195} y1={75} x2={262} y2={28} stroke={GOLD} strokeWidth="1" opacity="0.7"
        style={{animation:'aim-deflect-draw 3.5s ease-in-out infinite'}} />
      <Label x={250} y={22} size={7} color={GOLD} opacity={0.8}>~30°</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>half ball, quarter ball, full ball</Label>
    </g>
  )
}

function FindingYourDominantEye() {
  return (
    <g>
      <style>{`
        @keyframes aim-tri-drift { 0%,100%{transform:translateX(0px)} 50%{transform:translateX(-14px)} }
        @keyframes aim-sight-pulse { 0%,100%{opacity:0.7} 50%{opacity:0.2} }
      `}</style>
      <Felt />
      <StickFigure cx={62} cy={95} color={ACCENT} pose="stand" />
      <Emoji x={62} y={62} size={16}>👁️</Emoji>
      {/* hand-frame triangle drifts 14px toward the dominant eye side */}
      <g style={{animation:'aim-tri-drift 2.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <polygon points="115,90 145,75 145,105" fill="none" stroke={CHALK} strokeWidth="1.2" opacity="0.7" />
      </g>
      {/* sight line to the target ball */}
      <line x1={62} y1={88} x2={250} y2={50} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-sight-pulse 2.5s ease-in-out infinite'}} />
      <Ball cx={250} cy={50} r={7} color="#22c55e" />
      <Label x={150} y={138} size={7} opacity={0.7}>the frame drifts toward your dominant eye</Label>
    </g>
  )
}

function AimingThinCutsWithoutFear() {
  return (
    <g>
      <style>{`
        @keyframes aim-thin-draw {
          0%,10%{stroke-dashoffset:90;stroke-dasharray:90} 55%,75%{stroke-dashoffset:0;stroke-dasharray:90} 90%,100%{stroke-dashoffset:90;stroke-dasharray:90}
        }
        @keyframes aim-thin-flash {
          0%,55%{opacity:0.7} 65%,75%{opacity:1} 80%,100%{opacity:0.7}
        }
      `}</style>
      <Felt />
      <Ball cx={120} cy={100} r={7} color={CHALK} />
      <Ball cx={210} cy={70} r={7} color="#f5c518" />
      {/* ghost ball outline at thin-contact position — grazing the far edge */}
      <circle cx={221} cy={62} r="7" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* contact line grazing the far edge */}
      <line x1={120} y1={100} x2={216} y2={65} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      {/* object ball deflects sharply toward the pocket */}
      <line x1={210} y1={70} x2={283} y2={18} stroke={GOLD} strokeWidth="1" opacity="0.7"
        style={{animation:'aim-thin-draw 3s ease-in-out infinite'}} />
      <Label x={150} y={138} size={7} opacity={0.7}>aim at the edge, not the middle</Label>
    </g>
  )
}

function ReadingCombinationShots() {
  return (
    <g>
      <style>{`
        @keyframes aim-combo1 { 0%,5%{opacity:0} 18%,72%{opacity:0.7} 88%,100%{opacity:0} }
        @keyframes aim-combo2 { 0%,18%{opacity:0} 35%,72%{opacity:0.7} 88%,100%{opacity:0} }
        @keyframes aim-combo3 { 0%,35%{opacity:0} 52%,72%{opacity:0.7} 88%,100%{opacity:0} }
      `}</style>
      <Felt />
      <Ball cx={70} cy={108} r={7} color={CHALK} />
      <Ball cx={155} cy={82} r={7} color="#f5c518" label="A" />
      <Ball cx={225} cy={50} r={7} color="#ef4444" label="B" />
      {/* chain reaction lines appear in sequence — each adds more error */}
      <line x1={70} y1={108} x2={155} y2={82} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-combo1 3s ease-in-out infinite'}} />
      <line x1={155} y1={82} x2={225} y2={50} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-combo2 3s ease-in-out infinite'}} />
      <line x1={225} y1={50} x2={283} y2={18} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-combo3 3s ease-in-out infinite'}} />
      <Label x={150} y={138} size={7} opacity={0.7}>every extra ball multiplies the error</Label>
    </g>
  )
}

function WhyProsRecheckAimTwice() {
  return (
    <g>
      <style>{`
        @keyframes aim-look1 { 0%,10%{opacity:0.7} 40%,60%{opacity:0.15} 90%,100%{opacity:0.7} }
        @keyframes aim-look2 { 0%,10%{opacity:0.15} 40%,60%{opacity:0.55} 90%,100%{opacity:0.15} }
      `}</style>
      <Felt />
      <StickFigure cx={70} cy={100} color={ACCENT} pose="aim" />
      <Cue x1={100} y1={112} x2={205} y2={82} />
      <Ball cx={210} cy={80} r={7} color={CHALK} />
      <Ball cx={262} cy={48} r={7} color="#22c55e" />
      {/* two sight-lines alternating: first look at cueball, second look at pocket */}
      <line x1={76} y1={80} x2={210} y2={80} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-look1 3s ease-in-out infinite'}} />
      <line x1={76} y1={80} x2={262} y2={48} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'aim-look2 3s ease-in-out infinite'}} />
      <Label x={80} y={72} size={6} color={GOLD} opacity={0.75}>1st look</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>look, look again, then shoot</Label>
    </g>
  )
}

export const AIMING_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'fractional-aiming': FractionalAiming,
  'finding-your-dominant-eye': FindingYourDominantEye,
  'aiming-thin-cuts-without-fear': AimingThinCutsWithoutFear,
  'reading-combination-shots': ReadingCombinationShots,
  'why-pros-recheck-aim-twice': WhyProsRecheckAimTwice,
}
