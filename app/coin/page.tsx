'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PlayerBall from '@/components/PlayerBall'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'

function CoinFace({
  username,
  isBack,
}: {
  username: PlayerUsername
  isBack: boolean
}) {
  const style = PLAYER_STYLES[username]
  const [imgError, setImgError] = useState(false)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        backfaceVisibility: 'hidden',
        transform: isBack ? 'rotateY(180deg)' : undefined,
        border: `5px solid ${style.color}`,
        boxShadow: `0 0 40px ${style.color}55, inset 0 0 20px rgba(0,0,0,0.5)`,
        overflow: 'hidden',
        background: '#0a1a0e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imgError ? (
        <PlayerBall number={style.number} color={style.color} size={150} />
      ) : (
        <img
          src={style.photo}
          alt={style.label}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {/* Coin sheen */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%)',
      }} />
    </div>
  )
}

type Phase = 'idle' | 'flipping' | 'done'

function CoinFlipper() {
  const params    = useSearchParams()
  const p1        = params.get('p1') as PlayerUsername | null
  const p2        = params.get('p2') as PlayerUsername | null
  const back      = params.get('back') ?? '/'

  const [phase,    setPhase]    = useState<Phase>('idle')
  const [winner,   setWinner]   = useState<'p1' | 'p2' | null>(null)
  const [rotation, setRotation] = useState(0)

  if (!p1 || !p2 || !PLAYER_STYLES[p1] || !PLAYER_STYLES[p2]) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-pool-chalk-dim font-body">Invalid players.</p>
        <Link href="/" className="text-pool-gold text-sm mt-4 block">← Home</Link>
      </div>
    )
  }

  const p1Style = PLAYER_STYLES[p1]
  const p2Style = PLAYER_STYLES[p2]

  const handleFlip = () => {
    if (phase !== 'idle') return
    const result: 'p1' | 'p2' = Math.random() < 0.5 ? 'p1' : 'p2'
    // 7–10 full rotations so it feels dramatic, then land on the correct face
    const spins        = 7 + Math.floor(Math.random() * 4)
    const finalRotation = spins * 360 + (result === 'p2' ? 180 : 0)
    setWinner(result)
    setRotation(finalRotation)
    setPhase('flipping')
    setTimeout(() => setPhase('done'), 3600)
  }

  const handleReflip = () => {
    setPhase('idle')
    setWinner(null)
    setRotation(0)
  }

  const winnerUsername = winner === 'p1' ? p1 : winner === 'p2' ? p2 : null
  const winnerStyle    = winnerUsername ? PLAYER_STYLES[winnerUsername] : null

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-dvh px-4 py-6">

      {/* Back link */}
      <div className="mb-6">
        <Link href={back} className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Back
        </Link>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim">Who breaks?</p>
        <h1 className="font-heading text-[4rem] leading-none tracking-widest text-pool-chalk mt-1">COIN FLIP</h1>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-pool-gold/50 to-transparent" />
      </div>

      {/* Players + coin */}
      <div className="flex items-center justify-center gap-4 flex-1">

        {/* Player 1 label */}
        <div className={`flex-1 text-center transition-all duration-700 ${
          phase === 'done' && winner !== 'p1' ? 'opacity-20' : 'opacity-100'
        }`}>
          <p className="font-heading text-xl tracking-widest leading-tight" style={{ color: p1Style.color }}>
            {p1Style.label.toUpperCase()}
          </p>
          {phase === 'done' && winner === 'p1' && (
            <p className="font-heading text-xs tracking-widest mt-2 animate-fade-in"
              style={{ color: p1Style.color }}>
              BREAKS!
            </p>
          )}
        </div>

        {/* The coin */}
        <div style={{ perspective: '900px', flexShrink: 0 }}>
          <div
            style={{
              width:  190,
              height: 190,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: phase === 'flipping'
                ? 'transform 3.6s cubic-bezier(0.12, 0.88, 0.22, 1)'
                : 'none',
              transform: `rotateY(${rotation}deg)`,
            }}
          >
            <CoinFace username={p1} isBack={false} />
            <CoinFace username={p2} isBack={true} />
          </div>
        </div>

        {/* Player 2 label */}
        <div className={`flex-1 text-center transition-all duration-700 ${
          phase === 'done' && winner !== 'p2' ? 'opacity-20' : 'opacity-100'
        }`}>
          <p className="font-heading text-xl tracking-widest leading-tight" style={{ color: p2Style.color }}>
            {p2Style.label.toUpperCase()}
          </p>
          {phase === 'done' && winner === 'p2' && (
            <p className="font-heading text-xs tracking-widest mt-2 animate-fade-in"
              style={{ color: p2Style.color }}>
              BREAKS!
            </p>
          )}
        </div>

      </div>

      {/* Bottom actions */}
      <div className="pb-8 pt-10 space-y-3">

        {phase === 'idle' && (
          <button
            onClick={handleFlip}
            className="w-full bg-pool-gold hover:bg-pool-gold-light text-pool-bg font-heading text-2xl tracking-widest py-5 rounded-2xl transition-all active:scale-[0.98] glow-gold"
          >
            🪙 FLIP
          </button>
        )}

        {phase === 'flipping' && (
          <p className="text-center font-body text-sm tracking-[0.2em] text-pool-chalk-dim animate-pulse py-4">
            Flipping…
          </p>
        )}

        {phase === 'done' && winnerStyle && winnerUsername && (
          <div className="space-y-3 animate-fade-in">
            <div
              className="rounded-2xl border-2 py-6 px-6 text-center"
              style={{ borderColor: winnerStyle.color, background: `${winnerStyle.color}12` }}
            >
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-pool-chalk-dim mb-1">Winner</p>
              <p className="font-heading text-4xl tracking-widest" style={{ color: winnerStyle.color }}>
                {winnerStyle.label.toUpperCase()}
              </p>
              <p className="font-heading text-lg tracking-[0.2em] text-pool-chalk mt-1">TAKES THE BREAK</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReflip}
                className="flex-1 py-4 rounded-2xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all active:scale-95"
              >
                🔄 REFLIP
              </button>
              <Link
                href={back}
                className="flex-1 py-4 rounded-2xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest text-center hover:bg-pool-gold-light transition-all active:scale-95 glow-gold"
              >
                ▶ LET'S GO
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoinPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-pool-chalk-dim font-body animate-pulse">Loading…</p>
      </div>
    }>
      <CoinFlipper />
    </Suspense>
  )
}
