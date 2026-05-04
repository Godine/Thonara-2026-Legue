'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  fetchGame, fetchShotsForGame, fetchHistoricalShots, fetchH2H,
  setGameResult, clearGameResult, resetGame,
  insertShot, insertShots, deleteShot,
  type GameWithPlayers,
} from '@/lib/queries'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer } from '@/components/PlayerGate'
import PlayerBall from '@/components/PlayerBall'
import PoolTableAnimation from '@/components/PoolTableAnimation'
import WinCelebration from '@/components/WinCelebration'
import type { Player, Shot } from '@/types/database'

type GameFull = GameWithPlayers

interface PlayerStats {
  shots: number
  potted: number
  lucky: number
  errors: number
}

function getStats(shots: Shot[], playerId: string): PlayerStats {
  const mine = shots.filter(s => s.player_id === playerId)
  return {
    shots: mine.length,
    potted: mine.filter(s => s.potted).length,
    lucky: mine.filter(s => s.is_lucky).length,
    errors: mine.filter(s => s.is_error).length,
  }
}

function pickTrashTalk(
  winner: Player, loser: Player,
  wStats: PlayerStats, lStats: PlayerStats,
  shots: Shot[], loserPottedBlack: boolean
): string {
  const lines: string[] = []
  const wAcc  = wStats.shots > 0 ? Math.round((wStats.potted / wStats.shots) * 100) : 0
  const lAcc  = lStats.shots > 0 ? Math.round((lStats.potted / lStats.shots) * 100) : 0
  const wName = winner.display_name
  const lName = loser.display_name

  if (loserPottedBlack)
    lines.push(`${lName} literally handed ${wName} the win. Gifted. Wrapped. With a bow. 🎁`)
  if (lStats.errors >= 3)
    lines.push(`${lStats.errors} errors from ${lName}. The table wasn't the problem. 🫠`)
  if (lStats.lucky >= 2)
    lines.push(`${lStats.lucky} flukes from ${lName} and still lost? That's impressive in the wrong way. 🍀😬`)
  if (wStats.lucky >= 2 && wAcc < 50)
    lines.push(`${wName} shot ${wAcc}% but won. Pure luck wrapped in a victory dance. 💃`)
  if (wAcc >= 70 && wStats.shots >= 5)
    lines.push(`${wAcc}% accuracy from ${wName}. Clinical. Cold-blooded. No mercy. 🎯`)
  if (lAcc < 30 && lStats.shots >= 5)
    lines.push(`${lAcc}% accuracy, ${lName}? The pockets were right there. Just saying. 👀`)
  if (wStats.shots > 0 && lStats.shots > 0 && wStats.shots < lStats.shots * 0.6)
    lines.push(`${wName} needed ${wStats.shots} shots. ${lName} needed ${lStats.shots}. Let that sink in. ⏱️`)
  if (lStats.potted === 0 && lStats.shots >= 3)
    lines.push(`${lStats.shots} shots. Zero pots. ${lName}, the table called — it wants a break. 😭`)

  if (lines.length === 0) {
    const fallbacks = [
      `${wName} wins again. ${lName} will have their revenge… eventually. 🔮`,
      `Another day, another L for ${lName}. At least they showed up. 🫡`,
      `${wName} took it home tonight. Clean, easy, inevitable. 👑`,
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
  return lines[Math.floor(Math.random() * lines.length)]
}

// Exponential decay weighting — recent shots count more (half-life ≈ 4 shots)
function weightedAccuracy(shots: Shot[], playerId: string, decay = 0.8): number {
  const mine = shots.filter(s => s.player_id === playerId)
  if (mine.length === 0) return 0
  let wPots = 0, wTotal = 0
  const n = mine.length
  for (let i = 0; i < n; i++) {
    const w = Math.pow(decay, n - 1 - i) // most recent = weight 1, older = smaller
    wPots  += w * (mine[i].potted ? 1 : 0)
    wTotal += w
  }
  return wPots / wTotal
}

// Markov chain: P(P1 wins) given ball counts and whose turn it is.
// Solved as a 2-equation linear system per (r1, r2) cell to avoid circular recursion.
function solveMarkov(r1: number, r2: number, a1: number, a2: number, p1Turn: boolean): number {
  // dp[i][j] = [P(P1 wins | P1's turn), P(P1 wins | P2's turn)]
  const dp: [number, number][][] = Array.from({ length: r1 + 1 }, () =>
    Array.from({ length: r2 + 1 }, () => [0, 0] as [number, number])
  )
  // Base cases: whoever has 0 balls left has won
  for (let j = 0; j <= r2; j++) dp[0][j] = [1, 1]  // P1 cleared → P1 wins
  for (let i = 1; i <= r1; i++) dp[i][0] = [0, 0]  // P2 cleared → P2 wins

  const denom = a1 + a2 - a1 * a2 // always > 0 when a1,a2 ∈ (0,1)
  for (let i = 1; i <= r1; i++) {
    for (let j = 1; j <= r2; j++) {
      const A = dp[i - 1][j][0]  // P1 pots → r1-1, still P1's turn
      const B = dp[i][j - 1][1]  // P2 pots → r2-1, still P2's turn
      const p1t = (a1 * A + (1 - a1) * a2 * B) / denom
      dp[i][j] = [p1t, a2 * B + (1 - a2) * p1t]
    }
  }
  return dp[r1][r2][p1Turn ? 0 : 1]
}

function computeOdds(
  shots: Shot[],
  p1Id: string, p2Id: string,
  p1Remaining: number, p2Remaining: number,
  p1Prior: { shots: number; potted: number },
  p2Prior: { shots: number; potted: number },
  h2h: { p1Wins: number; p2Wins: number },
  isP1Turn: boolean,
): { p1: number; p2: number } {
  const hasData = shots.length + p1Prior.shots + p2Prior.shots + h2h.p1Wins + h2h.p2Wins > 0
  if (!hasData) return { p1: 50, p2: 50 }

  // Momentum-weighted accuracy blended with career history + Laplace smoothing
  const p1Mom = weightedAccuracy(shots, p1Id)
  const p2Mom = weightedAccuracy(shots, p2Id)
  const p1GameShots = shots.filter(s => s.player_id === p1Id).length
  const p2GameShots = shots.filter(s => s.player_id === p2Id).length
  const raw1 = p1GameShots > 0
    ? (p1Mom * p1GameShots + p1Prior.potted + 1) / (p1GameShots + p1Prior.shots + 2)
    : (p1Prior.potted + 1) / (p1Prior.shots + 2)
  const raw2 = p2GameShots > 0
    ? (p2Mom * p2GameShots + p2Prior.potted + 1) / (p2GameShots + p2Prior.shots + 2)
    : (p2Prior.potted + 1) / (p2Prior.shots + 2)
  const a1 = Math.max(0.05, Math.min(0.95, raw1))
  const a2 = Math.max(0.05, Math.min(0.95, raw2))

  // Markov win probability from current ball positions
  const markovP1 = solveMarkov(p1Remaining, p2Remaining, a1, a2, isP1Turn)

  // Head-to-head nudge (fades as more shots accumulate in this game)
  const h2hTotal = h2h.p1Wins + h2h.p2Wins
  const h2hP1 = h2hTotal > 0 ? h2h.p1Wins / h2hTotal : 0.5
  const h2hWeight = Math.min(h2hTotal / 20, 0.25) * Math.max(0, 1 - shots.length / 30)

  const final = markovP1 * (1 - h2hWeight) + h2hP1 * h2hWeight
  const p1Pct = Math.round(final * 100)
  return { p1: p1Pct, p2: 100 - p1Pct }
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

type ShotType = 'potted' | 'lucky' | 'miss' | 'error'

interface EndGameState {
  open: boolean
  winnerId: string
  blackBall: boolean
}

export default function GamePage() {
  const { id: sessionId, gameId } = useParams<{ id: string; gameId: string }>()
  const router = useRouter()
  const db = createClient()

  const [game, setGame]                 = useState<GameFull | null>(null)
  const [shots, setShots]               = useState<Shot[]>([])
  const [loading, setLoading]           = useState(true)
  const [currentUsername, setCurrentUsername] = useState<PlayerUsername | null>(null)
  const [saving, setSaving]             = useState(false)
  const [endGame, setEndGame]           = useState<EndGameState>({ open: false, winnerId: '', blackBall: false })
  const [flash, setFlash]               = useState<{ playerId: string; type: ShotType } | null>(null)
  const [histStats, setHistStats]       = useState<Record<string, { shots: number; potted: number }>>({})
  const [h2hStats, setH2hStats]         = useState<{ p1Wins: number; p2Wins: number }>({ p1Wins: 0, p2Wins: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [showOddsInfo, setShowOddsInfo]   = useState(false)
  const [showTrashTalk, setShowTrashTalk] = useState(false)
  const [trashTalkLine, setTrashTalkLine] = useState('')
  const [adminPanel, setAdminPanel]       = useState(false)
  const [adminWinnerId, setAdminWinnerId] = useState('')
  const [adminBlackBall, setAdminBlackBall] = useState(false)
  const [elapsed, setElapsed]           = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)
  const [breaker, setBreaker]           = useState<string | null>(null)
  const [breakPots, setBreakPots]       = useState(0)
  const prevCompleteRef = useRef<boolean | undefined>(undefined)
  const timerStartRef   = useRef<number | null>(null)

  const loadGame = useCallback(async () => {
    const [gameData, shotsData] = await Promise.all([
      fetchGame(db, gameId),
      fetchShotsForGame(db, gameId),
    ])
    if (gameData) setGame(gameData)
    setShots(shotsData)
    setLoading(false)
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentUsername(getStoredPlayer())
    loadGame()
    const channel = db
      .channel(`game-shots-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots', filter: `game_id=eq.${gameId}` }, loadGame)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, loadGame)
      .subscribe()
    return () => { db.removeChannel(channel) }
  }, [gameId, loadGame]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch historical shot accuracy + H2H in parallel (once per game/players combo)
  useEffect(() => {
    if (!game) return
    const p1id = game.player1.id
    const p2id = game.player2.id
    Promise.all([
      fetchHistoricalShots(db, [p1id, p2id], gameId),
      fetchH2H(db, p1id, p2id, gameId),
    ]).then(([shotsData, h2h]) => {
      const acc: Record<string, { shots: number; potted: number }> = {}
      for (const s of shotsData) {
        if (!acc[s.player_id]) acc[s.player_id] = { shots: 0, potted: 0 }
        acc[s.player_id].shots++
        if (s.potted) acc[s.player_id].potted++
      }
      setHistStats(acc)
      setH2hStats(h2h)
    })
  }, [game?.player1.id, game?.player2.id, gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show win celebration when game transitions from in-progress to complete
  useEffect(() => {
    if (game?.is_complete && prevCompleteRef.current === false) {
      setShowCelebration(true)
    }
    prevCompleteRef.current = game?.is_complete ?? false
  }, [game?.is_complete])

  // Set timer start from first shot timestamp
  useEffect(() => {
    if (shots.length > 0 && !timerStarted) {
      timerStartRef.current = new Date(shots[0].created_at).getTime()
      setTimerStarted(true)
    }
  }, [shots, timerStarted])

  // Tick timer while game is in progress
  useEffect(() => {
    if (!timerStarted || game?.is_complete) return
    const tick = () => setElapsed(Math.floor((Date.now() - timerStartRef.current!) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timerStarted, game?.is_complete])

  const canEdit = !!currentUsername && !game?.is_complete

  const recordShot = async (playerId: string, type: ShotType) => {
    if (!canEdit || saving) return
    setSaving(true)
    setFlash({ playerId, type })
    setTimeout(() => setFlash(null), 350)
    const newShotNumber = shots.length + 1
    const optimistic: Shot = {
      id: `temp-${Date.now()}`,
      game_id: gameId,
      player_id: playerId,
      potted: type === 'potted' || type === 'lucky',
      is_lucky: type === 'lucky',
      is_error: type === 'error',
      shot_number: newShotNumber,
      created_at: new Date().toISOString(),
    }
    setShots(prev => [...prev, optimistic])
    await insertShot(db, {
      game_id: gameId,
      player_id: playerId,
      potted: optimistic.potted,
      is_lucky: optimistic.is_lucky,
      is_error: optimistic.is_error,
      shot_number: newShotNumber,
    })
    setSaving(false)
  }

  const recordBreak = async () => {
    if (!breaker || saving) return
    setSaving(true)
    const rows = breakPots === 0
      ? [{ game_id: gameId, player_id: breaker, potted: false, is_lucky: false, is_error: false, shot_number: 1 }]
      : Array.from({ length: breakPots }, (_, i) => ({
          game_id: gameId, player_id: breaker!,
          potted: true, is_lucky: false, is_error: false, shot_number: i + 1,
        }))
    const now = Date.now()
    setShots(rows.map((r, i) => ({
      id: `temp-${now}-${i}`,
      created_at: new Date().toISOString(),
      ...r,
    })))
    await insertShots(db, rows)
    setSaving(false)
    setBreaker(null)
    setBreakPots(0)
  }

  const undoLastShot = async () => {
    if (!canEdit || saving || shots.length === 0) return
    const lastShot = shots[shots.length - 1]
    setShots(prev => prev.filter(s => s.id !== lastShot.id))
    setSaving(true)
    await deleteShot(db, lastShot.id)
    setSaving(false)
  }

  const adminChangeWinner = async () => {
    if (!adminWinnerId || saving) return
    setSaving(true)
    await setGameResult(db, gameId, adminWinnerId, adminBlackBall)
    setSaving(false)
    setAdminPanel(false)
    await loadGame()
  }

  const adminReopenGame = async () => {
    setSaving(true)
    await clearGameResult(db, gameId)
    setSaving(false)
    setAdminPanel(false)
    await loadGame()
  }

  const adminDeleteShot = async (shotId: string) => {
    setShots(prev => prev.filter(s => s.id !== shotId))
    await deleteShot(db, shotId)
  }

  const adminResetGame = async () => {
    setSaving(true)
    await resetGame(db, gameId)
    setShots([])
    setSaving(false)
    setAdminPanel(false)
    await loadGame()
  }

  const confirmEndGame = async () => {
    if (!endGame.winnerId || saving) return
    setSaving(true)
    await setGameResult(db, gameId, endGame.winnerId, endGame.blackBall)
    setSaving(false)
    setEndGame(e => ({ ...e, open: false }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pool-chalk-dim font-body animate-pulse">Loading…</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-pool-chalk-dim font-body">Game not found.</p>
        <Link href={`/session/${sessionId}`} className="text-pool-gold text-sm mt-4 block">← Back</Link>
      </div>
    )
  }

  const p1 = game.player1
  const p2 = game.player2
  const p1Style = PLAYER_STYLES[p1.username as PlayerUsername]
  const p2Style = PLAYER_STYLES[p2.username as PlayerUsername]
  const p1Stats = getStats(shots, p1.id)
  const p2Stats = getStats(shots, p2.id)

  // Whose turn: pot keeps the shooter's turn, miss/error switches it
  const isP1Turn = shots.length === 0
    ? true
    : (shots[shots.length - 1].player_id === p1.id) === shots[shots.length - 1].potted

  const odds = computeOdds(
    shots, p1.id, p2.id,
    Math.max(1, 8 - p1Stats.potted),
    Math.max(1, 8 - p2Stats.potted),
    histStats[p1.id] ?? { shots: 0, potted: 0 },
    histStats[p2.id] ?? { shots: 0, potted: 0 },
    h2hStats,
    isP1Turn,
  )
  const schedule = GAME_SCHEDULE.find(g => g.gameNumber === game.game_number)

  // Break: first consecutive potted shots by whoever shot first
  const breakInfo = (() => {
    if (shots.length === 0) return null
    const sorted = [...shots].sort((a, b) => a.shot_number - b.shot_number)
    const breakerId = sorted[0].player_id
    let pots = 0
    for (const s of sorted) {
      if (s.player_id !== breakerId) break
      if (!s.potted) break
      pots++
    }
    return { pots, breakPlayer: breakerId === p1.id ? p1 : p2 }
  })()

  // Game duration: last shot timestamp minus first shot timestamp
  const gameDuration = shots.length >= 2
    ? Math.floor(
        (new Date(shots[shots.length - 1].created_at).getTime() - new Date(shots[0].created_at).getTime()) / 1000
      )
    : null

  const shotButtons: { type: ShotType; label: string; icon: string; classes: string }[] = [
    { type: 'potted', label: 'POT',   icon: '●', classes: 'bg-pool-green-bright/20 border-pool-green-bright/50 text-pool-green-bright hover:bg-pool-green-bright/30 active:bg-pool-green-bright/40' },
    { type: 'lucky',  label: 'LUCKY', icon: '★', classes: 'bg-pool-gold/15 border-pool-gold/50 text-pool-gold hover:bg-pool-gold/25 active:bg-pool-gold/35' },
    { type: 'miss',   label: 'MISS',  icon: '✕', classes: 'bg-pool-surface border-pool-border text-pool-chalk-dim hover:bg-pool-border active:bg-pool-border' },
    { type: 'error',  label: 'ERR',   icon: '⚠', classes: 'bg-pool-red/15 border-pool-red/40 text-pool-red hover:bg-pool-red/25 active:bg-pool-red/35' },
  ]

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-dvh">

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <Link href={`/session/${sessionId}`} className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Session
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim">Game {game.game_number}</p>
            <h1 className="font-heading text-3xl tracking-wider text-pool-chalk leading-tight">
              <span style={{ color: p1Style?.color }}>{p1.display_name.toUpperCase()}</span>
              <span className="text-pool-chalk-dim text-xl"> vs </span>
              <span style={{ color: p2Style?.color }}>{p2.display_name.toUpperCase()}</span>
            </h1>
          </div>
          <div className="text-right shrink-0">
            {game.is_complete ? (
              <span className="text-xs font-body text-pool-green-bright bg-pool-green-bright/10 px-3 py-1 rounded-full border border-pool-green-bright/30">
                Complete
              </span>
            ) : timerStarted ? (
              <>
                <p className="font-heading text-2xl text-pool-chalk tabular-nums">{formatTime(elapsed)}</p>
                <p className="font-body text-xs text-pool-chalk-dim">elapsed</p>
              </>
            ) : null}
          </div>
        </div>
        {!game.is_complete && (
          <p className="text-xs font-body text-pool-chalk-dim mt-1">
            {currentUsername
              ? `📝 Scoring as ${PLAYER_STYLES[currentUsername]?.label}`
              : `📱 ${schedule ? `${PLAYER_STYLES[schedule.scorer as PlayerUsername]?.label} scoring` : 'Watching live'} — tap a player above to score`}
          </p>
        )}
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/30 to-transparent" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-2">
        {[
          { player: p1, stats: p1Stats, style: p1Style, oddsVal: odds.p1 },
          { player: p2, stats: p2Stats, style: p2Style, oddsVal: odds.p2 },
        ].map(({ player, stats, style, oddsVal }) => {
          const isWinner = game.winner_id === player.id
          return (
            <div key={player.id} className={`rounded-2xl border p-3 transition-all ${isWinner ? 'bg-pool-gold/10 border-pool-gold/50 glow-gold' : 'bg-pool-surface border-pool-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                <span className="font-heading text-base tracking-wide" style={{ color: style?.color }}>
                  {player.display_name.toUpperCase()}
                </span>
                {isWinner && <span className="text-sm">🏆</span>}
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
                    style={{ width: `${Math.round((stats.potted / stats.shots) * 100)}%`, backgroundColor: style?.color }} />
                </div>
              )}
              {!game.is_complete && (p1Stats.shots + p2Stats.shots > 0 || Object.keys(histStats).length > 0) && (
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
                    <span className="font-heading text-base" style={{ color: style?.color }}>{oddsVal}%</span>
                  </div>
                  <div className="h-1 bg-pool-border rounded-full overflow-hidden mt-1">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${oddsVal}%`, backgroundColor: style?.color }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pool table animation — only while game is live */}
      {!game.is_complete && (
        <div className="px-4 mb-3">
          <PoolTableAnimation
            p1={p1}
            p2={p2}
            lastShot={shots.length > 0 ? shots[shots.length - 1] : null}
            isComplete={game.is_complete}
            winnerId={game.winner_id}
          />
        </div>
      )}

      {/* ── Main content: recap | break entry | shot entry | watching ── */}
      {game.is_complete ? (

        /* ── RECAP ── */
        <div className="px-4 flex-1 flex flex-col gap-4 pb-6">
          <div className="bg-pool-gold/10 border border-pool-gold/40 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="font-heading text-3xl tracking-widest text-pool-gold">
              {game.winner?.display_name.toUpperCase()} WINS!
            </p>
            {game.loser_potted_black && (
              <p className="font-body text-xs text-pool-chalk-dim mt-2">Opponent potted the black ball</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pool-surface border border-pool-border rounded-2xl p-4 text-center">
              <p className="font-body text-xs text-pool-chalk-dim mb-1">Duration</p>
              <p className="font-heading text-2xl text-pool-chalk">
                {gameDuration != null ? formatTime(gameDuration) : '—'}
              </p>
            </div>
            <div className="bg-pool-surface border border-pool-border rounded-2xl p-4 text-center">
              <p className="font-body text-xs text-pool-chalk-dim mb-1">Total shots</p>
              <p className="font-heading text-2xl text-pool-chalk">{shots.length}</p>
            </div>
          </div>

          {breakInfo && (
            <div className="bg-pool-surface border border-pool-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-heading text-xs tracking-widest text-pool-chalk-dim">BREAK</p>
                <p className="font-body text-sm text-pool-chalk mt-0.5">{breakInfo.breakPlayer.display_name} broke</p>
              </div>
              <p className="font-heading text-3xl" style={{ color: PLAYER_STYLES[breakInfo.breakPlayer.username as PlayerUsername]?.color }}>
                {breakInfo.pots} {breakInfo.pots === 1 ? 'pot' : 'pots'}
              </p>
            </div>
          )}

          {game.winner && (
            <button
              onClick={() => {
                const wStats = getStats(shots, game.winner_id!)
                const lId = game.player1_id === game.winner_id ? game.player2_id : game.player1_id
                const loser = game.player1_id === game.winner_id ? game.player2 : game.player1
                const lStats = getStats(shots, lId)
                setTrashTalkLine(pickTrashTalk(game.winner!, loser, wStats, lStats, shots, game.loser_potted_black))
                setShowTrashTalk(true)
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-pool-gold/40 bg-pool-gold/10 font-heading text-base tracking-widest text-pool-gold hover:bg-pool-gold/20 transition-all active:scale-[0.98]"
            >
              📢 TRASH TALK CARD
            </button>
          )}

          {currentUsername === 'godine' && (
            <button
              onClick={() => {
                setAdminWinnerId(game.winner_id ?? '')
                setAdminBlackBall(game.loser_potted_black)
                setAdminPanel(true)
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-[0.98]"
            >
              ✏️ EDIT GAME
            </button>
          )}

          <Link
            href={`/session/${sessionId}`}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-[0.98]"
          >
            ← BACK TO SESSION
          </Link>
        </div>

      ) : canEdit ? (

        /* ── SHOT ENTRY (or BREAK entry on first shot) ── */
        <div className="px-4 flex-1 flex flex-col">
          {shots.length === 0 ? (

            /* Break recording */
            <div className="flex-1 flex flex-col">
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">WHO BROKE?</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[p1, p2].map(player => {
                  const style = PLAYER_STYLES[player.username as PlayerUsername]
                  const selected = breaker === player.id
                  return (
                    <button
                      key={player.id}
                      onClick={() => setBreaker(selected ? null : player.id)}
                      className={`py-4 rounded-2xl border-2 font-heading text-xl tracking-wider flex flex-col items-center gap-2 transition-all active:scale-95 ${
                        selected
                          ? 'border-pool-gold bg-pool-gold/15 text-pool-gold'
                          : 'border-pool-border bg-pool-bg text-pool-chalk-dim hover:border-pool-chalk/30'
                      }`}
                    >
                      {style && <PlayerBall number={style.number} color={style.color} size={36} />}
                      {player.display_name.toUpperCase()}
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
                disabled={!breaker || saving}
                className="w-full py-4 rounded-2xl bg-pool-gold text-pool-bg font-heading text-xl tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-[0.98] glow-gold"
              >
                {saving ? 'SAVING…' : 'RECORD BREAK'}
              </button>
            </div>

          ) : (

            /* Regular shot buttons */
            <>
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">TAP TO RECORD A SHOT</p>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[{ player: p1, style: p1Style }, { player: p2, style: p2Style }].map(({ player, style }) => {
                  const isFlashing = flash?.playerId === player.id
                  return (
                    <div key={player.id} className={`flex flex-col gap-2 transition-all duration-100 ${isFlashing ? 'scale-[0.97] brightness-125' : ''}`}>
                      <div className="text-center py-1">
                        <span className="font-heading text-sm tracking-widest" style={{ color: style?.color }}>
                          {player.display_name.toUpperCase()}
                        </span>
                      </div>
                      {shotButtons.map(btn => (
                        <button
                          key={btn.type}
                          onClick={() => recordShot(player.id, btn.type)}
                          disabled={saving}
                          className={`shot-btn w-full py-4 rounded-xl border font-heading text-lg tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${btn.classes}`}
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
                <button
                  onClick={undoLastShot}
                  disabled={saving || shots.length === 0}
                  className="flex-1 py-3 rounded-xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all disabled:opacity-30 active:scale-95"
                >
                  ↩ UNDO
                </button>
                {currentUsername === 'godine' && shots.length > 0 && (
                  <button
                    onClick={() => setAdminPanel(true)}
                    className="px-4 py-3 rounded-xl border border-pool-border font-heading text-sm tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95"
                  >
                    ✏️
                  </button>
                )}
                <button
                  onClick={() => setEndGame({ open: true, winnerId: p1.id, blackBall: false })}
                  className="flex-1 py-3 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light transition-all active:scale-95 glow-gold"
                >
                  END GAME ▶
                </button>
              </div>
            </>
          )}
        </div>

      ) : (

        /* ── WATCHING ── */
        <div className="px-4 flex-1">
          {!currentUsername && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📱</div>
              <p className="font-body text-pool-chalk-dim text-sm">Watching live — updates appear automatically</p>
            </div>
          )}
        </div>
      )}

      {/* Shot log */}
      {shots.length > 0 && (
        <div className="mx-4 mb-4 bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim px-4 pt-3 pb-2">LAST SHOTS</p>
          <div className="divide-y divide-pool-border">
            {shots.slice(-5).reverse().map((shot, i) => {
              const shooter = shot.player_id === p1.id ? p1 : p2
              const shooterStyle = shot.player_id === p1.id ? p1Style : p2Style
              const label = shot.is_error ? '⚠ Error' : shot.is_lucky ? '★ Lucky' : shot.potted ? '● Potted' : '✕ Miss'
              const color = shot.is_error ? '#ef4444' : shot.is_lucky ? '#c9a227' : shot.potted ? '#22c55e' : '#7a786f'
              return (
                <div key={shot.id} className={`flex items-center gap-3 px-4 py-2 ${i === 0 ? 'bg-pool-border/20' : ''}`}>
                  <span className="font-body text-xs text-pool-chalk-dim w-6">#{shot.shot_number}</span>
                  <span className="font-body text-xs" style={{ color: shooterStyle?.color }}>{shooter.display_name}</span>
                  <span className="font-body text-xs ml-auto" style={{ color }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* End game modal */}
      {endGame.open && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up">
            <h2 className="font-heading text-3xl tracking-wider text-pool-chalk text-center mb-6">END GAME</h2>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-3">Who won?</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[p1, p2].map(player => {
                const style = PLAYER_STYLES[player.username as PlayerUsername]
                const selected = endGame.winnerId === player.id
                return (
                  <button key={player.id} onClick={() => setEndGame(e => ({ ...e, winnerId: player.id }))}
                    className={`py-4 rounded-2xl border-2 font-heading text-xl tracking-wider flex flex-col items-center gap-2 transition-all active:scale-95 ${selected ? 'border-pool-gold bg-pool-gold/15 text-pool-gold' : 'border-pool-border bg-pool-bg text-pool-chalk-dim hover:border-pool-chalk/30'}`}>
                    {style && <PlayerBall number={style.number} color={style.color} size={40} />}
                    {player.display_name.toUpperCase()}
                    {selected && <span className="text-sm">🏆</span>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setEndGame(e => ({ ...e, blackBall: !e.blackBall }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 transition-all ${endGame.blackBall ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk' : 'border-pool-border bg-pool-bg text-pool-chalk-dim'}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${endGame.blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
                {endGame.blackBall && <span className="text-xs text-white">✓</span>}
              </div>
              <span className="font-body text-sm">Loser potted the black ball</span>
            </button>
            <div className="flex gap-3">
              <button onClick={() => setEndGame(e => ({ ...e, open: false }))}
                className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all">
                CANCEL
              </button>
              <button onClick={confirmEndGame} disabled={!endGame.winnerId || saving}
                className="flex-1 py-4 rounded-xl bg-pool-gold text-pool-bg font-heading text-lg tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-95 glow-gold">
                {saving ? 'SAVING…' : 'CONFIRM'}
              </button>
            </div>
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
                  The model simulates the game turn by turn — pot a ball and you keep shooting,
                  miss and the table flips. From the current position (balls left, whose shot it is)
                  it calculates the <span className="text-pool-chalk">exact mathematical probability</span> of winning.
                </p>
              </div>

              <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
                <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">ACCURACY SCORE</p>
                <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
                  Your pot rate blends two signals:
                </p>
                <ul className="mt-2 space-y-1">
                  <li className="font-body text-sm text-pool-chalk-dim flex gap-2">
                    <span className="text-pool-gold shrink-0">→</span>
                    <span><span className="text-pool-chalk">This game</span> — recent shots count more than early ones (momentum)</span>
                  </li>
                  <li className="font-body text-sm text-pool-chalk-dim flex gap-2">
                    <span className="text-pool-gold shrink-0">→</span>
                    <span><span className="text-pool-chalk">Career history</span> — your all-time pot rate, so odds make sense from shot one</span>
                  </li>
                </ul>
              </div>

              <div className="bg-pool-bg rounded-xl p-4 border border-pool-border">
                <p className="font-heading text-sm tracking-widest text-pool-gold mb-1">HEAD-TO-HEAD NUDGE</p>
                <p className="font-body text-sm text-pool-chalk-dim leading-relaxed">
                  Your historical win rate against <span className="text-pool-chalk">this specific opponent</span> adds
                  a small adjustment (up to 25%, tapering off as more shots are taken in this game).
                </p>
                {(h2hStats.p1Wins + h2hStats.p2Wins) > 0 && (
                  <p className="font-body text-xs text-pool-chalk-dim mt-2 pt-2 border-t border-pool-border/50">
                    This matchup: <span style={{ color: p1Style?.color }}>{p1.display_name}</span> {h2hStats.p1Wins}
                    {' – '}
                    {h2hStats.p2Wins} <span style={{ color: p2Style?.color }}>{p2.display_name}</span>
                  </p>
                )}
              </div>
            </div>

            <button onClick={() => setShowOddsInfo(false)}
              className="w-full mt-5 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all">
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Win celebration overlay — dismissing reveals the recap below */}
      {showCelebration && game.winner && (
        <WinCelebration
          winner={game.winner}
          loser={game.winner.id === p1.id ? p2 : p1}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* Admin panel (Godine only) */}
      {adminPanel && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setAdminPanel(false)}>
          <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-pool-surface px-6 pt-6 pb-3 border-b border-pool-border">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl tracking-wider text-pool-chalk">EDIT GAME</h2>
                <button onClick={() => setAdminPanel(false)}
                  className="text-pool-chalk-dim hover:text-pool-chalk text-2xl leading-none px-1">×</button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Change winner */}
              <div>
                <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">CHANGE WINNER</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[p1, p2].map(player => {
                    const style = PLAYER_STYLES[player.username as PlayerUsername]
                    const sel = adminWinnerId === player.id
                    return (
                      <button key={player.id}
                        onClick={() => setAdminWinnerId(player.id)}
                        className={`py-3 rounded-xl border-2 font-heading text-base tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${sel ? 'border-pool-gold bg-pool-gold/15 text-pool-gold' : 'border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30'}`}>
                        {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                        {player.display_name.toUpperCase()}
                        {sel && ' 🏆'}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setAdminBlackBall(b => !b)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 text-sm font-body transition-all ${adminBlackBall ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk' : 'border-pool-border text-pool-chalk-dim'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${adminBlackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
                    {adminBlackBall && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  Loser potted the black ball
                </button>
                <button onClick={adminChangeWinner} disabled={!adminWinnerId || saving}
                  className="w-full py-3 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-95">
                  {saving ? 'SAVING…' : 'SAVE WINNER'}
                </button>
              </div>

              {/* Shot log with delete */}
              {shots.length > 0 && (
                <div>
                  <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">
                    SHOTS ({shots.length})
                  </p>
                  <div className="bg-pool-bg rounded-xl border border-pool-border divide-y divide-pool-border overflow-hidden">
                    {[...shots].sort((a, b) => a.shot_number - b.shot_number).map(s => {
                      const shooter = s.player_id === p1.id ? p1 : p2
                      const shooterStyle = PLAYER_STYLES[shooter.username as PlayerUsername]
                      const label = s.is_error ? 'Error' : s.is_lucky ? 'Lucky' : s.potted ? 'Potted' : 'Miss'
                      const labelColor = s.is_error ? '#ef4444' : s.is_lucky ? '#c9a227' : s.potted ? '#22c55e' : '#7a786f'
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                          <span className="font-body text-xs text-pool-chalk-dim w-6 text-right shrink-0">#{s.shot_number}</span>
                          <span className="font-body text-sm shrink-0" style={{ color: shooterStyle?.color }}>{shooter.display_name}</span>
                          <span className="font-body text-xs flex-1" style={{ color: labelColor }}>{label}</span>
                          <button onClick={() => adminDeleteShot(s.id)}
                            className="text-pool-red hover:text-red-400 text-lg leading-none px-1 transition-colors">
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Danger zone */}
              <div className="border border-pool-red/30 rounded-xl p-4 space-y-2">
                <p className="font-heading text-xs tracking-widest text-pool-red mb-3">DANGER ZONE</p>
                {game.is_complete && (
                  <button onClick={adminReopenGame} disabled={saving}
                    className="w-full py-3 rounded-xl border border-pool-border font-heading text-sm tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95 disabled:opacity-40">
                    {saving ? 'SAVING…' : '🔓 RE-OPEN GAME (keep shots)'}
                  </button>
                )}
                <button onClick={adminResetGame} disabled={saving}
                  className="w-full py-3 rounded-xl border border-pool-red/40 bg-pool-red/10 font-heading text-sm tracking-widest text-pool-red hover:bg-pool-red/20 transition-all active:scale-95 disabled:opacity-40">
                  {saving ? 'SAVING…' : '🗑️ RESET ALL SHOTS & RESULT'}
                </button>
              </div>
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Trash talk overlay */}
      {showTrashTalk && game?.winner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-pool-bg/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowTrashTalk(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border-2 p-6 flex flex-col items-center gap-5 text-center"
            style={{
              borderColor: PLAYER_STYLES[game.winner.username as PlayerUsername]?.color ?? '#c9a227',
              background: 'linear-gradient(160deg, #0e1e12 0%, #060d08 100%)',
              boxShadow: `0 0 40px ${PLAYER_STYLES[game.winner.username as PlayerUsername]?.color ?? '#c9a227'}55`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-body text-xs tracking-[0.25em] uppercase text-pool-chalk-dim">Thonara 2026 · Game Recap</p>
            <div className="text-5xl">📢</div>
            <p className="font-heading text-xl tracking-wide text-pool-chalk leading-snug">{trashTalkLine}</p>
            <div className="w-full grid grid-cols-2 gap-3 pt-2 border-t border-pool-border">
              {[game.player1, game.player2].map(pl => {
                const st = getStats(shots, pl.id)
                const acc = st.shots > 0 ? Math.round((st.potted / st.shots) * 100) : 0
                const plStyle = PLAYER_STYLES[pl.username as PlayerUsername]
                const isWinner = pl.id === game.winner_id
                return (
                  <div key={pl.id} className="text-center">
                    <p className="font-heading text-sm tracking-widest mb-1" style={{ color: plStyle?.color }}>
                      {pl.display_name.toUpperCase()}{isWinner ? ' 👑' : ''}
                    </p>
                    <p className="font-heading text-3xl text-pool-chalk">{st.potted}</p>
                    <p className="font-body text-xs text-pool-chalk-dim">pots · {acc}%</p>
                    {st.errors > 0 && <p className="font-body text-xs text-pool-red mt-0.5">{st.errors} errors</p>}
                    {st.lucky > 0 && <p className="font-body text-xs text-pool-gold mt-0.5">{st.lucky} flukes</p>}
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setShowTrashTalk(false)}
              className="font-body text-xs text-pool-chalk-dim hover:text-pool-chalk transition-colors"
            >
              tap anywhere to close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
