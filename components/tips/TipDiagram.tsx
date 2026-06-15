import type { DiagramKey } from '@/lib/tips-content'
import { Felt, CHALK, GOLD } from './sceneParts'

function GhostBall() {
  return (
    <g>
      <Felt />
      <line x1="95" y1="55" x2="182" y2="89" stroke={CHALK} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
      <line x1="195" y1="95" x2="285" y2="138" stroke={GOLD} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.85" />
      <circle cx="182" cy="89" r="7" fill="none" stroke={CHALK} strokeWidth="1.3" strokeDasharray="2 2" opacity="0.7" />
      <circle cx="195" cy="95" r="7" fill="#ef4444" />
      <circle cx="95" cy="55" r="7" fill={CHALK} />
      <text x="182" y="75" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.85">ghost ball</text>
      <text x="95" y="42" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.85">cue ball</text>
      <text x="248" y="125" fontSize="7" fill={GOLD} textAnchor="middle">to pocket</text>
    </g>
  )
}

function ContactZones() {
  const dots: [number, number][] = [
    [122, 47], [150, 47], [178, 47],
    [122, 75], [150, 75], [178, 75],
    [122, 103], [150, 103], [178, 103],
  ]
  return (
    <g>
      <Felt pockets={false} />
      <circle cx="150" cy="75" r="42" fill={CHALK} />
      <line x1="108" y1="75" x2="192" y2="75" stroke="#0d2010" strokeWidth="1" opacity="0.35" />
      <line x1="150" y1="33" x2="150" y2="117" stroke="#0d2010" strokeWidth="1" opacity="0.35" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#0d2010" opacity="0.5" />
      ))}
      <circle cx="150" cy="75" r="3" fill={GOLD} />
      <text x="150" y="20" fontSize="7" fill={CHALK} textAnchor="middle">Follow (top spin)</text>
      <text x="150" y="144" fontSize="7" fill={CHALK} textAnchor="middle">Draw (backspin)</text>
      <text x="40" y="78" fontSize="7" fill={CHALK} textAnchor="start">Left english</text>
      <text x="260" y="78" fontSize="7" fill={CHALK} textAnchor="end">Right english</text>
    </g>
  )
}

function MiniShot({ x, label, color, arrow }: { x: number; label: string; color: string; arrow: 'back' | 'stop' | 'forward' }) {
  const cue = x + 22
  const obj = x + 58
  return (
    <g>
      <circle cx={cue} cy="75" r="6.5" fill={CHALK} />
      <circle cx={obj} cy="75" r="6.5" fill={color} />
      {arrow === 'back' && (
        <line x1={obj - 7} y1="75" x2={cue + 10} y2="75" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" />
      )}
      {arrow === 'forward' && (
        <line x1={obj + 7} y1="75" x2={obj + 26} y2="75" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" />
      )}
      {arrow === 'stop' && (
        <circle cx={obj - 7} cy="75" r="6.5" fill="none" stroke="#60a5fa" strokeWidth="1.3" strokeDasharray="2 2" />
      )}
      <text x={x + 50} y="120" fontSize="8" fill={CHALK} textAnchor="middle" letterSpacing="1">{label}</text>
    </g>
  )
}

function DrawFollowStun() {
  return (
    <g>
      <Felt pockets={false} />
      <line x1="100" y1="20" x2="100" y2="130" stroke="#246340" strokeWidth="0.5" opacity="0.5" />
      <line x1="200" y1="20" x2="200" y2="130" stroke="#246340" strokeWidth="0.5" opacity="0.5" />
      <MiniShot x={0} label="DRAW" color="#f5c518" arrow="back" />
      <MiniShot x={100} label="STUN" color="#ef4444" arrow="stop" />
      <MiniShot x={200} label="FOLLOW" color="#22c55e" arrow="forward" />
    </g>
  )
}

function CurveEnglish() {
  return (
    <g>
      <Felt />
      <circle cx="165" cy="75" r="7" fill="#7a786f" />
      <circle cx="235" cy="45" r="7" fill="#ef4444" />
      <line x1="65" y1="115" x2="235" y2="45" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.22" />
      <path d="M 65 115 C 110 118, 130 70, 165 55 C 195 42, 215 38, 235 45" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="65" cy="115" r="7" fill={CHALK} />
      <line x1="35" y1="138" x2="58" y2="119" stroke="#a8794a" strokeWidth="3" strokeLinecap="round" />
      <text x="165" y="93" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.8">blocker</text>
      <text x="150" y="138" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.6">elevated cue + side spin curves around</text>
    </g>
  )
}

function NaturalAngle() {
  return (
    <g>
      <Felt />
      <line x1="90" y1="105" x2="160" y2="80" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <line x1="160" y1="80" x2="235" y2="58" stroke={GOLD} strokeWidth="1.5" />
      <line x1="160" y1="80" x2="146" y2="32" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="90" cy="105" r="7" fill={CHALK} />
      <circle cx="160" cy="80" r="7" fill="#f5c518" />
      <text x="205" y="63" fontSize="7" fill={GOLD} textAnchor="middle">object ball to pocket</text>
      <text x="118" y="38" fontSize="7" fill="#60a5fa" textAnchor="middle">cue ball's natural path (~90°)</text>
    </g>
  )
}

function SafetyRail() {
  return (
    <g>
      <Felt />
      <circle cx="185" cy="20" r="7" fill="#ef4444" />
      <circle cx="150" cy="20" r="7" fill={CHALK} />
      <line x1="185" y1="20" x2="150" y2="139" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
      <line x1="150" y1="20" x2="15" y2="12" stroke={CHALK} strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
      <text x="167" y="36" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.85">both balls hugging the rail</text>
      <text x="167" y="125" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.6">no clean angle to a pocket</text>
    </g>
  )
}

function BreakSetup() {
  const colors = ['#f5c518', '#60a5fa', '#ef4444', '#22c55e', '#e8c547', '#a855f7', '#fb923c', '#38bdf8', '#f87171', GOLD]
  const positions: [number, number][] = [
    [225, 75],
    [233, 68], [233, 82],
    [241, 61], [241, 75], [241, 89],
    [249, 54], [249, 68], [249, 82], [249, 96],
  ]
  return (
    <g>
      <Felt />
      {positions.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill={colors[i % colors.length]} />
      ))}
      <circle cx="75" cy="75" r="7" fill={CHALK} />
      <line x1="82" y1="75" x2="218" y2="75" stroke={GOLD} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />
      <text x="75" y="92" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.8">head spot</text>
      <text x="225" y="40" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.8">head ball (full hit)</text>
    </g>
  )
}

function PatternRunout() {
  const balls: [number, number, string, string][] = [
    [60, 35, '1', '#f5c518'],
    [105, 105, '2', '#60a5fa'],
    [165, 45, '3', '#ef4444'],
    [215, 110, '4', '#22c55e'],
    [250, 40, '5', '#e8c547'],
    [268, 122, '8', '#1a1a1a'],
  ]
  return (
    <g>
      <Felt />
      <polyline
        points={balls.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none" stroke={GOLD} strokeWidth="1.3" strokeDasharray="3 3" opacity="0.8"
      />
      {balls.map(([x, y, label, color], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="8" fill={color} />
          <text x={x} y={y + 2.5} fontSize="7" fill={color === '#1a1a1a' ? CHALK : '#0d2010'} textAnchor="middle" fontWeight="bold">{label}</text>
        </g>
      ))}
      <text x="150" y="142" fontSize="7" fill={CHALK} textAnchor="middle" opacity="0.7">plan the order before you shoot</text>
    </g>
  )
}

const DIAGRAMS: Record<DiagramKey, () => JSX.Element> = {
  'ghost-ball': GhostBall,
  'contact-zones': ContactZones,
  'draw-follow-stun': DrawFollowStun,
  'curve-english': CurveEnglish,
  'natural-angle': NaturalAngle,
  'safety-rail': SafetyRail,
  'break-setup': BreakSetup,
  'pattern-runout': PatternRunout,
}

export default function TipDiagram({ type }: { type: DiagramKey }) {
  const Diagram = DIAGRAMS[type]
  return (
    <div className="rounded-xl overflow-hidden border border-pool-border" style={{ background: '#0d2010' }}>
      <svg viewBox="0 0 300 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Diagram />
      </svg>
    </div>
  )
}
