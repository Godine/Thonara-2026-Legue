'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import PoolTableAnimation from '@/components/PoolTableAnimation'
import type { Player, Shot, ShotResult } from '@/types/database'

type Phase = 'setup' | 'playing' | 'recap'

interface PracticeShot {
  id: string
  playerId: PlayerUsername
  potted: boolean
  isLucky: boolean
  isError: boolean
}

function makePlayer(username: PlayerUsername): Player {
  const s = PLAYER_STYLES[username]
  return { id: username, username, display_name: s.label, ball_number: s.number, color: s.color, created_at: '' }
}

function getStats(shots: PracticeShot[], playerId: PlayerUsername) {
  const mine = shots.filter(s => s.playerId === playerId)
  return {
    shots:  mine.length,
    potted: mine.filter(s => s.potted).length,
    lucky:  mine.filter(s => s.isLucky).length,
    errors: mine.filter(s => s.isError).length,
  }
}

function toShot(ps: PracticeShot, index: number): Shot {
  return {
    id: ps.id, game_id: 'practice', player_id: ps.playerId,
    potted: ps.potted, balls_potted: ps.potted ? 1 : 0, opponent_balls_potted: 0,
    is_lucky: ps.isLucky, is_error: ps.isError,
    shot_number: index + 1, created_at: '',
  }
}

function practiceWeightedAcc(shots: PracticeShot[], playerId: PlayerUsername, decay = 0.8): number {
  const mine = shots.filter(s => s.playerId === playerId)
  if (mine.length === 0) return 0
  let wPots = 0, wTotal = 0
  const n = mine.length
  for (let i = 0; i < n; i++) {
    const w = Math.pow(decay, n - 1 - i)
    wPots  += w * (mine[i].potted ? 1 : 0)
    wTotal += w
  }
  return wPots / wTotal
}

function solveMarkov(r1: number, r2: number, a1: number, a2: number, p1Turn: boolean): number {
  const dp: [number, number][][] = Array.from({ length: r1 + 1 }, () =>
    Array.from({ length: r2 + 1 }, () => [0, 0] as [number, number])
  )
  for (let j = 0; j <= r2; j++) dp[0][j] = [1, 1]
  for (let i = 1; i <= r1; i++) dp[i][0] = [0, 0]
  const denom = a1 + a2 - a1 * a2
  for (let i = 1; i <= r1; i++) {
    for (let j = 1; j <= r2; j++) {
      const A = dp[i - 1][j][0]
      const B = dp[i][j - 1][1]
      const p1t = (a1 * A + (1 - a1) * a2 * B) / denom
      dp[i][j] = [p1t, a2 * B + (1 - a2) * p1t]
    }
  }
  return dp[r1][r2][p1Turn ? 0 : 1]
}

function computePracticeOdds(
  shots: PracticeShot[],
  p1Id: PlayerUsername, p2Id: PlayerUsername,
  p1Remaining: number, p2Remaining: number,
  isP1Turn: boolean,
): { p1: number; p2: number } {
  if (shots.length === 0) return { p1: 50, p2: 50 }
  const p1Mom = practiceWeightedAcc(shots, p1Id)
  const p2Mom = practiceWeightedAcc(shots, p2Id)
  const p1n = shots.filter(s => s.playerId === p1Id).length
  const p2n = shots.filter(s => s.playerId === p2Id).length
  const a1 = Math.max(0.05, Math.min(0.95, p1n > 0 ? (p1Mom * p1n + 1) / (p1n + 2) : 0.5))
  const a2 = Math.max(0.05, Math.min(0.95, p2n > 0 ? (p2Mom * p2n + 1) / (p2n + 2) : 0.5))
  const p1Pct = Math.round(solveMarkov(p1Remaining, p2Remaining, a1, a2, isP1Turn) * 100)
  return { p1: p1Pct, p2: 100 - p1Pct }
}

const SHOT_BUTTONS: { type: ShotResult; label: string; icon: string; classes: string }[] = [
  { type: 'potted', label: 'POT',   icon: '●', classes: 'bg-pool-green-bright/20 border-pool-green-bright/50 text-pool-green-bright hover:bg-pool-green-bright/30 active:bg-pool-green-bright/40' },
  { type: 'lucky',  label: 'LUCKY', icon: '★', classes: 'bg-pool-gold/15 border-pool-gold/50 text-pool-gold hover:bg-pool-gold/25 active:bg-pool-gold/35' },
  { type: 'miss',   label: 'MISS',  icon: '✕', classes: 'bg-pool-surface border-pool-border text-pool-chalk-dim hover:bg-pool-border active:bg-pool-border' },
  { type: 'error',  label: 'ERR',   icon: '⚠', classes: 'bg-pool-red/15 border-pool-red/40 text-pool-red hover:bg-pool-red/25 active:bg-pool-red/35' },
]

export default function PracticePage() {
  const router = useRouter()
  const [phase, setPhase]         = useState<Phase>('setup')
  const [p1Name, setP1Name]       = useState<PlayerUsername | null>(null)
  const [p2Name, setP2Name]       = useState<PlayerUsername | null>(null)
  const [shots, setShots]         = useState<PracticeShot[]>([])
  const [flash, setFlash]         = useState<PlayerUsername | null>(null)
  const [breaker, setBreaker]     = useState<PlayerUsername | null>(null)
  const [breakPots, setBreakPots] = useState(0)
  const [showOddsInfo, setShowOddsInfo] = useState(false)

  const recordShot = (playerId: PlayerUsername, type: ShotResult) => {
    setFlash(playerId)
    setTimeout(() => setFlash(null), 350)
    setShots(prev => [...prev, {
      id: `${Date.now()}-${prev.length}`,
      playerId,
      potted:  type === 'potted' || type === 'lucky',
      isLucky: type === 'lucky',
      isError: type === 'error',
    }])
  }

  const recordBreak = () => {
    if (!breaker) return
    const newShots: PracticeShot[] = breakPots === 0
      ? [{ id: `${Date.now()}-0`, playerId: breaker, potted: false, isLucky: false, isError: false }]
      : Array.from({ length: breakPots }, (_, i) => ({
          id: `${Date.now()}-${i}`, playerId: breaker!,
          potted: true, isLucky: false, isError: false,
        }))
    setShots(newShots)
    setBreaker(null)
    setBreakPots(0)
  }

  const reset = () => {
    setShots([]); setP1Name(null); setP2Name(null)
    setBreaker(null); setBreakPots(0); setPhase('setup')
  }

  // ─── Setup ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Home
        </Link>
        <div className="mt-4 mb-8">
          <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">Stats not saved to league</p>
          <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">PRACTICE MODE</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(['p1', 'p2'] as const).map(side => {
            const selected    = side === 'p1' ? p1Name : p2Name
            const other       = side === 'p1' ? p2Name : p1Name
            const setSelected = side === 'p1' ? setP1Name : setP2Name
            return (
              <div key={side}>
                <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">
                  PLAYER {side === 'p1' ? '1' : '2'}
                </p>
                <div className="flex flex-col gap-2">
                  {PLAYERS.map(username => {
                    const s          = PLAYER_STYLES[username]
                    const isSelected = selected === username
                    const isDisabled = other === username
                    return (
                      <button
                        key={username}
                        onClick={() => !isDisabled && setSelected(username)}
                        disabled={isDisabled}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 ${isDisabled ? 'opacity-30 cursor-not-allowed border-pool-border bg-pool-surface' : isSelected ? 'border-2' : 'border-pool-border bg-pool-surface hover:border-pool-chalk/30'}`}
                        style={isSelected ? { borderColor: s.color, backgroundColor: s.color + '18' } : {}}
                      >
                        <PlayerBall number={s.number} color={s.color} size={28} />
                        <span className="font-heading text-base tracking-wide" style={{ color: isSelected ? s.color : '#7a786f' }}>
                          {s.label.toUpperCase()}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => p1Name && p2Name && setPhase('playing')}
          disabled={!p1Name || !p2Name}
          className="w-full py-4 rounded-xl bg-pool-gold text-pool-bg font-heading text-xl tracking-widest hover:bg-pool-gold-light disabled:opacity-30 transition-all active:scale-95 glow-gold"
        >
          LET'S PLAY
        </button>
      </div>
    )
  }

  // both players confirmed from here on
  if (!p1Name || !p2Name) return null
  const p1      = makePlayer(p1Name)
  const p2      = makePlayer(p2Name)
  const p1Style = PLAYER_STYLES[p1Name]
  const p2Style = PLAYER_STYLES[p2Name]
  const p1Stats = getStats(shots, p1Name)
  const p2Stats = getStats(shots, p2Name)
  const lastShot = shots.length > 0 ? toShot(shots[shots.length - 1], shots.length - 1) : null

  const isP1Turn = shots.length === 0
    ? true
    : (shots[shots.length - 1].playerId === p1Name) === shots[shots.length - 1].potted

  const odds = computePracticeOdds(
    shots, p1Name, p2Name,
    Math.max(1, 8 - p1Stats.potted),
    Math.max(1, 8 - p2Stats.potted),
    isP1Turn,
  )

  // ─── Recap ───────────────────────────────────────────────────────────────────
  if (phase === 'recap') {
    const winner = p1Stats.potted > p2Stats.potted ? p1Name
                 : p2Stats.potted > p1Stats.potted ? p2Name
                 : null

    const breakInfo = (() => {
      if (shots.length === 0) return null
      const breakerId = shots[0].playerId
      let pots = 0
      for (const s of shots) {
        if (s.playerId !== breakerId) break
        if (!s.potted) break
        pots++
      }
      return { pots, breakPlayer: breakerId }
    })()

    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">Practice session complete</p>
          <h1 className="font-heading text-3xl tracking-wider text-pool-chalk">RECAP</h1>
        </div>

        {/* Winner / Tie banner */}
        {winner ? (
          <div className="text-center mb-5 py-4 rounded-2xl border"
            style={{ borderColor: PLAYER_STYLES[winner].color + '50', backgroundColor: PLAYER_STYLES[winner].color + '12' }}>
            <p className="font-heading text-3xl tracking-widest" style={{ color: PLAYER_STYLES[winner].color }}>
              {PLAYER_STYLES[winner].label.toUpperCase()} WINS 🏆
            </p>
            <p className="font-body text-xs text-pool-chalk-dim mt-1">
              {winner === p1Name ? p1Stats.potted : p2Stats.potted} vs {winner === p1Name ? p2Stats.potted : p1Stats.potted} pots
            </p>
          </div>
        ) : (
          <div className="text-center mb-5 py-4 rounded-2xl border border-pool-gold/40 bg-pool-gold/10">
            <p className="font-heading text-3xl tracking-widest text-pool-gold">IT'S A TIE 🤝</p>
            <p className="font-body text-xs text-pool-chalk-dim mt-1">{p1Stats.potted} pots each</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {([{ name: p1Name, stats: p1Stats, style: p1Style }, { name: p2Name, stats: p2Stats, style: p2Style }]).map(({ name, stats, style }) => {
            const isWinner = winner === name
            return (
              <div key={name} className={`rounded-2xl border p-4 ${isWinner ? 'bg-pool-gold/10 border-pool-gold/40' : 'bg-pool-surface border-pool-border'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <PlayerBall number={style.number} color={style.color} size={24} />
                  <span className="font-heading text-sm tracking-wide" style={{ color: style.color }}>
                    {style.label.toUpperCase()}
                  </span>
                  {isWinner && <span className="ml-auto text-sm">🏆</span>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-body text-pool-chalk-dim">Pots</span>
                    <span className="font-heading text-2xl text-pool-chalk">{stats.potted}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-pool-chalk-dim">Shots</span>
                    <span className="text-pool-chalk">{stats.shots}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-pool-chalk-dim">Accuracy</span>
                    <span className="text-pool-chalk">
                      {stats.shots > 0 ? Math.round((stats.potted / stats.shots) * 100) : 0}%
                    </span>
                  </div>
                  {stats.lucky > 0 && (
                    <div className="flex justify-between text-xs font-body">
                      <span className="text-pool-chalk-dim">Lucky</span>
                      <span className="text-pool-gold">★ {stats.lucky}</span>
                    </div>
                  )}
                  {stats.errors > 0 && (
                    <div className="flex justify-between text-xs font-body">
                      <span className="text-pool-chalk-dim">Errors</span>
                      <span className="text-pool-red">{stats.errors}</span>
                    </div>
                  )}
                  {stats.shots > 0 && (
                    <div className="h-1 bg-pool-border rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((stats.potted / stats.shots) * 100)}%`, backgroundColor: style.color }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {breakInfo && (
          <div className="bg-pool-surface border border-pool-border rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
            <div>
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim">BREAK</p>
              <p className="font-body text-sm text-pool-chalk mt-0.5">
                {PLAYER_STYLES[breakInfo.breakPlayer].label} broke
              </p>
            </div>
            <p className="font-heading text-3xl" style={{ color: PLAYER_STYLES[breakInfo.breakPlayer].color }}>
              {breakInfo.pots} {breakInfo.pots === 1 ? 'pot' : 'pots'}
            </p>
          </div>
        )}

        <p className="text-center font-body text-xs text-pool-chalk-dim mb-6">
          {shots.length} shots total · {shots.filter(s => s.potted).length} pots · not added to league stats
        </p>

        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95">
            PLAY AGAIN
          </button>
          <button onClick={() => router.push('/')} className="flex-1 py-4 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light transition-all active:scale-95 glow-gold">
            GO HOME
          </button>
        </div>
      </div>
    )
  }

  // ─── Playing ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <button onClick={reset} className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors text-left">
          ← Setup
        </button>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim">Practice · Not saved</p>
            <h1 className="font-heading text-3xl tracking-wider text-pool-chalk leading-tight">
              <span style={{ color: p1Style.color }}>{p1Style.label.toUpperCase()}</span>
              <span className="text-pool-chalk-dim text-xl"> vs </span>
              <span style={{ color: p2Style.color }}>{p2Style.label.toUpperCase()}</span>
            </h1>
          </div>
          <span className="text-xs font-body text-pool-chalk-dim bg-pool-surface px-3 py-1 rounded-full border border-pool-border">
            🎱 Practice
          </span>
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/30 to-transparent" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-2">
        {([
          { name: p1Name, stats: p1Stats, style: p1Style, oddsVal: odds.p1 },
          { name: p2Name, stats: p2Stats, style: p2Style, oddsVal: odds.p2 },
        ]).map(({ name, stats, style, oddsVal }) => (
          <div key={name} className="rounded-2xl border p-3 bg-pool-surface border-pool-border">
            <div className="flex items-center gap-2 mb-2">
              <PlayerBall number={style.number} color={style.color} size={28} />
              <span className="font-heading text-base tracking-wide" style={{ color: style.color }}>
                {style.label.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-body text-pool-chalk-dim">Potted</span>
              <span className="font-heading text-2xl text-pool-chalk">{stats.potted}</span>
            </div>
            <div className="flex justify-between text-xs font-body text-pool-chalk-dim">
              <span>Shots: {stats.shots}</span>
              <span>
                {stats.errors > 0 && <span className="text-pool-red mr-2">{stats.errors} err</span>}
                {stats.lucky > 0 && <span className="text-pool-gold">{stats.lucky} ★</span>}
              </span>
            </div>
            {stats.shots > 0 && (
              <div className="h-1 bg-pool-border rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((stats.potted / stats.shots) * 100)}%`, backgroundColor: style.color }} />
              </div>
            )}
            {shots.length > 0 && (
              <div className="mt-2 pt-2 border-t border-pool-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-body text-pool-chalk-dim">Win chance</span>
                    <button
                      onClick={() => setShowOddsInfo(true)}
                      className="text-pool-chalk-dim/40 hover:text-pool-chalk-dim transition-colors leading-none text-xs"
                      aria-label="How odds are calculated"
                    >ⓘ</button>
                  </div>
                  <span className="font-heading text-base" style={{ color: style.color }}>{oddsVal}%</span>
                </div>
                <div className="h-1 bg-pool-border rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${oddsVal}%`, backgroundColor: style.color }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pool table animation */}
      <div className="px-4 mb-3">
        <PoolTableAnimation p1={p1} p2={p2} lastShot={lastShot} isComplete={false} winnerId={null} />
      </div>

      {/* Shot entry (or break entry on first shot) */}
      <div className="px-4 flex-1 flex flex-col">
        {shots.length === 0 ? (

          /* Break recording */
          <div className="flex-1 flex flex-col">
            <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">WHO BROKE?</p>

            {/* Coin flip shortcut */}
            <Link
              href={`/coin?p1=${p1Name}&p2=${p2Name}&back=/practice`}
              className="flex items-center justify-center gap-2 mb-4 py-2.5 rounded-xl border border-pool-border text-pool-chalk-dim font-body text-sm hover:text-pool-chalk hover:border-pool-chalk/30 transition-all"
            >
              🪙 <span>Can't decide? Flip a coin</span>
            </Link>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {([{ name: p1Name, style: p1Style }, { name: p2Name, style: p2Style }]).map(({ name, style }) => {
                const selected = breaker === name
                return (
                  <button
                    key={name}
                    onClick={() => setBreaker(selected ? null : name)}
                    className={`py-4 rounded-2xl border-2 font-heading text-xl tracking-wider flex flex-col items-center gap-2 transition-all active:scale-95 ${
                      selected
                        ? 'border-pool-gold bg-pool-gold/15 text-pool-gold'
                        : 'border-pool-border bg-pool-bg text-pool-chalk-dim hover:border-pool-chalk/30'
                    }`}
                  >
                    <PlayerBall number={style.number} color={style.color} size={36} />
                    {style.label.toUpperCase()}
                  </button>
                )
              })}
            </div>

            {breaker && (
              <div className="bg-pool-surface border border-pool-border rounded-2xl p-4 mb-4">
                <p className="font-body text-xs text-pool-chalk-dim mb-3 text-center">Pots on break</p>
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => setBreakPots(p => Math.max(0, p - 1))}
                    className="w-11 h-11 rounded-xl border border-pool-border font-heading text-2xl text-pool-chalk-dim hover:border-pool-chalk/40 hover:text-pool-chalk transition-all active:scale-90"
                  >−</button>
                  <span className="font-heading text-5xl text-pool-chalk w-12 text-center tabular-nums">{breakPots}</span>
                  <button
                    onClick={() => setBreakPots(p => Math.min(6, p + 1))}
                    className="w-11 h-11 rounded-xl border border-pool-border font-heading text-2xl text-pool-chalk-dim hover:border-pool-chalk/40 hover:text-pool-chalk transition-all active:scale-90"
                  >+</button>
                </div>
              </div>
            )}

            <button
              onClick={recordBreak}
              disabled={!breaker}
              className="w-full py-4 rounded-2xl bg-pool-gold text-pool-bg font-heading text-xl tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-[0.98] glow-gold"
            >
              RECORD BREAK
            </button>
          </div>

        ) : (

          /* Regular shot buttons */
          <>
            <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">TAP TO RECORD A SHOT</p>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {([{ name: p1Name, style: p1Style }, { name: p2Name, style: p2Style }]).map(({ name, style }) => {
                const isFlashing = flash === name
                return (
                  <div key={name} className={`flex flex-col gap-2 transition-all duration-100 ${isFlashing ? 'scale-[0.97] brightness-125' : ''}`}>
                    <div className="text-center py-1">
                      <span className="font-heading text-sm tracking-widest" style={{ color: style.color }}>
                        {style.label.toUpperCase()}
                      </span>
                    </div>
                    {SHOT_BUTTONS.map(btn => (
                      <button
                        key={btn.type}
                        onClick={() => recordShot(name, btn.type)}
                        className={`shot-btn w-full py-4 rounded-xl border font-heading text-lg tracking-wider flex items-center justify-center gap-2 transition-all ${btn.classes}`}
                      >
                        <span>{btn.icon}</span>
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 py-4">
              <button onClick={() => setShots(prev => prev.slice(0, -1))} disabled={shots.length === 0}
                className="flex-1 py-3 rounded-xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all disabled:opacity-30 active:scale-95">
                ↩ UNDO
              </button>
              <button onClick={() => setPhase('recap')}
                className="flex-1 py-3 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light transition-all active:scale-95 glow-gold">
                END ▶
              </button>
            </div>
          </>
        )}
      </div>

      {/* Shot log */}
      {shots.length > 0 && (
        <div className="mx-4 mb-4 bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim px-4 pt-3 pb-2">LAST SHOTS</p>
          <div className="divide-y divide-pool-border">
            {shots.slice(-5).reverse().map((shot, i) => {
              const s = PLAYER_STYLES[shot.playerId]
              const label = shot.isError ? '⚠ Error' : shot.isLucky ? '★ Lucky' : shot.potted ? '● Potted' : '✕ Miss'
              const color = shot.isError ? '#ef4444' : shot.isLucky ? '#c9a227' : shot.potted ? '#22c55e' : '#7a786f'
              return (
                <div key={shot.id} className={`flex items-center gap-3 px-4 py-2 ${i === 0 ? 'bg-pool-border/20' : ''}`}>
                  <span className="font-body text-xs text-pool-chalk-dim w-6">#{shots.length - i}</span>
                  <span className="font-body text-xs" style={{ color: s.color }}>{s.label}</span>
                  <span className="font-body text-xs ml-auto" style={{ color }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Odds info modal */}
      {showOddsInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setShowOddsInfo(false)}>
          <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl tracking-wider text-pool-chalk">HOW ODDS WORK</h2>
              <button onClick={() => setShowOddsInfo(false)}
                className="text-pool-chalk-dim hover:text-pool-chalk transition-colors text-2xl leading-none px-1">×</button>
            </div>
            <div className="space-y-4">
              <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
                <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">TURN SIMULATION</p>
                <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
                  Simulates the game turn by turn — pot and you keep shooting, miss and the table flips.
                  From balls left and whose shot it is, the model calculates the <span className="text-pool-chalk">exact mathematical probability</span> of winning.
                </p>
              </div>
              <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
                <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">ACCURACY SCORE</p>
                <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
                  Based on shots in this session only — <span className="text-pool-chalk">recent shots count more</span> than earlier ones, so a hot streak moves the needle straight away.
                </p>
              </div>
              <p className="font-body text-xs text-pool-chalk-dim text-center">
                Practice odds use this session only · no league history involved
              </p>
            </div>
            <button onClick={() => setShowOddsInfo(false)}
              className="w-full mt-5 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all">
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
