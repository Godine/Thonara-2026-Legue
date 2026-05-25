'use client'

import { useState, useEffect, useRef } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player, Shot } from '@/types/database'

export interface PoolTableProps {
  p1: Player
  p2: Player
  lastShot: Shot | null
  isComplete: boolean
  winnerId: string | null
  height?: number
}

const HEAD_R = 11
const WALK_X = 82 // SVG units the shooter travels toward the ball

const POCKETS = [
  { x: 15,  y: 12  },
  { x: 285, y: 12  },
  { x: 15,  y: 138 },
  { x: 285, y: 138 },
  { x: 150, y: 11  },
  { x: 150, y: 139 },
]

const SHOT_EMOJI: Record<string, string[]> = {
  potted: ['😎', '🤩'],
  lucky:  ['🍀', '😏'],
  miss:   ['😤', '😠'],
  error:  ['🤦', '😡'],
}

function Figure({ cx, cy, username, color }: { cx: number; cy: number; username: string; color: string }) {
  const [imgError, setImgError] = useState(false)
  const headY = cy - 20
  const style = PLAYER_STYLES[username as PlayerUsername]

  return (
    <g>
      <foreignObject x={cx - HEAD_R} y={headY - HEAD_R} width={HEAD_R * 2} height={HEAD_R * 2}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {!imgError ? (
          <img
            src={`/photos/${username}.jpg`}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
            alt=""
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 9, fontWeight: 'bold', color: '#000',
          }}>
            {style?.number ?? '?'}
          </div>
        )}
      </foreignObject>
      <circle cx={cx} cy={headY} r={HEAD_R} fill="none" stroke={color} strokeWidth="1.5" />
      <line x1={cx} y1={headY + HEAD_R} x2={cx} y2={cy + 5} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx - 9} y1={cy - 4} x2={cx + 9} y2={cy - 4} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy + 5} x2={cx - 8} y2={cy + 17} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy + 5} x2={cx + 8} y2={cy + 17} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

export default function PoolTableAnimation({ p1, p2, lastShot, height = 140 }: PoolTableProps) {
  const c1 = PLAYER_STYLES[p1.username as PlayerUsername]?.color ?? '#aaa'
  const c2 = PLAYER_STYLES[p2.username as PlayerUsername]?.color ?? '#aaa'

  // Figure animation state — offset is 0,0 during wander (CSS animation overrides inline transform)
  const [p1Offset, setP1Offset] = useState({ x: 0, y: 0 })
  const [p2Offset, setP2Offset] = useState({ x: 0, y: 0 })
  const [p1Dur,    setP1Dur]    = useState('none')
  const [p2Dur,    setP2Dur]    = useState('none')
  const [p1Wander, setP1Wander] = useState(true)
  const [p2Wander, setP2Wander] = useState(true)

  // Ball
  const [ballOffset, setBallOffset] = useState({ x: 0, y: 0 })
  const [ballTrans,  setBallTrans]  = useState('none')

  // Emoji pop
  const [emoji, setEmoji] = useState<{ text: string; key: number; side: 'p1' | 'p2' } | null>(null)

  const prevShotId = useRef<string | null>(null)

  useEffect(() => {
    if (!lastShot || lastShot.id === prevShotId.current) return
    prevShotId.current = lastShot.id

    const isP1    = lastShot.player_id === p1.id
    const walkX   = isP1 ? WALK_X : -WALK_X
    const type    = lastShot.is_error ? 'error' : lastShot.is_lucky ? 'lucky' : lastShot.potted ? 'potted' : 'miss'
    const options = SHOT_EMOJI[type]

    // Emoji above shooter's head (appears immediately, CSS fades it out)
    setEmoji({ text: options[Math.floor(Math.random() * options.length)], key: Date.now(), side: isP1 ? 'p1' : 'p2' })

    // Disable wander, begin walk-in
    if (isP1) {
      setP1Wander(false)
      setP1Dur('transform 0.45s ease-in-out')
      setP1Offset({ x: walkX, y: 0 })
    } else {
      setP2Wander(false)
      setP2Dur('transform 0.45s ease-in-out')
      setP2Offset({ x: walkX, y: 0 })
    }

    const timers: ReturnType<typeof setTimeout>[] = []

    // After walk-in: roll ball (if pot) + walk back
    timers.push(setTimeout(() => {
      if (lastShot.potted) {
        const pocket = POCKETS[Math.floor(Math.random() * POCKETS.length)]
        setBallTrans('transform 0.38s ease-in')
        setBallOffset({ x: pocket.x - 150, y: pocket.y - 75 })
        // Snap ball back to centre once it's under the pocket
        timers.push(setTimeout(() => {
          setBallTrans('none')
          setBallOffset({ x: 0, y: 0 })
        }, 380))
      }

      if (isP1) {
        setP1Dur('transform 0.4s ease-in-out')
        setP1Offset({ x: 0, y: 0 })
      } else {
        setP2Dur('transform 0.4s ease-in-out')
        setP2Offset({ x: 0, y: 0 })
      }

      // After walk-back: re-enable wander
      timers.push(setTimeout(() => {
        if (isP1) {
          setP1Dur('none')
          setP1Wander(true)
        } else {
          setP2Dur('none')
          setP2Wander(true)
        }
      }, 400))
    }, 450))

    return () => timers.forEach(clearTimeout)
  }, [lastShot?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', background: '#0d2010' }}>
      <svg viewBox="0 0 300 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="cue-grad" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="70%" stopColor="#eee" />
            <stop offset="100%" stopColor="#bbb" />
          </radialGradient>
          <style>{`
            /* Idle wander — CSS animation overrides inline transform while active */
            .pool-wander-p1 { animation: pool-wander-p1 7s ease-in-out infinite; }
            .pool-wander-p2 { animation: pool-wander-p2 6.3s ease-in-out infinite; animation-delay: -2.1s; }
            @keyframes pool-wander-p1 {
              0%   { transform: translate(0px,   0px); }
              20%  { transform: translate(-12px, -7px); }
              40%  { transform: translate(9px,  -10px); }
              60%  { transform: translate(-5px,  11px); }
              80%  { transform: translate(13px,   4px); }
              100% { transform: translate(0px,   0px); }
            }
            @keyframes pool-wander-p2 {
              0%   { transform: translate(0px,  0px); }
              25%  { transform: translate(11px, -9px); }
              50%  { transform: translate(-12px, 7px); }
              75%  { transform: translate(8px,  -5px); }
              100% { transform: translate(0px,  0px); }
            }
            /* Emoji float + fade */
            .pool-emoji-pop {
              animation: pool-emoji-pop 1.5s ease-out forwards;
              pointer-events: none;
            }
            @keyframes pool-emoji-pop {
              0%   { opacity: 0;   transform: translateY(4px); }
              10%  { opacity: 1; }
              70%  { opacity: 1;   transform: translateY(-14px); }
              100% { opacity: 0;   transform: translateY(-22px); }
            }
          `}</style>
        </defs>

        {/* Rail */}
        <rect x="0" y="0" width="300" height="150" rx="10" fill="#0d2010" />
        {/* Felt */}
        <rect x="15" y="12" width="270" height="126" fill="#1a4731" />
        {/* Centre markings */}
        <line x1="150" y1="12" x2="150" y2="138" stroke="#246340" strokeWidth="0.5" />
        <circle cx="150" cy="75" r="20" fill="none" stroke="#246340" strokeWidth="0.5" />

        {/* Cue ball — rendered BEFORE pockets so it slides under them on a pot */}
        <g style={{ transform: `translate(${ballOffset.x}px, ${ballOffset.y}px)`, transition: ballTrans }}>
          <circle cx="150" cy="75" r="7" fill="url(#cue-grad)" />
          <circle cx="147" cy="72" r="1.8" fill="#fff" opacity="0.7" />
        </g>

        {/* Pockets — above ball layer */}
        <circle cx="15"  cy="12"  r="8.5" fill="#050d07" />
        <circle cx="285" cy="12"  r="8.5" fill="#050d07" />
        <circle cx="15"  cy="138" r="8.5" fill="#050d07" />
        <circle cx="285" cy="138" r="8.5" fill="#050d07" />
        <circle cx="150" cy="11"  r="7.5" fill="#050d07" />
        <circle cx="150" cy="139" r="7.5" fill="#050d07" />

        {/* P1 figure — inline transform is overridden by CSS animation when wandering */}
        <g
          className={p1Wander ? 'pool-wander-p1' : ''}
          style={{ transform: `translate(${p1Offset.x}px, ${p1Offset.y}px)`, transition: p1Dur }}
        >
          <Figure cx={60} cy={78} username={p1.username} color={c1} />
        </g>

        {/* P2 figure */}
        <g
          className={p2Wander ? 'pool-wander-p2' : ''}
          style={{ transform: `translate(${p2Offset.x}px, ${p2Offset.y}px)`, transition: p2Dur }}
        >
          <Figure cx={240} cy={78} username={p2.username} color={c2} />
        </g>

        {/* Emoji — key forces remount on every shot to restart the CSS animation */}
        {emoji && (
          <text
            key={emoji.key}
            x={emoji.side === 'p1' ? 60 : 240}
            y={32}
            textAnchor="middle"
            fontSize="18"
            className="pool-emoji-pop"
          >
            {emoji.text}
          </text>
        )}
      </svg>
    </div>
  )
}
