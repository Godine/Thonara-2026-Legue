'use client'

import { useState } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player, Shot } from '@/types/database'

export interface PoolTableProps {
  p1: Player
  p2: Player
  lastShot: Shot | null
  isComplete: boolean
  winnerId: string | null
}

const HEAD_R = 11

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
      {/* Head border ring */}
      <circle cx={cx} cy={headY} r={HEAD_R} fill="none" stroke={color} strokeWidth="1.5" />
      {/* Body */}
      <line x1={cx} y1={headY + HEAD_R} x2={cx} y2={cy + 5} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Arms */}
      <line x1={cx - 9} y1={cy - 4} x2={cx + 9} y2={cy - 4} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <line x1={cx} y1={cy + 5} x2={cx - 8} y2={cy + 17} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy + 5} x2={cx + 8} y2={cy + 17} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

export default function PoolTableAnimation({ p1, p2 }: PoolTableProps) {
  const c1 = PLAYER_STYLES[p1.username as PlayerUsername]?.color ?? '#aaa'
  const c2 = PLAYER_STYLES[p2.username as PlayerUsername]?.color ?? '#aaa'

  return (
    <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', background: '#0d2010' }}>
      <svg viewBox="0 0 300 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Rail */}
        <rect x="0" y="0" width="300" height="150" rx="10" fill="#0d2010" />
        {/* Felt */}
        <rect x="15" y="12" width="270" height="126" fill="#1a4731" />
        {/* Centre markings */}
        <line x1="150" y1="12" x2="150" y2="138" stroke="#246340" strokeWidth="0.5" />
        <circle cx="150" cy="75" r="20" fill="none" stroke="#246340" strokeWidth="0.5" />
        {/* Pockets — 4 corners + 2 mid long-sides */}
        <circle cx="15" cy="12" r="8.5" fill="#050d07" />
        <circle cx="285" cy="12" r="8.5" fill="#050d07" />
        <circle cx="15" cy="138" r="8.5" fill="#050d07" />
        <circle cx="285" cy="138" r="8.5" fill="#050d07" />
        <circle cx="150" cy="11" r="7.5" fill="#050d07" />
        <circle cx="150" cy="139" r="7.5" fill="#050d07" />
        <defs>
          <radialGradient id="cue-grad" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="70%" stopColor="#eee" />
            <stop offset="100%" stopColor="#bbb" />
          </radialGradient>
          <style>{`
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
          `}</style>
        </defs>
        {/* Cue ball */}
        <circle cx="150" cy="75" r="7" fill="url(#cue-grad)" />
        <circle cx="147" cy="72" r="1.8" fill="#fff" opacity="0.7" />
        {/* Figures: P1 left, P2 right — continuous idle wander */}
        <g className="pool-wander-p1">
          <Figure cx={60} cy={78} username={p1.username} color={c1} />
        </g>
        <g className="pool-wander-p2">
          <Figure cx={240} cy={78} username={p2.username} color={c2} />
        </g>
      </svg>
    </div>
  )
}
