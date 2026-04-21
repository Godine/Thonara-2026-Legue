'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Game, Player, Shot } from '@/types/database'

interface GameFull extends Game {
  player1: Player
  player2: Player
  winner: Player | null
}

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

type ShotType = 'potted' | 'lucky' | 'miss' | 'error'

interface EndGameState {
  open: boolean
  winnerId: string
  blackBall: boolean
}

export default function GamePage() {
  const { id: sessionId, gameId } = useParams<{ id: string; gameId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [game, setGame] = useState<GameFull | null>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [endGame, setEndGame] = useState<EndGameState>({ open: false, winnerId: '', blackBall: false })
  const [isLocked, setIsLocked] = useState(false)
  const [flash, setFlash] = useState<{ playerId: string; type: ShotType } | null>(null)

  const fetchGame = useCallback(async () => {
    const [{ data: gameData }, { data: shotsData }] = await Promise.all([
      supabase
        .from('games')
        .select(`*, player1:players!games_player1_id_fkey(*), player2:players!games_player2_id_fkey(*), winner:players!games_winner_id_fkey(*)`)
        .eq('id', gameId)
        .single(),
      supabase
        .from('shots')
        .select('*')
        .eq('game_id', gameId)
        .order('shot_number', { ascending: true }),
    ])

    if (gameData) {
      setGame(gameData as GameFull)
      // Check session lock
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('created_at')
        .eq('id', sessionId)
        .single()
      if (sessionData) {
        const age = Date.now() - new Date(sessionData.created_at).getTime()
        setIsLocked(age > 7 * 24 * 60 * 60 * 1000)
      }
    }
    if (shotsData) setShots(shotsData as Shot[])
    setLoading(false)
  }, [gameId, sessionId])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setCurrentUser(uid)
      if (uid) {
        supabase.from('players').select('username').eq('id', uid).single()
          .then(({ data: p }) => setCurrentUsername(p?.username ?? null))
      }
    })
    fetchGame()

    // Realtime for shots
    const channel = supabase
      .channel(`game-shots-${gameId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'shots',
        filter: `game_id=eq.${gameId}`,
      }, () => fetchGame())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games',
        filter: `id=eq.${gameId}`,
      }, () => fetchGame())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, fetchGame])

  const schedule = game
    ? GAME_SCHEDULE.find(g => g.gameNumber === game.game_number)
    : null

  const isScorer = schedule?.scorer === currentUsername
  const canEdit = isScorer && !isLocked && !game?.is_complete

  const recordShot = async (playerId: string, type: ShotType) => {
    if (!canEdit || saving) return
    setSaving(true)

    // Flash animation
    setFlash({ playerId, type })
    setTimeout(() => setFlash(null), 400)

    const nextNumber = shots.length + 1
    const payload = {
      game_id: gameId,
      player_id: playerId,
      potted: type === 'potted' || type === 'lucky',
      is_lucky: type === 'lucky',
      is_error: type === 'error',
      shot_number: nextNumber,
    }

    await supabase.from('shots').insert(payload)
    setSaving(false)
  }

  const undoLastShot = async () => {
    if (!canEdit || saving || shots.length === 0) return
    setSaving(true)
    const last = shots[shots.length - 1]
    await supabase.from('shots').delete().eq('id', last.id)
    setSaving(false)
  }

  const confirmEndGame = async () => {
    if (!endGame.winnerId || saving) return
    setSaving(true)
    await supabase.from('games').update({
      winner_id: endGame.winnerId,
      loser_potted_black: endGame.blackBall,
      is_complete: true,
    }).eq('id', gameId)
    setSaving(false)
    setEndGame(e => ({ ...e, open: false }))
    router.push(`/session/${sessionId}`)
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
          {game.is_complete && (
            <span className="text-xs font-body text-pool-green-bright bg-pool-green-bright/10 px-3 py-1 rounded-full border border-pool-green-bright/30">
              Complete
            </span>
          )}
        </div>
        {schedule && !game.is_complete && (
          <p className="text-xs font-body text-pool-chalk-dim mt-1">
            {isScorer
              ? '📝 You are scoring this game'
              : `📱 ${PLAYER_STYLES[schedule.scorer as PlayerUsername]?.label} is scoring · watching live`}
          </p>
        )}
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/30 to-transparent" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-3">
        {[{ player: p1, stats: p1Stats, style: p1Style }, { player: p2, stats: p2Stats, style: p2Style }].map(({ player, stats, style }) => {
          const isWinner = game.winner_id === player.id
          return (
            <div
              key={player.id}
              className={`rounded-2xl border p-3 transition-all ${
                isWinner
                  ? 'bg-pool-gold/10 border-pool-gold/50 glow-gold'
                  : 'bg-pool-surface border-pool-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                <span className="font-heading text-base tracking-wide" style={{ color: style?.color }}>
                  {player.display_name.toUpperCase()}
                </span>
                {isWinner && <span className="text-sm">🏆</span>}
              </div>
              <div className="space-y-1">
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
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((stats.potted / stats.shots) * 100)}%`,
                        backgroundColor: style?.color,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Shot entry (scorer only, game not complete) */}
      {canEdit ? (
        <div className="px-4 flex-1 flex flex-col">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3 text-center">
            TAP TO RECORD A SHOT
          </p>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              { player: p1, stats: p1Stats, style: p1Style },
              { player: p2, stats: p2Stats, style: p2Style },
            ].map(({ player, stats, style }) => {
              const isFlashing = flash?.playerId === player.id
              return (
                <div
                  key={player.id}
                  className={`flex flex-col gap-2 transition-all duration-150 ${isFlashing ? 'scale-[0.98] brightness-125' : ''}`}
                >
                  {/* Player label */}
                  <div className="text-center py-1">
                    <span className="font-heading text-sm tracking-widest" style={{ color: style?.color }}>
                      {player.display_name.toUpperCase()}
                    </span>
                  </div>
                  {/* Shot buttons */}
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

          {/* Bottom bar */}
          <div className="flex gap-3 py-4">
            <button
              onClick={undoLastShot}
              disabled={saving || shots.length === 0}
              className="flex-1 py-3 rounded-xl border border-pool-border font-heading text-base tracking-widest text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all disabled:opacity-30 active:scale-95"
            >
              ↩ UNDO
            </button>
            <button
              onClick={() => setEndGame({ open: true, winnerId: p1.id, blackBall: false })}
              className="flex-1 py-3 rounded-xl bg-pool-gold text-pool-bg font-heading text-base tracking-widest hover:bg-pool-gold-light transition-all active:scale-95 glow-gold"
            >
              END GAME ▶
            </button>
          </div>
        </div>
      ) : (
        /* Read-only view for non-scorers or completed games */
        <div className="px-4 flex-1">
          {game.is_complete && game.winner && (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-heading text-2xl tracking-wider text-pool-gold">
                {game.winner.display_name.toUpperCase()} WINS!
              </p>
              {game.loser_potted_black && (
                <p className="text-xs font-body text-pool-chalk-dim mt-2">Opponent potted the black ball</p>
              )}
            </div>
          )}
          {!game.is_complete && !isScorer && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📱</div>
              <p className="font-body text-pool-chalk-dim text-sm">
                Watching live — updates appear automatically
              </p>
            </div>
          )}
          {isLocked && !game.is_complete && (
            <div className="text-center py-8">
              <p className="font-body text-pool-chalk-dim text-sm">
                This session is locked. Contact Adib to make corrections.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Shot log (last 5 shots) */}
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

            {/* Winner selection */}
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-3">Who won?</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[p1, p2].map(player => {
                const style = PLAYER_STYLES[player.username as PlayerUsername]
                const selected = endGame.winnerId === player.id
                return (
                  <button
                    key={player.id}
                    onClick={() => setEndGame(e => ({ ...e, winnerId: player.id }))}
                    className={`py-4 rounded-2xl border-2 font-heading text-xl tracking-wider flex flex-col items-center gap-2 transition-all active:scale-95 ${
                      selected
                        ? 'border-pool-gold bg-pool-gold/15 text-pool-gold'
                        : 'border-pool-border bg-pool-bg text-pool-chalk-dim hover:border-pool-chalk/30'
                    }`}
                  >
                    {style && <PlayerBall number={style.number} color={style.color} size={40} />}
                    {player.display_name.toUpperCase()}
                    {selected && <span className="text-sm">🏆</span>}
                  </button>
                )
              })}
            </div>

            {/* Black ball toggle */}
            <button
              onClick={() => setEndGame(e => ({ ...e, blackBall: !e.blackBall }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 transition-all ${
                endGame.blackBall
                  ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk'
                  : 'border-pool-border bg-pool-bg text-pool-chalk-dim'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                endGame.blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'
              }`}>
                {endGame.blackBall && <span className="text-xs text-white">✓</span>}
              </div>
              <span className="font-body text-sm">Loser potted the black ball</span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setEndGame(e => ({ ...e, open: false }))}
                className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-wider text-pool-chalk-dim hover:text-pool-chalk transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={confirmEndGame}
                disabled={!endGame.winnerId || saving}
                className="flex-1 py-4 rounded-xl bg-pool-gold text-pool-bg font-heading text-lg tracking-widest hover:bg-pool-gold-light disabled:opacity-40 transition-all active:scale-95 glow-gold"
              >
                {saving ? 'SAVING…' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
