import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#f87171' // spin & english category color

function SquirtAndDeflection() {
  return (
    <g>
      <Felt />
      <StickFigure cx={62} cy={95} color={ACCENT} pose="aim" />
      <Cue x1={90} y1={108} x2={155} y2={84} />
      <Ball cx={158} cy={82} r={7} color={CHALK} />
      {/* aim line: where the cue was pointed */}
      <line x1={158} y1={82} x2={250} y2={50} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      {/* actual path: squirts slightly off the aim line */}
      <path d="M 158 82 Q 200 78 248 64" fill="none" stroke={ACCENT} strokeWidth="1.4" opacity="0.85" />
      <Ball cx={250} cy={50} r={6} color="#60a5fa" />
      <Label x={150} y={138} size={7} opacity={0.7}>aim line vs. actual path</Label>
    </g>
  )
}

function ThrowHowSpinChangesObjectBall() {
  return (
    <g>
      <Felt />
      <Ball cx={95} cy={95} r={7} color={CHALK} />
      {/* sidespin marker on cue ball */}
      <circle cx={97} cy={92} r="1.6" fill={ACCENT} />
      <path d="M 90 88 A 8 8 0 0 1 90 102" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6" />
      <line x1={102} y1={92} x2={158} y2={75} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      <Ball cx={160} cy={74} r={7} color="#60a5fa" />
      {/* expected straight path */}
      <line x1={160} y1={74} x2={245} y2={50} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.55" />
      {/* thrown path, bent off the expected line */}
      <path d="M 160 74 Q 205 80 248 62" fill="none" stroke={ACCENT} strokeWidth="1.4" opacity="0.9" />
      <Label x={150} y={138} size={7} opacity={0.7}>spin nudges the object ball</Label>
    </g>
  )
}

function CombiningVerticalAndSideSpin() {
  const r = 38
  const cx = 150
  const cy = 70
  return (
    <g>
      <Felt pockets={false} />
      <Ball cx={cx} cy={cy} r={r} color={CHALK} />
      {/* 3x3 grid on the cue ball face */}
      {[-1, 1].map((i) => (
        <line
          key={`v${i}`}
          x1={cx + i * (r / 3)}
          y1={cy - r}
          x2={cx + i * (r / 3)}
          y2={cy + r}
          stroke={ACCENT}
          strokeWidth="0.6"
          opacity="0.45"
        />
      ))}
      {[-1, 1].map((i) => (
        <line
          key={`h${i}`}
          x1={cx - r}
          y1={cy + i * (r / 3)}
          x2={cx + r}
          y2={cy + i * (r / 3)}
          stroke={ACCENT}
          strokeWidth="0.6"
          opacity="0.45"
        />
      ))}
      {/* outer ring boundary already given by the ball circle; highlight a low-left outer cell */}
      <circle cx={cx - (2 * r) / 3} cy={cy + (2 * r) / 3} r="3" fill={ACCENT} />
      <Label x={150} y={138} size={7} opacity={0.7}>blend top/bottom with side</Label>
    </g>
  )
}

function WhenNotToUseEnglish() {
  return (
    <g>
      <Felt pockets={false} />
      {/* left scene: center hit, clean */}
      <Ball cx={95} cy={75} r={16} color={CHALK} />
      <circle cx={95} cy={75} r="2" fill="#22c55e" />
      <Label x={95} y={106} size={9} color="#22c55e" weight="bold">{'✓'}</Label>
      <Label x={95} y={40} size={7} opacity={0.7}>center hit</Label>
      {/* right scene: off-center english, risky */}
      <Ball cx={210} cy={75} r={16} color={CHALK} />
      <circle cx={216} cy={68} r="2" fill={ACCENT} />
      <line x1={210} y1={62} x2={222} y2={50} stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
      <line x1={222} y1={62} x2={210} y2={50} stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
      <Label x={210} y={40} size={7} opacity={0.7}>extra english</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>center hit, fewer ways to miss</Label>
    </g>
  )
}

function MasseAndJumpShots() {
  return (
    <g>
      <Felt />
      {/* steep, near-vertical cue */}
      <Cue x1={180} y1={30} x2={170} y2={100} />
      <Ball cx={168} cy={104} r={7} color={CHALK} />
      {/* blocking ball directly in the straight-line path */}
      <Ball cx={205} cy={90} r={7} color="#60a5fa" />
      {/* curving path around the blocker */}
      <path d="M 168 104 C 185 130 230 130 245 95 C 250 80 245 60 235 50" fill="none" stroke={ACCENT} strokeWidth="1.4" strokeDasharray="3 2" opacity="0.85" />
      <Ball cx={235} cy={50} r={6} color="#f5c518" />
      <Label x={150} y={138} size={7} opacity={0.7}>last-resort rescue shots</Label>
    </g>
  )
}

export const SPIN_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'squirt-and-deflection': SquirtAndDeflection,
  'throw-how-spin-changes-object-ball': ThrowHowSpinChangesObjectBall,
  'combining-vertical-and-side-spin': CombiningVerticalAndSideSpin,
  'when-not-to-use-english': WhenNotToUseEnglish,
  'masse-and-jump-shots': MasseAndJumpShots,
}
