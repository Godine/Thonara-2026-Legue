import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#60a5fa' // aiming category color

function FractionalAiming() {
  return (
    <g>
      <Felt />
      {/* cue ball at a half-ball overlap with the object ball */}
      <Ball cx={140} cy={95} r={7} color={CHALK} />
      <Ball cx={195} cy={75} r={7} color="#ef4444" />
      {/* vertical dashed line splitting the object ball into halves */}
      <line x1={195} y1={62} x2={195} y2={88} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      {/* quarter mark */}
      <line x1={189} y1={64} x2={189} y2={86} stroke={ACCENT} strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.4" />
      {/* deflection line toward the pocket */}
      <line x1={195} y1={75} x2={262} y2={28} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <Label x={250} y={22} size={7} color={GOLD} opacity={0.8}>~30°</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>half ball, quarter ball, full ball</Label>
    </g>
  )
}

function FindingYourDominantEye() {
  return (
    <g>
      <Felt />
      <StickFigure cx={62} cy={95} color={ACCENT} pose="stand" />
      <Emoji x={62} y={62} size={16}>👁️</Emoji>
      {/* hand-frame triangle held out at arm's length */}
      <polygon points="115,90 145,75 145,105" fill="none" stroke={CHALK} strokeWidth="1.2" opacity="0.7" />
      {/* sight line drifting through the frame to the ball */}
      <line x1={62} y1={88} x2={250} y2={50} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <Ball cx={250} cy={50} r={7} color="#22c55e" />
      <Label x={150} y={138} size={7} opacity={0.7}>the frame drifts toward your dominant eye</Label>
    </g>
  )
}

function AimingThinCutsWithoutFear() {
  return (
    <g>
      <Felt />
      <Ball cx={120} cy={100} r={7} color={CHALK} />
      <Ball cx={210} cy={70} r={7} color="#f5c518" />
      {/* faint ghost-ball outline mostly off to the side */}
      <circle cx={221} cy={62} r="7" fill="none" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
      {/* contact line grazing the far edge for a thin cut */}
      <line x1={120} y1={100} x2={216} y2={65} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      {/* object ball deflects sharply toward the pocket */}
      <line x1={210} y1={70} x2={283} y2={18} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <Label x={150} y={138} size={7} opacity={0.7}>aim at the edge, not the middle</Label>
    </g>
  )
}

function ReadingCombinationShots() {
  return (
    <g>
      <Felt />
      <Ball cx={70} cy={108} r={7} color={CHALK} />
      <Ball cx={155} cy={82} r={7} color="#f5c518" label="A" />
      <Ball cx={225} cy={50} r={7} color="#ef4444" label="B" />
      {/* chain reaction lines */}
      <line x1={70} y1={108} x2={155} y2={82} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <line x1={155} y1={82} x2={225} y2={50} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <line x1={225} y1={50} x2={283} y2={18} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <Label x={150} y={138} size={7} opacity={0.7}>every extra ball multiplies the error</Label>
    </g>
  )
}

function WhyProsRecheckAimTwice() {
  return (
    <g>
      <Felt />
      <StickFigure cx={70} cy={100} color={ACCENT} pose="aim" />
      <Cue x1={100} y1={112} x2={205} y2={82} />
      <Ball cx={210} cy={80} r={7} color={CHALK} />
      <Ball cx={262} cy={48} r={7} color="#22c55e" />
      {/* two sight-lines, looked at twice */}
      <line x1={76} y1={80} x2={210} y2={80} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <line x1={76} y1={80} x2={262} y2={48} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
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
