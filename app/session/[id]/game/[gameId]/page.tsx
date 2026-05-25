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
import { getPlayerStats, formatTime, type PlayerStats } from '@/lib/stats'
import { computeOdds } from '@/lib/odds'
import { pickTrashTalk } from '@/lib/trash-talk'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer } from '@/components/PlayerGate'
import PlayerBall from '@/components/PlayerBall'
import WinCelebration from '@/components/WinCelebration'
import type { Player, Shot } from '@/types/database'

type GameFull = GameWithPlayers

type ShotType = 'potted' | 'lucky' | 'miss' | 'error' | 'scratch'

interface EndGameState {
  open: boolean
  winnerId: string
  blackBall: boolean
}

interface PotPopupState {
  playerId: string
  ownBalls: number
  oppBalls: number
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
  const [breakYellows, setBreakYellows] = useState(0)
  const [breakReds, setBreakReds]       = useState(0)
  const [breakBlack, setBreakBlack]     = useState(false)
  const [breakChosenColor, setBreakChosenColor] = useState<'yellow' | 'red' | null>(null)
  const [potPopup, setPotPopup]         = useState<PotPopupState | null>(null)
  const [colorAssignment, setColorAssignment] = useState<Record<string, 'yellow' | 'red'> | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const prevCompleteRef   = useRef<boolean | undefined>(undefined)
  const timerStartRef     = useRef<number | null>(null)
  const longPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const pendingQueue      = useRef<Array<Parameters<typeof insertShot>[1]>>([])
  const flushingRef       = useRef(false)

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
        acc[s.player_id].potted += s.balls_potted ?? (s.potted ? 1 : 0)
      }
      setHistStats(acc)
      setH2hStats(h2h)
    })
  }, [game?.player1.id, game?.player2.id, gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game?.is_complete && prevCompleteRef.current === false) {
      setShowCelebration(true)
    }
    prevCompleteRef.current = game?.is_complete ?? false
  }, [game?.is_complete])

  useEffect(() => {
    if (shots.length > 0 && !timerStarted) {
      timerStartRef.current = new Date(shots[0].created_at).getTime()
      setTimerStarted(true)
    }
  }, [shots, timerStarted])

  useEffect(() => {
    if (!timerStarted || game?.is_complete) return
    const tick = () => setElapsed(Math.floor((Date.now() - timerStartRef.current!) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timerStarted, game?.is_complete])

  useEffect(() => {
    if (colorAssignment !== null || shots.length === 0 || !game) return
    const coloredShot = shots.find(s => s.ball_color === 'yellow' || s.ball_color === 'red')
    if (!coloredShot) return
    const pid = coloredShot.player_id
    const color = coloredShot.ball_color as 'yellow' | 'red'
    const otherId = pid === game.player1_id ? game.player2_id : game.player1_id
    setColorAssignment({ [pid]: color, [otherId]: color === 'yellow' ? 'red' : 'yellow' })
  }, [shots, game?.player1_id, game?.player2_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function flushPending() {
      if (flushingRef.current || pendingQueue.current.length === 0) return
      flushingRef.current = true
      const queue = [...pendingQueue.current]
      pendingQueue.current = []
      setPendingCount(0)
      const failed: typeof queue = []
      for (const shot of queue) {
        try {
          await insertShot(db, shot) // eslint-disable-line react-hooks/exhaustive-deps
        } catch {
          failed.push(shot)
        }
      }
      if (failed.length > 0) {
        pendingQueue.current = [...failed, ...pendingQueue.current]
        setPendingCount(pendingQueue.current.length)
      }
      flushingRef.current = false
    }
    window.addEventListener('online', flushPending)
    return () => window.removeEventListener('online', flushPending)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const haptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
  }

  const canEdit = !!currentUsername && !game?.is_complete

  const recordShot = async (playerId: string, type: ShotType) => {
    if (!canEdit || saving) return
    setSaving(true)
    setFlash({ playerId, type })
    setTimeout(() => setFlash(null), 350)
    const hapticPatterns: Record<ShotType, number | number[]> = {
      potted:  40,
      lucky:   [10, 5, 10, 5, 10],
      miss:    15,
      error:   [20, 10, 20],
      scratch: [40, 10, 20],
    }
    haptic(hapticPatterns[type])
    const isPotted = type === 'potted' || type === 'lucky' || type === 'scratch'
    const isScratch = type === 'scratch'
    const isError = type === 'error' || type === 'scratch'
    const newShotNumber = shots.length + 1
    const optimistic: Shot = {
      id: `temp-${Date.now()}`,
      game_id: gameId,
      player_id: playerId,
      potted: isPotted,
      balls_potted: isPotted ? 1 : 0,
      opponent_balls_potted: 0,
      ball_color: (isPotted && !isScratch && colorAssignment) ? (colorAssignment[playerId] ?? null) : null,
      is_lucky: type === 'lucky',
      is_error: isError,
      shot_number: newShotNumber,
      created_at: new Date().toISOString(),
    }
    setShots(prev => [...prev, optimistic])
    const shotData: Parameters<typeof insertShot>[1] = {
      game_id: gameId,
      player_id: playerId,
      potted: isPotted,
      balls_potted: isPotted ? 1 : 0,
      opponent_balls_potted: 0,
      ball_color: (isPotted && !isScratch && colorAssignment) ? (colorAssignment[playerId] ?? null) : null,
      is_lucky: optimistic.is_lucky,
      is_error: optimistic.is_error,
      shot_number: newShotNumber,
    }
    try {
      await insertShot(db, shotData)
    } catch {
      pendingQueue.current.push(shotData)
      setPendingCount(pendingQueue.current.length)
    }
    setSaving(false)
  }

  const recordMultiPot = async (playerId: string, ownBalls: number, oppBalls: number) => {
    if (!canEdit || saving) return
    setPotPopup(null)
    setSaving(true)
    const isFoul = oppBalls > 0
    setFlash({ playerId, type: isFoul ? 'error' : 'potted' })
    setTimeout(() => setFlash(null), 350)
    haptic(isFoul ? [20, 10, 20] : ownBalls > 1 ? [40, 15, 40] : 40)
    const newShotNumber = shots.length + 1
    const optimistic: Shot = {
      id: `temp-${Date.now()}`,
      game_id: gameId,
      player_id: playerId,
      potted: ownBalls > 0,
      balls_potted: ownBalls,
      opponent_balls_potted: oppBalls,
      ball_color: (ownBalls > 0 && !isFoul && colorAssignment) ? (colorAssignment[playerId] ?? null) : null,
      is_lucky: false,
      is_error: isFoul,
      shot_number: newShotNumber,
      created_at: new Date().toISOString(),
    }
    setShots(prev => [...prev, optimistic])
    await insertShot(db, {
      game_id: gameId,
      player_id: playerId,
      potted: ownBalls > 0,
      balls_potted: ownBalls,
      opponent_balls_potted: oppBalls,
      ball_color: (ownBalls > 0 && !isFoul && colorAssignment) ? (colorAssignment[playerId] ?? null) : null,
      is_lucky: false,
      is_error: isFoul,
      shot_number: newShotNumber,
    })
    setSaving(false)
  }

  const handlePotPressStart = (playerId: string) => {
    if (!canEdit || saving) return
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      haptic([10, 5, 20])
      setPotPopup({ playerId, ownBalls: 1, oppBalls: 0 })
    }, 400)
  }

  const handlePotPressEnd = (playerId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!longPressTriggered.current) {
      recordShot(playerId, 'potted')
    }
  }

  const handlePotPressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const recordBreak = async () => {
    const totalColored = breakYellows + breakReds
    if (!breaker || saving) return
    if (totalColored > 0 && !breakChosenColor) return
    setSaving(true)
    const rows: Parameters<typeof insertShots>[1] = []
    let shotNum = 1
    if (totalColored === 0 && !breakBlack) {
      // Miss
      rows.push({ game_id: gameId, player_id: breaker, potted: false, balls_potted: 0, opponent_balls_potted: 0, ball_color: null, is_lucky: false, is_error: false, shot_number: shotNum++ })
    } else {
      if (totalColored > 0 && breakChosenColor) {
        const chosenBalls = breakChosenColor === 'yellow' ? breakYellows : breakReds
        const otherBalls  = breakChosenColor === 'yellow' ? breakReds    : breakYellows
        rows.push({ game_id: gameId, player_id: breaker, potted: chosenBalls > 0, balls_potted: chosenBalls, opponent_balls_potted: otherBalls, ball_color: breakChosenColor, is_lucky: false, is_error: false, shot_number: shotNum++ })
      }
      if (breakBlack) {
        rows.push({ game_id: gameId, player_id: breaker, potted: true, balls_potted: 1, opponent_balls_potted: 0, ball_color: 'black', is_lucky: false, is_error: false, shot_number: shotNum++ })
      }
    }
    const now = Date.now()
    setShots(rows.map((r, i) => ({ id: `temp-${now}-${i}`, created_at: new Date().toISOString(), ...r })))
    try {
      await insertShots(db, rows)
    } catch {
      rows.forEach(r => {
        pendingQueue.current.push(r)
      })
      setPendingCount(pendingQueue.current.length)
    }
    haptic((totalColored + (breakBlack ? 1 : 0)) > 0 ? [30, 15, 30] : 20)
    setSaving(false)
    if (breakChosenColor && game) {
      const otherId = game.player1_id === breaker ? game.player2_id : game.player1_id
      setColorAssignment({ [breaker]: breakChosenColor, [otherId]: breakChosenColor === 'yellow' ? 'red' : 'yellow' })
    }
    setBreaker(null)
    setBreakYellows(0)
    setBreakReds(0)
    setBreakBlack(false)
    setBreakChosenColor(null)
  }

  const undoLastShot = async () => {
    if (!canEdit || saving || shots.length === 0) return
    const lastShot = shots[shots.length - 1]
    setShots(prev => prev.filter(s => s.id !== lastShot.id))
    // Also remove from pending queue if it was never saved
    if (lastShot.id.startsWith('temp-')) {
      pendingQueue.current = pendingQueue.current.slice(0, -1)
      setPendingCount(pendingQueue.current.length)
      return
    }
    setSaving(true)
    try {
      await deleteShot(db, lastShot.id)
    } catch {
      // Re-add the shot if delete failed
      setShots(prev => [...prev, lastShot])
    }
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
    haptic([80, 40, 80, 40, 150])
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
  const p1Stats = getPlayerStats(shots, p1.id)
  const p2Stats = getPlayerStats(shots, p2.id)

  // Whose turn: pot (no foul) keeps the shooter's turn, miss/error/foul switches it
  const lastShot = shots.length > 0 ? shots[shots.length - 1] : null
  const lastShotPotted = lastShot
    ? ((lastShot.balls_potted ?? (lastShot.potted ? 1 : 0)) > 0) && !lastShot.is_error
    : false
  const isP1Turn = !lastShot ? true : (lastShot.player_id === p1.id) === lastShotPotted

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
    let pots = 0, yellows = 0, reds = 0, black = false
    for (const s of sorted) {
      if (s.player_id !== breakerId) break
      const sp  = s.balls_potted ?? (s.potted ? 1 : 0)
      const opp = s.opponent_balls_potted ?? 0
      if (sp === 0 && opp === 0) break
      pots += sp + opp
      if (s.ball_color === 'yellow')      { yellows += sp; reds    += opp }
      else if (s.ball_color === 'red')    { reds    += sp; yellows += opp }
      else if (s.ball_color === 'black')  { black = true }
    }
    return { pots, yellows, reds, black, breakPlayer: breakerId === p1.id ? p1 : p2 }
  })()

  const gameDuration = shots.length >= 2
    ? Math.floor(
        (new Date(shots[shots.length - 1].created_at).getTime() - new Date(shots[0].created_at).getTime()) / 1000
      )
    : null

  const shotButtons: { type: ShotType; label: string; icon: string; classes: string; small?: boolean }[] = [
    { type: 'potted',  label: 'POT',    icon: '●',  classes: 'bg-pool-green-bright/20 border-pool-green-bright/50 text-pool-green-bright hover:bg-pool-green-bright/30 active:bg-pool-green-bright/40' },
    { type: 'lucky',   label: 'LUCKY',  icon: '★',  classes: 'bg-pool-gold/15 border-pool-gold/50 text-pool-gold hover:bg-pool-gold/25 active:bg-pool-gold/35' },
    { type: 'miss',    label: 'MISS',   icon: '✕',  classes: 'bg-pool-surface border-pool-border text-pool-chalk-dim hover:bg-pool-border active:bg-pool-border' },
    { type: 'error',   label: 'ERR',    icon: '⚠',  classes: 'bg-pool-red/15 border-pool-red/40 text-pool-red hover:bg-pool-red/25 active:bg-pool-red/35' },
    { type: 'scratch', label: 'IN-OFF', icon: '●○', classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30', small: true },
  ]

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-dvh">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Link href={`/session/${sessionId}`} className="font-body text-sm text-pool-chalk-dim hover:text-pool-gold transition-colors shrink-0">
          ← G{game.game_number}
        </Link>
        <h1 className="font-heading text-sm tracking-wider leading-none flex-1 text-center">
          <span style={{ color: p1Style?.color }}>{p1.display_name.toUpperCase()}</span>
          <span className="text-pool-chalk-dim"> vs </span>
          <span style={{ color: p2Style?.color }}>{p2.display_name.toUpperCase()}</span>
        </h1>
        <div className="shrink-0 text-right min-w-[56px]">
          {game.is_complete ? (
            <span className="font-body text-xs text-pool-green-bright">✓ Done</span>
          ) : timerStarted ? (
            <span className="font-heading text-sm text-pool-chalk tabular-nums">{formatTime(elapsed)}</span>
          ) : currentUsername ? (
            <span className="font-body text-[10px] text-pool-chalk-dim">📝 {PLAYER_STYLES[currentUsername]?.label}</span>
          ) : null}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-3">
        {([
          { player: p1, stats: p1Stats, style: p1Style, oddsVal: odds.p1, isMyTurn: isP1Turn },
          { player: p2, stats: p2Stats, style: p2Style, oddsVal: odds.p2, isMyTurn: !isP1Turn },
        ] as const).map(({ player, stats, style, oddsVal, isMyTurn }) => {
          const isWinner = game.winner_id === player.id
          const acc = stats.shots > 0 ? Math.round((stats.ownPotted / stats.shots) * 100) : 0
          const showOdds = !game.is_complete && (p1Stats.shots + p2Stats.shots > 0 || Object.keys(histStats).length > 0)
          return (
            <div
              key={player.id}
              className={`rounded-2xl p-3 border transition-all ${isWinner ? 'bg-pool-gold/10 border-pool-gold/50' : 'bg-pool-surface'}`}
              style={{ borderColor: isWinner ? undefined : (!game.is_complete && isMyTurn ? (style?.color + '80') : undefined) }}
            >
              {/* Name + potted */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {style && <PlayerBall number={style.number} color={style.color} size={22} />}
                  <div className="min-w-0">
                    <p className="font-heading text-sm tracking-wide leading-none truncate" style={{ color: style?.color }}>
                      {player.display_name.toUpperCase()}
                      {!game.is_complete && isMyTurn && <span className="ml-1 text-[10px]">▶</span>}
                      {isWinner && <span className="ml-1">🏆</span>}
                    </p>
                    <p className="font-body text-[10px] text-pool-chalk-dim mt-0.5 leading-none">
                      {stats.shots} shots
                      {stats.errors > 0 && <span className="text-pool-red"> · {stats.errors} err</span>}
                      {stats.lucky > 0 && <span className="text-pool-gold"> · {stats.lucky}★</span>}
                    </p>
                  </div>
                </div>
                <span className="font-heading text-3xl text-pool-chalk tabular-nums leading-none shrink-0 ml-1">{stats.potted}</span>
              </div>
              {/* Accuracy bar */}
              <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: '#1f3525' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${acc}%`, backgroundColor: style?.color }} />
              </div>
              {/* Accuracy + win odds */}
              <div className="flex items-center justify-between">
                <span className="font-body text-[10px] text-pool-chalk-dim">{stats.shots > 0 ? `${acc}% acc` : '—'}</span>
                {showOdds && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowOddsInfo(true)} className="font-body text-[10px] text-pool-chalk-dim/40 hover:text-pool-chalk-dim transition-colors leading-none">ⓘ</button>
                    <span className="font-heading text-xs leading-none" style={{ color: style?.color }}>{oddsVal}% win</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

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
              <div className="flex items-center gap-3">
                {breakInfo.pots === 0 ? (
                  <p className="font-heading text-xl text-pool-chalk-dim">No pots</p>
                ) : (
                  <>
                    {breakInfo.yellows > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shrink-0" />
                        <span className="font-heading text-2xl text-pool-chalk">{breakInfo.yellows}</span>
                      </div>
                    )}
                    {breakInfo.reds > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-pool-red shrink-0" />
                        <span className="font-heading text-2xl text-pool-chalk">{breakInfo.reds}</span>
                      </div>
                    )}
                    {breakInfo.black && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-pool-chalk shrink-0" />
                        <span className="font-heading text-2xl text-pool-chalk">1</span>
                      </div>
                    )}
                    {(breakInfo.yellows === 0 && breakInfo.reds === 0 && !breakInfo.black) && (
                      <p className="font-heading text-2xl text-pool-chalk">{breakInfo.pots} {breakInfo.pots === 1 ? 'pot' : 'pots'}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {game.winner && (
            <button
              onClick={() => {
                const wStats = getPlayerStats(shots, game.winner_id!)
                const lId = game.player1_id === game.winner_id ? game.player2_id : game.player1_id
                const loser = game.player1_id === game.winner_id ? game.player2 : game.player1
                const lStats = getPlayerStats(shots, lId)
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
        <div className="px-4 flex flex-col">
          {shots.length === 0 ? (

            /* Break recording */
            <div className="flex-1 flex flex-col">
              <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">WHO BROKE?</p>

              <Link
                href={`/coin?p1=${p1.username}&p2=${p2.username}&back=/session/${game.session_id}/game/${game.id}`}
                className="flex items-center justify-center gap-2 mb-4 py-2.5 rounded-xl border border-pool-border text-pool-chalk-dim font-body text-sm hover:text-pool-chalk hover:border-pool-chalk/30 transition-all"
              >
                🪙 <span>Can't decide? Flip a coin</span>
              </Link>

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
                <div className="bg-pool-surface border border-pool-border rounded-2xl p-4 mb-4 space-y-3">
                  <p className="font-body text-xs text-pool-chalk-dim text-center">Balls potted on break</p>

                  {/* Yellows */}
                  {([
                    { label: 'Yellows', color: '#facc15', count: breakYellows, setCount: setBreakYellows },
                    { label: 'Reds',    color: '#ef4444', count: breakReds,    setCount: setBreakReds    },
                  ] as const).map(({ label, color, count, setCount }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-body text-sm text-pool-chalk">{label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setCount(p => Math.max(0, p - 1))}
                          className="w-9 h-9 rounded-lg border border-pool-border font-heading text-xl text-pool-chalk-dim hover:border-pool-chalk/40 hover:text-pool-chalk transition-all active:scale-90"
                        >−</button>
                        <span className="font-heading text-2xl text-pool-chalk w-5 text-center tabular-nums">{count}</span>
                        <button
                          onClick={() => setCount(p => Math.min(7, p + 1))}
                          className="w-9 h-9 rounded-lg border border-pool-border font-heading text-xl text-pool-chalk-dim hover:border-pool-chalk/40 hover:text-pool-chalk transition-all active:scale-90"
                        >+</button>
                      </div>
                    </div>
                  ))}

                  {/* Black */}
                  <button
                    onClick={() => setBreakBlack(b => !b)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${breakBlack ? 'border-pool-chalk/50 bg-pool-chalk/10 text-pool-chalk' : 'border-pool-border text-pool-chalk-dim'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${breakBlack ? 'bg-pool-chalk border-pool-chalk' : 'border-pool-chalk-dim'}`} />
                    <span className="font-body text-sm">Black ball potted</span>
                  </button>

                  {/* Breaker's chosen color — only when colored balls were potted */}
                  {(breakYellows + breakReds) > 0 && (
                    <div className="pt-1">
                      <p className="font-body text-xs text-pool-chalk-dim text-center mb-2">Breaker's colour</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['yellow', 'red'] as const).map(color => (
                          <button
                            key={color}
                            onClick={() => setBreakChosenColor(color)}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-body text-sm transition-all active:scale-95 ${
                              breakChosenColor === color
                                ? color === 'yellow'
                                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                                  : 'border-red-500 bg-red-500/20 text-red-400'
                                : 'border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color === 'yellow' ? '#facc15' : '#ef4444' }} />
                            {color === 'yellow' ? 'Yellow' : 'Red'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={recordBreak}
                disabled={!breaker || saving || ((breakYellows + breakReds) > 0 && !breakChosenColor)}
                className="w-full py-4 rounded-2xl bg-pool-gold text-pool-bg font-heading text-xl tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-[0.98] glow-gold"
              >
                {saving ? 'SAVING…' : 'RECORD BREAK'}
              </button>
            </div>

          ) : (

            /* Regular shot buttons */
            <>
              {/* Color assignment */}
              {colorAssignment ? (
                <div className="flex items-center gap-2 bg-pool-surface rounded-xl border border-pool-border px-3 py-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorAssignment[p1.id] === 'yellow' ? '#facc15' : '#ef4444' }} />
                    <span className="font-body text-xs text-pool-chalk">{p1.display_name}</span>
                  </div>
                  <button
                    onClick={() => setColorAssignment({ [p1.id]: colorAssignment[p1.id] === 'yellow' ? 'red' : 'yellow', [p2.id]: colorAssignment[p2.id] === 'yellow' ? 'red' : 'yellow' })}
                    className="font-body text-sm text-pool-chalk-dim/50 hover:text-pool-chalk-dim transition-colors px-2"
                  >⇄</button>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="font-body text-xs text-pool-chalk">{p2.display_name}</span>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorAssignment[p2.id] === 'yellow' ? '#facc15' : '#ef4444' }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-body text-xs text-pool-chalk-dim shrink-0">On yellow:</span>
                  {[p1, p2].map(player => (
                    <button
                      key={player.id}
                      onClick={() => {
                        const otherId = player.id === p1.id ? p2.id : p1.id
                        setColorAssignment({ [player.id]: 'yellow', [otherId]: 'red' })
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-pool-border font-body text-xs text-pool-chalk-dim hover:border-yellow-400/50 hover:text-pool-chalk transition-all active:scale-95"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                      {player.display_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[{ player: p1, style: p1Style }, { player: p2, style: p2Style }].map(({ player, style }) => {
                  const isFlashing = flash?.playerId === player.id
                  const isMyTurn = player.id === p1.id ? isP1Turn : !isP1Turn
                  return (
                    <div key={player.id} className={`flex flex-col gap-1.5 transition-all duration-100 ${isFlashing ? 'scale-[0.97] brightness-125' : ''}`}>
                      <div className="text-center py-0.5">
                        <span className={`font-heading text-sm tracking-widest transition-all duration-200 ${isMyTurn ? '' : 'opacity-40'}`} style={{ color: style?.color }}>
                          {player.display_name.toUpperCase()}
                        </span>
                        {isMyTurn && <span className="ml-1.5 text-[11px] leading-none" style={{ color: style?.color }}>▶</span>}
                      </div>
                      {shotButtons.map(btn =>
                        btn.type === 'potted' ? (
                          <button
                            key={btn.type}
                            onPointerDown={() => handlePotPressStart(player.id)}
                            onPointerUp={() => handlePotPressEnd(player.id)}
                            onPointerLeave={handlePotPressCancel}
                            onPointerCancel={handlePotPressCancel}
                            disabled={saving}
                            className={`shot-btn w-full py-3 rounded-xl border font-heading text-base tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 select-none ${btn.classes}`}
                          >
                            <span>{btn.icon}</span>
                            <span>{btn.label}</span>
                          </button>
                        ) : (
                          <button
                            key={btn.type}
                            onClick={() => recordShot(player.id, btn.type)}
                            disabled={saving}
                            className={`shot-btn w-full ${btn.small ? 'py-1.5 text-xs' : 'py-3 text-base'} rounded-xl border font-heading tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${btn.classes}`}
                          >
                            <span>{btn.icon}</span>
                            <span>{btn.label}</span>
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 pt-2 pb-2">
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
        <div className="px-4 flex-1 flex flex-col gap-4 pb-6">
          <div className="rounded-2xl border border-pool-green-bright/20 px-4 py-5 text-center"
            style={{ background: 'linear-gradient(135deg, #22c55e0a 0%, transparent 100%)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-pool-green-bright animate-pulse" />
              <span className="font-heading text-xs tracking-widest text-pool-green-bright">LIVE</span>
            </div>
            <p className="font-body text-sm text-pool-chalk-dim">
              Updates stream automatically — no refresh needed.
            </p>
            <p className="font-body text-xs text-pool-chalk-dim/60 mt-2">
              Tap your name in the menu above to start scoring.
            </p>
          </div>
        </div>
      )}

      {/* Pending sync indicator (live only) */}
      {pendingCount > 0 && (
        <div className="mx-4 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-body text-xs text-amber-400">
            {pendingCount} shot{pendingCount !== 1 ? 's' : ''} pending sync
          </span>
        </div>
      )}

      {/* Last 5 shots */}
      {shots.length > 0 && (
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-pool-border bg-pool-surface">
          <div className="flex items-center justify-between px-4 py-2 border-b border-pool-border/60">
            <span className="font-heading text-xs tracking-widest text-pool-chalk-dim">LAST SHOTS</span>
            <span className="font-body text-xs text-pool-chalk-dim/50">{shots.length} total</span>
          </div>
          <div className="divide-y divide-pool-border/40">
            {shots.slice(-5).reverse().map((shot, i) => {
              const shooter = shot.player_id === p1.id ? p1 : p2
              const shooterStyle = shot.player_id === p1.id ? p1Style : p2Style
              const shotBalls = shot.balls_potted ?? (shot.potted ? 1 : 0)
              const oppBalls = shot.opponent_balls_potted ?? 0
              const label = shot.is_error
                ? oppBalls > 0 ? `⚠ Foul +${oppBalls}` : shotBalls > 0 ? `⚠ In-off` : '⚠ Error'
                : shot.is_lucky ? '★ Lucky'
                : shotBalls > 1 ? `● ×${shotBalls}`
                : shotBalls === 1 ? '● Potted'
                : '✕ Miss'
              const color = shot.is_error ? '#ef4444' : shot.is_lucky ? '#c9a227' : shotBalls > 0 ? '#22c55e' : '#7a786f'
              return (
                <div key={shot.id} className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 ? 'bg-pool-border/20' : ''}`}>
                  <span className="font-body text-xs text-pool-chalk-dim/50 w-5 shrink-0 tabular-nums">#{shot.shot_number}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: shooterStyle?.color }} />
                  <span className="font-body text-xs text-pool-chalk flex-1">{shooter.display_name}</span>
                  <span className="font-body text-xs font-medium" style={{ color }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Multi-ball pot popup */}
      {potPopup && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setPotPopup(null)}
        >
          <div
            className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-heading text-2xl tracking-wider text-pool-chalk text-center mb-6">HOW MANY BALLS?</h2>

            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Your balls</p>
            <div className="flex gap-3 mb-5">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setPotPopup(p => p ? { ...p, ownBalls: n } : p)}
                  className={`flex-1 py-4 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                    potPopup.ownBalls === n
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-pool-border text-pool-chalk-dim hover:border-green-500/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-2">Opponent's balls (foul pot)</p>
            <div className="flex gap-3 mb-5">
              {[0, 1, 2].map(n => (
                <button
                  key={n}
                  onClick={() => setPotPopup(p => p ? { ...p, oppBalls: n } : p)}
                  className={`flex-1 py-4 rounded-xl border-2 font-heading text-2xl transition-all active:scale-95 ${
                    potPopup.oppBalls === n
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-pool-border text-pool-chalk-dim hover:border-red-500/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {potPopup.oppBalls > 0 && (
              <p className="text-xs font-body text-pool-red text-center mb-4">⚠ Foul — marked as an error, ball credited to opponent</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPotPopup(null)}
                className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => recordMultiPot(potPopup.playerId, potPopup.ownBalls, potPopup.oppBalls)}
                className="flex-1 py-4 rounded-xl bg-pool-green-bright text-pool-bg font-heading text-lg tracking-widest hover:brightness-110 transition-all active:scale-[0.98]"
              >
                CONFIRM
              </button>
            </div>
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

      {/* Win celebration overlay */}
      {showCelebration && game.winner && (
        <WinCelebration
          winner={game.winner}
          loser={game.winner.id === p1.id ? p2 : p1}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* Admin panel (Amine only) */}
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

              {shots.length > 0 && (
                <div>
                  <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">
                    SHOTS ({shots.length})
                  </p>
                  <div className="bg-pool-bg rounded-xl border border-pool-border divide-y divide-pool-border overflow-hidden">
                    {[...shots].sort((a, b) => a.shot_number - b.shot_number).map(s => {
                      const shooter = s.player_id === p1.id ? p1 : p2
                      const shooterStyle = PLAYER_STYLES[shooter.username as PlayerUsername]
                      const shotBalls = s.balls_potted ?? (s.potted ? 1 : 0)
                      const oppBalls = s.opponent_balls_potted ?? 0
                      const label = s.is_error
                        ? oppBalls > 0 ? `Foul (+${oppBalls} opp)` : 'Error'
                        : s.is_lucky ? 'Lucky'
                        : shotBalls > 1 ? `×${shotBalls} Pots`
                        : shotBalls === 1 ? 'Potted'
                        : 'Miss'
                      const labelColor = s.is_error ? '#ef4444' : s.is_lucky ? '#c9a227' : shotBalls > 0 ? '#22c55e' : '#7a786f'
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
            <p className="font-body text-xs tracking-[0.25em] uppercase text-pool-chalk-dim">Thonara League · Game Recap</p>
            <div className="text-5xl">📢</div>
            <p className="font-heading text-xl tracking-wide text-pool-chalk leading-snug">{trashTalkLine}</p>
            <div className="w-full grid grid-cols-2 gap-3 pt-2 border-t border-pool-border">
              {[game.player1, game.player2].map(pl => {
                const st = getPlayerStats(shots, pl.id)
                const acc = st.shots > 0 ? Math.round((st.ownPotted / st.shots) * 100) : 0
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
