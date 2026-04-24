'use client'

import { useEffect, useState } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player } from '@/types/database'

const CONF_COLORS = ['#f5c518', '#60a5fa', '#f87171', '#22c55e', '#c9a227', '#e8c547', '#f0ede6', '#ffffff']

// Precomputed confetti data — deterministic so no re-calculation on render
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  left:  ((i * 2.53) % 100).toFixed(1),
  delay: ((i * 0.073) % 1.1).toFixed(3),
  dur:   (1.6 + (i * 0.063) % 1.3).toFixed(2),
  anim:  `win-conf-${(i % 6) + 1}`,
  color: CONF_COLORS[i % CONF_COLORS.length],
  w:     5 + (i % 4) * 2,
  h:     8 + (i % 3) * 3,
}))

interface Props {
  winner: Player
  loser: Player
  onDismiss: () => void
}

export default function WinCelebration({ winner, loser, onDismiss }: Props) {
  const [winImgErr,  setWinImgErr]  = useState(false)
  const [loseImgErr, setLoseImgErr] = useState(false)

  const winStyle  = PLAYER_STYLES[winner.username as PlayerUsername]
  const loseStyle = PLAYER_STYLES[loser.username as PlayerUsername]

  // Auto-dismiss after 4s
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <>
      <style>{`
        @keyframes win-conf-1 { from { transform: rotate(15deg);  opacity:1 } to { transform: translate(-70px,110vh) rotate(555deg);  opacity:0 } }
        @keyframes win-conf-2 { from { transform: rotate(-20deg); opacity:1 } to { transform: translate(50px, 110vh) rotate(-380deg); opacity:0 } }
        @keyframes win-conf-3 { from { transform: rotate(45deg);  opacity:1 } to { transform: translate(-35px,110vh) rotate(765deg);  opacity:0 } }
        @keyframes win-conf-4 { from { transform: rotate(-10deg); opacity:1 } to { transform: translate(80px, 110vh) rotate(-550deg); opacity:0 } }
        @keyframes win-conf-5 { from { transform: rotate(30deg);  opacity:1 } to { transform: translate(-100px,110vh) rotate(390deg); opacity:0 } }
        @keyframes win-conf-6 { from { transform: rotate(-35deg); opacity:1 } to { transform: translate(65px, 110vh) rotate(-755deg); opacity:0 } }
        @keyframes win-enter  {
          from { transform: scale(0.6) translateY(20px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at center, ${winStyle?.color ?? '#fff'}18 0%, #060d08f0 65%)`,
          cursor: 'pointer',
        }}
        onClick={onDismiss}
      >
        {/* Confetti */}
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${c.left}%`,
              top: '-12px',
              width: c.w,
              height: c.h,
              background: c.color,
              borderRadius: 2,
              animation: `${c.anim} ${c.dur}s ${c.delay}s ease-in forwards`,
            }}
          />
        ))}

        {/* Content card — stop propagation so tapping content doesn't immediately dismiss */}
        <div
          className="flex flex-col items-center gap-5 px-8 text-center"
          style={{ animation: 'win-enter 0.5s ease-out forwards' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Trophy */}
          <div style={{ fontSize: 64, lineHeight: 1, filter: 'drop-shadow(0 0 24px #c9a22780)' }}>🏆</div>

          {/* Winner photo */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
            border: `4px solid ${winStyle?.color ?? '#fff'}`,
            boxShadow: `0 0 32px ${winStyle?.color ?? '#fff'}90, 0 0 72px ${winStyle?.color ?? '#fff'}35`,
          }}>
            {!winImgErr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/photos/${winner.username}.jpg`}
                onError={() => setWinImgErr(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                alt=""
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', background: winStyle?.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, fontWeight: 'bold', color: '#000',
              }}>
                {winStyle?.number}
              </div>
            )}
          </div>

          {/* Winner name */}
          <div>
            <p className="font-heading text-4xl tracking-widest" style={{ color: winStyle?.color }}>
              {winner.display_name.toUpperCase()}
            </p>
            <p className="font-heading text-lg tracking-widest text-pool-chalk-dim">WINS THE GAME</p>
          </div>

          {/* Loser */}
          <div className="flex flex-col items-center gap-1">
            <div style={{ position: 'relative', width: 52, height: 52 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                border: `2px solid ${loseStyle?.color ?? '#fff'}40`,
                filter: 'grayscale(70%) brightness(0.6)',
              }}>
                {!loseImgErr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/photos/${loser.username}.jpg`}
                    onError={() => setLoseImgErr(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', background: loseStyle?.color, opacity: 0.4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 'bold', color: '#000',
                  }}>
                    {loseStyle?.number}
                  </div>
                )}
              </div>
              <span style={{ position: 'absolute', bottom: -4, right: -8, fontSize: 24 }}>😭</span>
            </div>
            <p className="font-body text-xs text-pool-chalk-dim mt-1">{loser.display_name}</p>
          </div>

          <p className="font-body text-xs text-pool-chalk-dim opacity-50 mt-1">Tap anywhere to continue</p>
        </div>
      </div>
    </>
  )
}
