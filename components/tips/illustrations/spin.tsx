import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#f87171' // spin & english category color

function SquirtAndDeflection() {
  return (
    <g>
      <style>{`
        @keyframes spn-actual-draw {
          0%,5%{stroke-dashoffset:95; stroke-dasharray:95} 50%,75%{stroke-dashoffset:0; stroke-dasharray:95} 90%,100%{stroke-dashoffset:95; stroke-dasharray:95}
        }
        @keyframes spn-aim-fade {
          0%,5%{opacity:0.6} 50%,75%{opacity:0.25} 90%,100%{opacity:0.6}
        }
      `}</style>
      <Felt />
      <StickFigure cx={62} cy={95} color={ACCENT} pose="aim" />
      <Cue x1={90} y1={108} x2={155} y2={84} />
      <Ball cx={158} cy={82} r={7} color={CHALK} />
      {/* aim line: where the cue was pointed */}
      <line x1={158} y1={82} x2={250} y2={50} stroke={GOLD} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'spn-aim-fade 3s ease-in-out infinite'}} />
      {/* actual path: squirts slightly off the aim line */}
      <path d="M 158 82 Q 200 78 248 64" fill="none" stroke={ACCENT} strokeWidth="1.4" opacity="0.85"
        style={{animation:'spn-actual-draw 3s ease-in-out infinite'}} />
      <Ball cx={250} cy={50} r={6} color="#60a5fa" />
      <Label x={150} y={138} size={7} opacity={0.7}>aim line vs. actual path</Label>
    </g>
  )
}

function ThrowHowSpinChangesObjectBall() {
  return (
    <g>
      <style>{`
        @keyframes spn-throw-draw {
          0%,5%{stroke-dashoffset:92; stroke-dasharray:92} 50%,75%{stroke-dashoffset:0; stroke-dasharray:92} 90%,100%{stroke-dashoffset:92; stroke-dasharray:92}
        }
        @keyframes spn-spin-arc {
          0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}
        }
      `}</style>
      <Felt />
      <Ball cx={95} cy={95} r={7} color={CHALK} />
      {/* sidespin marker on cue ball — rotates to show spin */}
      <g style={{transformOrigin:'95px 95px', animation:'spn-spin-arc 2s linear infinite'}}>
        <circle cx={97} cy={92} r="1.6" fill={ACCENT} />
        <path d="M 90 88 A 8 8 0 0 1 90 102" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6" />
      </g>
      <line x1={102} y1={92} x2={158} y2={75} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      <Ball cx={160} cy={74} r={7} color="#60a5fa" />
      {/* expected straight path */}
      <line x1={160} y1={74} x2={245} y2={50} stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.55" />
      {/* thrown path, bent off the expected line */}
      <path d="M 160 74 Q 205 80 248 62" fill="none" stroke={ACCENT} strokeWidth="1.4" opacity="0.9"
        style={{animation:'spn-throw-draw 3s ease-in-out infinite'}} />
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
      <style>{`
        @keyframes spn-dot-orbit {
          0%    {transform:translate(0px,0px)}
          12.5% {transform:translate(0px,-25px)}
          25%   {transform:translate(0px,-51px)}
          37.5% {transform:translate(25px,-51px)}
          50%   {transform:translate(51px,-51px)}
          62.5% {transform:translate(51px,-25px)}
          75%   {transform:translate(51px,0px)}
          87.5% {transform:translate(25px,0px)}
          100%  {transform:translate(0px,0px)}
        }
      `}</style>
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
      {/* highlighted dot moving around outer cells */}
      <circle
        cx={cx - (2 * r) / 3} cy={cy + (2 * r) / 3} r="3" fill={ACCENT}
        style={{animation:'spn-dot-orbit 4s linear infinite', transformBox:'fill-box', transformOrigin:'center'}}
      />
      <Label x={150} y={138} size={7} opacity={0.7}>blend top/bottom with side</Label>
    </g>
  )
}

function WhenNotToUseEnglish() {
  return (
    <g>
      <style>{`
        @keyframes spn-x-blink { 0%,100%{opacity:0.85} 45%,55%{opacity:0.2} }
        @keyframes spn-check-pulse { 0%,100%{opacity:1; r:2} 50%{opacity:0.6} }
        @keyframes spn-green-glow { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
      <Felt pockets={false} />
      {/* left scene: center hit, clean */}
      <Ball cx={95} cy={75} r={16} color={CHALK} />
      <circle cx={95} cy={75} r="2" fill="#22c55e" style={{animation:'spn-check-pulse 2s ease-in-out infinite'}} />
      <g style={{animation:'spn-green-glow 2s ease-in-out infinite'}}>
        <Label x={95} y={106} size={9} color="#22c55e" weight="bold">{'✓'}</Label>
      </g>
      <Label x={95} y={40} size={7} opacity={0.7}>center hit</Label>
      {/* right scene: off-center english, risky */}
      <Ball cx={210} cy={75} r={16} color={CHALK} />
      <circle cx={216} cy={68} r="2" fill={ACCENT} />
      <g style={{animation:'spn-x-blink 1.5s ease-in-out infinite'}}>
        <line x1={210} y1={62} x2={222} y2={50} stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
        <line x1={222} y1={62} x2={210} y2={50} stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <Label x={210} y={40} size={7} opacity={0.7}>extra english</Label>
      <Label x={150} y={138} size={7} opacity={0.7}>center hit, fewer ways to miss</Label>
    </g>
  )
}

function MasseAndJumpShots() {
  return (
    <g>
      <style>{`
        @keyframes spn-masse-draw {
          0%,5%{stroke-dashoffset:185; stroke-dasharray:185} 55%,80%{stroke-dashoffset:0; stroke-dasharray:185} 95%,100%{stroke-dashoffset:185; stroke-dasharray:185}
        }
      `}</style>
      <Felt />
      {/* steep, near-vertical cue */}
      <Cue x1={180} y1={30} x2={170} y2={100} />
      <Ball cx={168} cy={104} r={7} color={CHALK} />
      {/* blocking ball directly in the straight-line path */}
      <Ball cx={205} cy={90} r={7} color="#60a5fa" />
      {/* curving path around the blocker */}
      <path
        d="M 168 104 C 185 130 230 130 245 95 C 250 80 245 60 235 50"
        fill="none" stroke={ACCENT} strokeWidth="1.4" opacity="0.85"
        style={{animation:'spn-masse-draw 3s ease-in-out infinite'}}
      />
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
