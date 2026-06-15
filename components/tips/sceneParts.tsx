// Shared visual primitives for Top Tips illustrations & diagrams.
// Everything renders inside a 300x150 viewBox matching the felt-table style
// used by PoolTableAnimation / TipDiagram.

export const CHALK = '#f0ede6'
export const GOLD = '#c9a227'
export const RAIL = '#0d2010'
export const FELT = '#1a4731'
export const ACCENT = '#246340'

export const POCKETS = [
  { x: 15, y: 12, r: 8.5 },
  { x: 285, y: 12, r: 8.5 },
  { x: 15, y: 138, r: 8.5 },
  { x: 285, y: 138, r: 8.5 },
  { x: 150, y: 11, r: 7.5 },
  { x: 150, y: 139, r: 7.5 },
]

export function Felt({ pockets = true }: { pockets?: boolean }) {
  return (
    <>
      <rect x="0" y="0" width="300" height="150" rx="10" fill={RAIL} />
      <rect x="15" y="12" width="270" height="126" fill={FELT} />
      <line x1="150" y1="12" x2="150" y2="138" stroke={ACCENT} strokeWidth="0.5" />
      {pockets && POCKETS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#050d07" />
      ))}
    </>
  )
}

export function Ball({ cx, cy, r = 7, color, label }: { cx: number; cy: number; r?: number; color: string; label?: string }) {
  const dark = color === '#1a1a1a' || color === RAIL
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      {label && (
        <text x={cx} y={cy + r * 0.35} fontSize={r} textAnchor="middle" fill={dark ? CHALK : '#0d2010'} fontWeight="bold">
          {label}
        </text>
      )}
    </g>
  )
}

// Cue stick from (x1,y1) butt end to (x2,y2) tip end.
export function Cue({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g strokeLinecap="round">
      <line x1={x1} y1={y1} x2={mx} y2={my} stroke="#8a5a32" strokeWidth="3" />
      <line x1={mx} y1={my} x2={x2} y2={y2} stroke="#e8dcc0" strokeWidth="2.5" />
      <circle cx={x2} cy={y2} r="1.4" fill="#5b8def" />
    </g>
  )
}

export type FigurePose = 'stand' | 'aim' | 'bridge' | 'walk' | 'slump' | 'cheer'

const POSES: Record<FigurePose, { head: [number, number]; arms: [number, number][]; legs: [number, number][] }> = {
  stand:  { head: [0, -20],  arms: [[-6, 4], [6, 4]],          legs: [[-5, 18], [5, 18]] },
  aim:    { head: [3, -18],  arms: [[-11, -7], [13, 11]],      legs: [[-4, 17], [9, 18]] },
  bridge: { head: [5, -15],  arms: [[-13, 1], [15, 7]],        legs: [[-2, 16], [10, 17]] },
  walk:   { head: [0, -20],  arms: [[-7, 2], [7, -2]],         legs: [[-9, 18], [8, 14]] },
  slump:  { head: [3, -13],  arms: [[-5, 5], [5, 5]],          legs: [[-5, 16], [5, 16]] },
  cheer:  { head: [0, -20],  arms: [[-11, -15], [11, -15]],    legs: [[-5, 18], [5, 18]] },
}

// Simple stick figure: head ring + torso line down to (cx,cy), arms from shoulder, legs from hip.
export function StickFigure({ cx, cy, color, pose = 'stand', flip = false }: { cx: number; cy: number; color: string; pose?: FigurePose; flip?: boolean }) {
  const s = flip ? -1 : 1
  const p = POSES[pose]
  const headX = cx + s * p.head[0]
  const headY = cy + p.head[1]
  return (
    <g>
      <circle cx={headX} cy={headY} r="6" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1={headX} y1={headY + 6} x2={cx} y2={cy} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {p.arms.map(([dx, dy], i) => (
        <line key={`a${i}`} x1={cx} y1={cy - 4} x2={cx + s * dx} y2={cy + dy} stroke={color} strokeWidth="2" strokeLinecap="round" />
      ))}
      {p.legs.map(([dx, dy], i) => (
        <line key={`l${i}`} x1={cx} y1={cy} x2={cx + s * dx} y2={cy + dy} stroke={color} strokeWidth="2" strokeLinecap="round" />
      ))}
    </g>
  )
}

export function Label({ x, y, children, color = CHALK, size = 7, anchor = 'middle', opacity = 0.85, weight }: {
  x: number; y: number; children: React.ReactNode; color?: string; size?: number
  anchor?: 'start' | 'middle' | 'end'; opacity?: number; weight?: string
}) {
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} opacity={opacity} fontWeight={weight}>
      {children}
    </text>
  )
}

export function Emoji({ x, y, size = 30, children }: { x: number; y: number; size?: number; children: string }) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor="middle" dominantBaseline="central">
      {children}
    </text>
  )
}
