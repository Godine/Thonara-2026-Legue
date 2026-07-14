import { Felt, Ball, Cue, StickFigure, Label, Emoji, CHALK, GOLD } from '../sceneParts'

const ACCENT = '#38bdf8' // mental game category color

function BuildingAPreShotRoutine() {
  return (
    <g>
      <style>{`
        @keyframes mnt-step1 {
          0%,5%{fill:none; opacity:0.8} 10%,28%{fill:#c9a227; opacity:1} 33%,100%{fill:none; opacity:0.8}
        }
        @keyframes mnt-step2 {
          0%,33%{fill:none; opacity:0.8} 38%,58%{fill:#c9a227; opacity:1} 63%,100%{fill:none; opacity:0.8}
        }
        @keyframes mnt-step3 {
          0%,63%{fill:none; opacity:0.8} 68%,88%{fill:#c9a227; opacity:1} 93%,100%{fill:none; opacity:0.8}
        }
      `}</style>
      <Felt />
      <StickFigure cx={150} cy={95} color={ACCENT} pose="aim" />
      <Cue x1={175} y1={108} x2={245} y2={80} />
      <Ball cx={250} cy={78} r={7} color={CHALK} />
      {/* repeatable step markers above the figure */}
      <circle cx={120} cy={35} r="7" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.8"
        style={{animation:'mnt-step1 3s ease-in-out infinite'}} />
      <circle cx={150} cy={35} r="7" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.8"
        style={{animation:'mnt-step2 3s ease-in-out infinite'}} />
      <circle cx={180} cy={35} r="7" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.8"
        style={{animation:'mnt-step3 3s ease-in-out infinite'}} />
      <Label x={120} y={38} size={7} weight="bold" opacity={0.9}>1</Label>
      <Label x={150} y={38} size={7} weight="bold" opacity={0.9}>2</Label>
      <Label x={180} y={38} size={7} weight="bold" opacity={0.9}>3</Label>
      <path d="M 127 35 L 143 35" fill="none" stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <path d="M 157 35 L 173 35" fill="none" stroke={GOLD} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <Label x={150} y={138} size={7} opacity={0.7}>same steps, every time</Label>
    </g>
  )
}

function TalkToYourselfLikeACoach() {
  return (
    <g>
      <style>{`
        @keyframes mnt-check-draw {
          0%,5%{stroke-dashoffset:46; stroke-dasharray:46} 45%,75%{stroke-dashoffset:0; stroke-dasharray:46} 90%,100%{stroke-dashoffset:46; stroke-dasharray:46}
        }
        @keyframes mnt-neg-fade {
          0%,100%{opacity:0.25} 50%{opacity:0.08}
        }
      `}</style>
      <Felt />
      <StickFigure cx={75} cy={100} color={ACCENT} pose="slump" />
      {/* positive coaching thought bubble */}
      <ellipse cx={140} cy={45} rx="34" ry="22" fill="none" stroke={ACCENT} strokeWidth="1.5" opacity="0.9" />
      <circle cx={108} cy={68} r="3" fill="none" stroke={ACCENT} strokeWidth="1.2" opacity="0.7" />
      <circle cx={100} cy={78} r="1.8" fill="none" stroke={ACCENT} strokeWidth="1.2" opacity="0.6" />
      <path d="M 124 47 L 134 56 L 156 33" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{animation:'mnt-check-draw 3s ease-in-out infinite'}} />
      {/* faded crossed-out negative voice */}
      <g style={{animation:'mnt-neg-fade 3s ease-in-out infinite'}}>
        <ellipse cx={235} cy={95} rx="28" ry="18" fill="none" stroke={CHALK} strokeWidth="1.2" />
        <Emoji x={235} y={97} size={18}>😡</Emoji>
        <line x1={213} y1={111} x2={257} y2={79} stroke={CHALK} strokeWidth="1.5" />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>feedback, not judgment</Label>
    </g>
  )
}

function BreathingBetweenShots() {
  return (
    <g>
      <style>{`
        @keyframes mnt-breath-in {
          0%{opacity:0.1; transform:scale(1)} 40%{opacity:0.6; transform:scale(1.15)} 60%{opacity:0.6; transform:scale(1.15)} 100%{opacity:0.1; transform:scale(1)}
        }
        @keyframes mnt-breath-out {
          0%{opacity:0.1; transform:scale(1)} 40%{opacity:0.4; transform:scale(1.1)} 60%{opacity:0.4; transform:scale(1.1)} 100%{opacity:0.1; transform:scale(1)}
        }
      `}</style>
      <Felt />
      <StickFigure cx={150} cy={98} color={ACCENT} pose="stand" />
      {/* gentle breath arcs near head/chest */}
      <path d="M 138 60 C 130 50, 130 40, 140 32" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round"
        style={{animation:'mnt-breath-in 2.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}} />
      <path d="M 162 60 C 170 50, 170 40, 160 32" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round"
        style={{animation:'mnt-breath-in 2.5s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}} />
      <path d="M 144 70 C 134 62, 134 50, 146 44" fill="none" stroke={CHALK} strokeWidth="1" strokeLinecap="round"
        style={{animation:'mnt-breath-out 2.5s ease-in-out infinite 0.2s', transformBox:'fill-box', transformOrigin:'center'}} />
      <path d="M 156 70 C 166 62, 166 50, 154 44" fill="none" stroke={CHALK} strokeWidth="1" strokeLinecap="round"
        style={{animation:'mnt-breath-out 2.5s ease-in-out infinite 0.2s', transformBox:'fill-box', transformOrigin:'center'}} />
      <Ball cx={235} cy={110} r={7} color={CHALK} />
      <Ball cx={262} cy={95} r={7} color="#ef4444" />
      <Label x={150} y={138} size={7} opacity={0.7}>one slow breath, reset</Label>
    </g>
  )
}

function PlayTheProcessNotTheScore() {
  return (
    <g>
      <style>{`
        @keyframes mnt-score-fade { 0%,100%{opacity:0.18} 50%{opacity:0.04} }
        @keyframes mnt-aim-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
      <Felt />
      <StickFigure cx={75} cy={98} color={ACCENT} pose="aim" />
      <Cue x1={100} y1={110} x2={180} y2={85} />
      <Ball cx={185} cy={83} r={7} color={CHALK} />
      <Ball cx={245} cy={62} r={7} color="#22c55e" />
      <line x1={185} y1={83} x2={245} y2={62} stroke={ACCENT} strokeWidth="1" strokeDasharray="2 2"
        style={{animation:'mnt-aim-pulse 2s ease-in-out infinite'}} />
      {/* ghosted scoreboard fading into the background */}
      <g style={{animation:'mnt-score-fade 3s ease-in-out infinite'}}>
        <rect x={232} y={20} width="48" height="22" rx="2" fill="none" stroke={CHALK} strokeWidth="1" />
        <line x1={232} y1={31} x2={280} y2={31} stroke={CHALK} strokeWidth="0.75" />
        <Label x={244} y={28} size={6} opacity={1}>3 - 2</Label>
        <Label x={256} y={39} size={6} opacity={1}>- - -</Label>
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>only this shot exists</Label>
    </g>
  )
}

function BouncingBackFromAMiss() {
  return (
    <g>
      <style>{`
        @keyframes mnt-arrow-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes mnt-chalk-pulse { 0%,100%{opacity:0.85} 50%{opacity:0.4} }
      `}</style>
      <Felt />
      <StickFigure cx={100} cy={98} color={ACCENT} pose="stand" />
      {/* cue held with chalk near the tip */}
      <Cue x1={75} y1={120} x2={140} y2={70} />
      <rect x={134} y={62} width="9" height="9" rx="1" fill={ACCENT} opacity="0.85"
        style={{animation:'mnt-chalk-pulse 1.5s ease-in-out infinite'}} />
      {/* circular reset arrow — rotates around arc center ~(220, 80) */}
      <g style={{transformOrigin:'220px 80px', animation:'mnt-arrow-spin 3s linear infinite'}}>
        <path d="M 200 60 A 28 28 0 1 1 195 92" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.8" />
        <path d="M 195 92 L 188 86 M 195 92 L 201 100" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      </g>
      <Ball cx={245} cy={110} r={7} color={CHALK} />
      <Label x={150} y={138} size={7} opacity={0.7}>chalk up, reset, move on</Label>
    </g>
  )
}

function ConfidenceComesFromRepetition() {
  return (
    <g>
      <style>{`
        @keyframes mnt-rep-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
        @keyframes mnt-cheer-bob { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }
      `}</style>
      <Felt />
      {/* row of small practice-shot balls — scale up sequentially */}
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 0s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={45} cy={100} r={4} color="#f5c518" />
      </g>
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 0.4s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={70} cy={100} r={4} color="#60a5fa" />
      </g>
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 0.8s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={95} cy={100} r={4} color="#ef4444" />
      </g>
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 1.2s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={120} cy={100} r={4.5} color="#22c55e" />
      </g>
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 1.6s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={148} cy={98} r={5} color={CHALK} />
      </g>
      <g style={{animation:'mnt-rep-scale 3s ease-in-out 2s infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <Ball cx={178} cy={95} r={5.5} color={GOLD} />
      </g>
      <path d="M 45 110 L 178 90" fill="none" stroke={CHALK} strokeWidth="0.75" strokeDasharray="2 2" opacity="0.3" />
      <g style={{animation:'mnt-cheer-bob 2s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center'}}>
        <StickFigure cx={235} cy={92} color={ACCENT} pose="cheer" />
      </g>
      <Label x={150} y={138} size={7} opacity={0.7}>built one rep at a time</Label>
    </g>
  )
}

export const MENTAL_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  'building-a-pre-shot-routine': BuildingAPreShotRoutine,
  'talk-to-yourself-like-a-coach': TalkToYourselfLikeACoach,
  'breathing-between-shots': BreathingBetweenShots,
  'play-the-process-not-the-score': PlayTheProcessNotTheScore,
  'bouncing-back-from-a-miss': BouncingBackFromAMiss,
  'confidence-comes-from-repetition': ConfidenceComesFromRepetition,
}
