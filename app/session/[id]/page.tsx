'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import {
  fetchSession, fetchStandingsBasic, fetchCompletedGames,
  setGameResult, clearGameResult, deleteSession,
  type SessionFull, type StandingBasic,
} from '@/lib/queries'
import { getPlayerStats } from '@/lib/stats'
import { generateNarrative } from '@/lib/narrative'
import { getSessionPrediction } from '@/lib/session-prediction'
import { GAME_SCHEDULE, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from '@/components/PlayerBall'
import type { Game, Player, Shot } from '@/types/database'

interface QuickResult {
  gameId: string
  winnerId: string
  blackBall: boolean
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const db = createClient()

  const [session, setSession] = useState<SessionFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [quick, setQuick] = useState<QuickResult | null>(null)
  const [quickSaving, setQuickSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [standings, setStandings] = useState<StandingBasic[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [previewStats, setPreviewStats] = useState<{
    form: Record<string, boolean[]>
    streaks: Record<string, number>
    h2h: { u1: string; u2: string; n1: string; n2: string; w1: number; w2: number }[]
    lastSession: { date: string; wins: { name: string; count: number }[] } | null
  } | null>(null)

  const loadSession = useCallback(async () => {
    const data = await fetchSession(db, id)
    setSession(data)
    setLoading(false)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      fetchStandingsBasic(db),
      fetchCompletedGames(db),
    ]).then(([standingsData, gamesData]) => {
      setStandings(standingsData)

      if (!gamesData.length) return
      const gs = gamesData

      const idToUser: Record<string, string> = {}
      const idToName: Record<string, string> = {}
      for (const g of gs) {
        idToUser[g.player1.id] = g.player1.username
        idToUser[g.player2.id] = g.player2.username
        idToName[g.player1.id] = g.player1.display_name
        idToName[g.player2.id] = g.player2.display_name
      }

      const byPlayer: Record<string, { winnerId: string; sessionId: string; date: string }[]> = {}
      for (const g of gs) {
        for (const pid of [g.player1.id, g.player2.id]) {
          if (!byPlayer[pid]) byPlayer[pid] = []
          byPlayer[pid].push({ winnerId: g.winner_id, sessionId: g.session_id, date: g.session.date })
        }
      }

      const form: Record<string, boolean[]> = {}
      for (const [pid, playerGames] of Object.entries(byPlayer)) {
        const u = idToUser[pid]
        if (u) form[u] = playerGames.slice(-5).map(g => g.winnerId === pid)
      }

      const streaks: Record<string, number> = {}
      for (const [pid, playerGames] of Object.entries(byPlayer)) {
        const u = idToUser[pid]
        if (!u) continue
        let s = 0
        for (let i = playerGames.length - 1; i >= 0; i--) {
          if (playerGames[i].winnerId === pid) s++
          else break
        }
        streaks[u] = s
      }

      const h2hMap: Record<string, Record<string, number>> = {}
      for (const g of gs) {
        if (!g.winner_id) continue
        const wu = idToUser[g.winner_id]
        const lu = wu === g.player1.username ? g.player2.username : g.player1.username
        if (!h2hMap[wu]) h2hMap[wu] = {}
        h2hMap[wu][lu] = (h2hMap[wu][lu] ?? 0) + 1
      }
      const usernames = Array.from(new Set(Object.values(idToUser)))
      const pairs: { u1: string; u2: string; n1: string; n2: string; w1: number; w2: number }[] = []
      for (let i = 0; i < usernames.length; i++) {
        for (let j = i + 1; j < usernames.length; j++) {
          const u1 = usernames[i], u2 = usernames[j]
          const p1id = Object.keys(idToUser).find(k => idToUser[k] === u1) ?? ''
          const p2id = Object.keys(idToUser).find(k => idToUser[k] === u2) ?? ''
          pairs.push({
            u1, u2,
            n1: idToName[p1id] ?? u1,
            n2: idToName[p2id] ?? u2,
            w1: h2hMap[u1]?.[u2] ?? 0,
            w2: h2hMap[u2]?.[u1] ?? 0,
          })
        }
      }

      const sessionDates: Record<string, string> = {}
      for (const g of gs) sessionDates[g.session_id] = g.session.date
      const otherSessions = Object.entries(sessionDates)
        .filter(([sid]) => sid !== id)
        .sort(([, a], [, b]) => b.localeCompare(a))
      let lastSession: { date: string; wins: { name: string; count: number }[] } | null = null
      if (otherSessions.length > 0) {
        const [lastSid, lastDate] = otherSessions[0]
        const lastGames = gs.filter(g => g.session_id === lastSid && g.winner_id)
        const winCount: Record<string, number> = {}
        for (const g of lastGames) {
          const n = idToName[g.winner_id]
          if (n) winCount[n] = (winCount[n] ?? 0) + 1
        }
        lastSession = {
          date: lastDate,
          wins: Object.entries(winCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
        }
      }

      setPreviewStats({ form, streaks, h2h: pairs, lastSession })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSession()
    const channel = db
      .channel(`session-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games',  filter: `session_id=eq.${id}` }, loadSession)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, loadSession)
      .subscribe()
    return () => { db.removeChannel(channel) }
  }, [id, loadSession]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitQuickResult = async () => {
    if (!quick?.winnerId || quickSaving) return
    setQuickSaving(true)
    await setGameResult(db, quick.gameId, quick.winnerId, quick.blackBall)
    setQuick(null)
    setQuickSaving(false)
  }

  const handleDeleteSession = async () => {
    setDeleting(true)
    const gameIds = session?.games.map(g => g.id) ?? []
    await deleteSession(db, id, gameIds)
    router.push('/')
  }

  const handleClearResult = async (gameId: string) => {
    await clearGameResult(db, gameId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pool-chalk-dim font-body animate-pulse">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-pool-chalk-dim font-body">Session not found.</p>
        <Link href="/" className="text-pool-gold text-sm mt-4 block">← Home</Link>
      </div>
    )
  }

  const completedGames = session.games.filter(g => g.is_complete)
  const totalGames = session.games.length

  const sessionWins: Record<string, number> = {}
  for (const g of completedGames) {
    if (g.winner_id) sessionWins[g.winner_id] = (sessionWins[g.winner_id] ?? 0) + 1
  }

  const uniquePlayers = session.games
    .flatMap(g => [g.player1, g.player2])
    .filter((p, i, arr) => p && arr.findIndex(x => x?.id === p?.id) === i)

  const sortedStandings = [...standings].sort((a, b) => b.wins - a.wins)
  if (showPreview && completedGames.length === 0) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in flex flex-col min-h-dvh">

        {/* ── Hero ── */}
        <div className="relative px-4 pt-8 pb-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

          <div className="relative flex items-center justify-between mb-4">
            <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">← Home</Link>
            <button onClick={() => setShowPreview(false)}
              className="text-pool-chalk-dim text-xs font-body hover:text-pool-chalk transition-colors">
              skip →
            </button>
          </div>

          <div className="relative">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-pool-gold/60 mb-1">
              {format(new Date(session.date + 'T12:00:00'), 'EEEE, MMMM d')}
            </p>
            <h1
              className="font-heading text-[5.5rem] leading-none tracking-widest text-pool-chalk"
              style={{ textShadow: '0 0 60px #1a4731, 0 0 20px #1a4731' }}
            >
              TONIGHT
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-pool-gold/40" />
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="9" fill="#111" />
                <circle cx="9" cy="9" r="4.5" fill="white" />
                <text x="9" y="12.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#111">8</text>
              </svg>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-pool-gold/40" />
            </div>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-4 pb-8">

          {/* ── Prediction ── */}
          {(() => {
            const predPlayers = sortedStandings.map(s => ({
              username: s.username as PlayerUsername,
              displayName: s.display_name,
            }))
            const pred = getSessionPrediction(session.id, predPlayers)
            if (!pred) return null
            const predStyle = PLAYER_STYLES[pred.username]
            return (
              <div
                className="relative overflow-hidden rounded-2xl border"
                style={{ borderColor: `${predStyle?.color}40`, background: `linear-gradient(135deg, ${predStyle?.color}14 0%, ${predStyle?.color}06 100%)` }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative px-4 pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-sm">🔮</span>
                    <p className="font-heading text-[10px] tracking-[0.25em] text-pool-chalk-dim">TONIGHT&apos;S PREDICTION</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      style={{ filter: `drop-shadow(0 0 12px ${predStyle?.color}80)` }}
                    >
                      {predStyle && <PlayerBall number={predStyle.number} color={predStyle.color} size={52} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-heading text-2xl tracking-widest leading-none"
                        style={{ color: predStyle?.color, textShadow: `0 0 20px ${predStyle?.color}60` }}
                      >
                        {pred.displayName.toUpperCase()}
                      </p>
                      <p className="font-body text-[10px] tracking-[0.2em] text-pool-chalk-dim mt-1">PREDICTED WINNER</p>
                      <p className="font-body text-xs text-pool-chalk-dim/70 italic mt-2 leading-snug">&ldquo;{pred.reason}&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Standing + form ── */}
          {sortedStandings.length > 0 && (
            <div className="rounded-2xl border border-pool-border bg-pool-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-pool-border">
                <p className="font-heading text-[10px] tracking-[0.25em] text-pool-chalk-dim">GOING IN</p>
              </div>
              <div className="divide-y divide-pool-border/60">
                {sortedStandings.map((s, i) => {
                  const style  = PLAYER_STYLES[s.username as PlayerUsername]
                  const form   = previewStats?.form[s.username] ?? []
                  const streak = previewStats?.streaks[s.username] ?? 0
                  const badges = ['🥇', '🥈', '🥉']
                  return (
                    <div key={s.username} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-base w-6 text-center select-none shrink-0">{badges[i] ?? String(i + 1)}</span>
                      {style && (
                        <div style={{ filter: `drop-shadow(0 0 6px ${style.color}50)` }}>
                          <PlayerBall number={style.number} color={style.color} size={32} />
                        </div>
                      )}
                      <p className="font-heading text-base tracking-wide w-16 shrink-0" style={{ color: style?.color }}>
                        {s.display_name.toUpperCase()}
                      </p>
                      <div className="flex gap-1 flex-1 justify-center">
                        {form.map((win, j) => (
                          <span
                            key={j}
                            className="text-[11px] leading-none"
                            style={{ color: win ? (style?.color ?? '#22c55e') : '#2e3a2b' }}
                          >●</span>
                        ))}
                        {form.length === 0 && <span className="text-[10px] text-pool-chalk-dim/40">no games yet</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-heading text-2xl leading-none" style={{ color: style?.color }}>{s.wins}</span>
                        <span className="font-body text-[10px] text-pool-chalk-dim ml-1">W</span>
                        {streak >= 2 && <p className="font-body text-[10px] text-pool-gold leading-none mt-0.5">🔥 {streak}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* H2H */}
              {previewStats?.h2h.some(p => p.w1 + p.w2 > 0) && (
                <div className="px-4 py-3 border-t border-pool-border/60 space-y-2">
                  <p className="font-heading text-[9px] tracking-[0.2em] text-pool-chalk-dim/60 mb-2">HEAD TO HEAD</p>
                  {previewStats.h2h.map(pair => {
                    const total = pair.w1 + pair.w2
                    if (total === 0) return null
                    const s1 = PLAYER_STYLES[pair.u1 as PlayerUsername]
                    const s2 = PLAYER_STYLES[pair.u2 as PlayerUsername]
                    const pct1 = Math.round((pair.w1 / total) * 100)
                    return (
                      <div key={`${pair.u1}-${pair.u2}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-heading text-xs tracking-wide" style={{ color: s1?.color }}>{pair.n1}</span>
                          <span className="font-body text-xs text-pool-chalk tabular-nums">{pair.w1}–{pair.w2}</span>
                          <span className="font-heading text-xs tracking-wide" style={{ color: s2?.color }}>{pair.n2}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-pool-border flex">
                          <div className="h-full transition-all" style={{ width: `${pct1}%`, backgroundColor: s1?.color }} />
                          <div className="h-full flex-1" style={{ backgroundColor: s2?.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Last session */}
              {previewStats?.lastSession && previewStats.lastSession.wins.length > 0 && (
                <div className="px-4 py-2.5 border-t border-pool-border/60 flex items-center gap-3">
                  <span className="text-sm shrink-0">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[10px] text-pool-chalk-dim/60">
                      Last session · {format(new Date(previewStats.lastSession.date + 'T12:00:00'), 'MMM d')}
                    </p>
                    <p className="font-body text-xs text-pool-chalk mt-0.5">
                      {previewStats.lastSession.wins.map((w, i) => (
                        <span key={w.name}>
                          {i > 0 && <span className="text-pool-chalk-dim"> · </span>}
                          <span style={{ color: PLAYER_STYLES[standings.find(s => s.display_name === w.name)?.username as PlayerUsername]?.color }}>
                            {w.name}
                          </span>
                          {' '}<span className="text-pool-chalk-dim">{w.count}W</span>
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Game lineup ── */}
          <div className="rounded-2xl border border-pool-border bg-pool-surface overflow-hidden">
            <div className="px-4 py-2.5 border-b border-pool-border">
              <p className="font-heading text-[10px] tracking-[0.25em] text-pool-chalk-dim">TONIGHT&apos;S 6 GAMES</p>
            </div>
            <div className="divide-y divide-pool-border/60">
              {session.games.map(g => {
                const p1s = PLAYER_STYLES[g.player1.username as PlayerUsername]
                const p2s = PLAYER_STYLES[g.player2.username as PlayerUsername]
                const sched = GAME_SCHEDULE.find(s => s.gameNumber === g.game_number)
                return (
                  <div key={g.id} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="font-heading text-xs text-pool-chalk-dim/50 w-4 shrink-0">{g.game_number}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      {p1s && <PlayerBall number={p1s.number} color={p1s.color} size={18} />}
                      <span className="font-heading text-sm tracking-wide" style={{ color: p1s?.color }}>
                        {g.player1.display_name.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-body text-[10px] text-pool-chalk-dim/40">vs</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <span className="font-heading text-sm tracking-wide" style={{ color: p2s?.color }}>
                        {g.player2.display_name.toUpperCase()}
                      </span>
                      {p2s && <PlayerBall number={p2s.number} color={p2s.color} size={18} />}
                    </div>
                    {sched && (
                      <span className="font-body text-[9px] text-pool-chalk-dim/40 w-12 text-right shrink-0">
                        {PLAYER_STYLES[sched.scorer as PlayerUsername]?.label} 📝
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── LET'S PLAY CTA ── */}
          <button
            onClick={() => setShowPreview(false)}
            className="relative overflow-hidden rounded-3xl transition-all duration-150 active:scale-[0.97] mt-auto"
            style={{ boxShadow: '0 0 48px #c9a22728, 0 0 120px #c9a22710' }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, #1f5c38 0%, #0e2a1a 55%, #0d1f10 100%)' }} />
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #f0ede6 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, transparent 25%, #c9a2270a 50%, transparent 75%)' }} />
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 0 1.5px #c9a22745' }} />
            <div className="relative flex items-center justify-between px-7 py-6">
              <div>
                <p className="font-body text-[10px] tracking-[0.4em] uppercase mb-1.5 leading-none" style={{ color: '#c9a22780' }}>
                  6 games · let&apos;s go
                </p>
                <p
                  className="font-heading text-[2.4rem] leading-none tracking-wider"
                  style={{ color: '#e8c547', textShadow: '0 0 28px #c9a22780, 0 2px 0 #7a6000' }}
                >
                  LET&apos;S PLAY
                </p>
              </div>
              <div
                className="shrink-0 text-[3rem] leading-none ml-4"
                style={{ filter: 'drop-shadow(0 0 14px #c9a22790) drop-shadow(0 0 3px #000)' }}
              >
                🎱
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">← Home</Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-body text-pool-chalk-dim hover:text-pool-red transition-colors px-2 py-1"
          >
            🗑️ Delete
          </button>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim">Session</p>
            <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">
              {format(new Date(session.date + 'T12:00:00'), 'MMMM d').toUpperCase()}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-heading text-3xl text-pool-gold">
              {completedGames.length}<span className="text-pool-chalk-dim text-xl">/{totalGames}</span>
            </p>
            <p className="font-body text-xs text-pool-chalk-dim">games done</p>
          </div>
        </div>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      <div className="bg-pool-surface rounded-full h-1.5 mb-5 overflow-hidden">
        <div className="h-full bg-pool-gold rounded-full transition-all duration-500"
          style={{ width: `${(completedGames.length / totalGames) * 100}%` }} />
      </div>

      {completedGames.length > 0 && (
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mb-5">
          <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">SESSION SCORE</p>
          <div className="flex gap-3 justify-center">
            {uniquePlayers.map(player => {
              if (!player) return null
              const style = PLAYER_STYLES[player.username as PlayerUsername]
              return (
                <div key={player.id} className="flex-1 text-center">
                  <div className="flex justify-center mb-1">
                    {style && <PlayerBall number={style.number} color={style.color} size={36} />}
                  </div>
                  <p className="font-heading text-3xl text-pool-gold">{sessionWins[player.id] ?? 0}</p>
                  <p className="font-body text-xs text-pool-chalk-dim">{player.display_name}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {session.games.map(game => {
          const gameShots = game.shots ?? []
          const p1Stats = getPlayerStats(gameShots, game.player1_id)
          const p2Stats = getPlayerStats(gameShots, game.player2_id)
          const schedule = GAME_SCHEDULE.find(g => g.gameNumber === game.game_number)
          const p1Style = PLAYER_STYLES[game.player1.username as PlayerUsername]
          const p2Style = PLAYER_STYLES[game.player2.username as PlayerUsername]
          const isQuickOpen = quick?.gameId === game.id

          return (
            <div key={game.id}
              className={`bg-pool-surface rounded-2xl border overflow-hidden transition-all ${
                game.is_complete ? 'border-pool-border' : 'border-pool-gold/20'
              }`}
            >
              <div className="flex items-center px-4 py-3 gap-2">
                <span className="font-heading text-sm text-pool-chalk-dim w-5">{game.game_number}</span>
                <div className="flex items-center gap-2 flex-1">
                  {p1Style && <PlayerBall number={p1Style.number} color={p1Style.color} size={22} />}
                  <span className="font-heading text-sm tracking-wide" style={{ color: p1Style?.color }}>
                    {game.player1.display_name.toUpperCase()}
                  </span>
                </div>
                <span className="font-body text-xs text-pool-chalk-dim">vs</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-heading text-sm tracking-wide" style={{ color: p2Style?.color }}>
                    {game.player2.display_name.toUpperCase()}
                  </span>
                  {p2Style && <PlayerBall number={p2Style.number} color={p2Style.color} size={22} />}
                </div>
                {game.is_complete ? (
                  <span className="ml-1 text-xs font-body text-pool-green-bright">✓</span>
                ) : gameShots.length > 0 ? (
                  <span className="ml-1 text-xs font-body text-pool-gold">●</span>
                ) : (
                  <span className="ml-1 text-xs font-body text-pool-chalk-dim">–</span>
                )}
              </div>

              {game.is_complete && game.winner && (
                <div className="flex items-center justify-between px-4 py-2 bg-pool-gold/5 border-t border-pool-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏆</span>
                    <span className="font-heading text-base tracking-wide text-pool-gold">
                      {game.winner.display_name.toUpperCase()} WINS
                    </span>
                    {game.loser_potted_black && (
                      <span className="text-xs font-body text-pool-chalk-dim">(black ball)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleClearResult(game.id)}
                    className="text-xs font-body text-pool-chalk-dim hover:text-pool-red transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}

              {gameShots.length > 0 && (
                <div className="grid grid-cols-2 divide-x divide-pool-border border-t border-pool-border">
                  {[{ player: game.player1, stats: p1Stats }, { player: game.player2, stats: p2Stats }].map(({ player, stats }) => (
                    <div key={player.id} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-pool-chalk-dim">{player.display_name}</span>
                        <span className="font-heading text-lg text-pool-chalk">{stats.potted}</span>
                      </div>
                      <div className="flex gap-2 text-xs font-body text-pool-chalk-dim">
                        <span>{stats.shots} shots</span>
                        {stats.errors > 0 && <span className="text-pool-red">{stats.errors} err</span>}
                        {stats.lucky > 0  && <span className="text-pool-gold">{stats.lucky}★</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isQuickOpen && (
                <div className="border-t border-pool-gold/30 bg-pool-bg px-4 py-4 animate-fade-in">
                  <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">WHO WON?</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[game.player1, game.player2].map(player => {
                      const style = PLAYER_STYLES[player.username as PlayerUsername]
                      const selected = quick?.winnerId === player.id
                      return (
                        <button
                          key={player.id}
                          onClick={() => setQuick(q => q ? { ...q, winnerId: player.id } : q)}
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 font-heading text-base tracking-wide transition-all active:scale-95 ${
                            selected
                              ? 'border-pool-gold bg-pool-gold/15 text-pool-gold'
                              : 'border-pool-border text-pool-chalk-dim hover:border-pool-chalk/30'
                          }`}
                        >
                          {style && <PlayerBall number={style.number} color={style.color} size={28} />}
                          {player.display_name.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setQuick(q => q ? { ...q, blackBall: !q.blackBall } : q)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 text-sm font-body transition-all ${
                      quick?.blackBall
                        ? 'border-pool-red/50 bg-pool-red/10 text-pool-chalk'
                        : 'border-pool-border text-pool-chalk-dim'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${quick?.blackBall ? 'bg-pool-red border-pool-red' : 'border-pool-chalk-dim'}`}>
                      {quick?.blackBall && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    <span>Loser potted the black ball</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuick(null)}
                      className="flex-1 py-2.5 rounded-xl border border-pool-border font-heading text-sm tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={submitQuickResult}
                      disabled={quickSaving}
                      className="flex-1 py-2.5 rounded-xl bg-pool-gold text-pool-bg font-heading text-sm tracking-widest hover:bg-pool-gold-light disabled:opacity-50 transition-all active:scale-95"
                    >
                      {quickSaving ? 'SAVING…' : 'CONFIRM'}
                    </button>
                  </div>
                </div>
              )}

              {!game.is_complete && !isQuickOpen && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-pool-border gap-2">
                  {schedule && (
                    <p className="text-xs font-body text-pool-chalk-dim">
                      {PLAYER_STYLES[schedule.scorer as PlayerUsername]?.label} scores
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => setQuick({ gameId: game.id, winnerId: game.player1_id, blackBall: false })}
                      className="px-3 py-1.5 rounded-lg border border-pool-border font-heading text-xs tracking-wider text-pool-chalk-dim hover:text-pool-chalk hover:border-pool-chalk/30 transition-all active:scale-95"
                    >
                      ⚡ SET RESULT
                    </button>
                    <Link
                      href={`/session/${session.id}/game/${game.id}`}
                      className="px-3 py-1.5 rounded-lg bg-pool-gold text-pool-bg font-heading text-xs tracking-wider hover:bg-pool-gold-light transition-all active:scale-95"
                    >
                      {game.shots.length > 0 ? 'CONTINUE' : 'START'}
                    </Link>
                  </div>
                </div>
              )}

              {game.is_complete && (
                <div className="flex justify-end px-4 py-2 border-t border-pool-border">
                  <Link
                    href={`/session/${session.id}/game/${game.id}`}
                    className="text-xs font-body text-pool-chalk-dim hover:text-pool-gold transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {completedGames.length === totalGames && totalGames > 0 && (() => {
        const allShots = completedGames.flatMap(g => g.shots ?? [])
        const sessionStats = uniquePlayers.map(player => {
          if (!player) return null
          const st = getPlayerStats(allShots, player.id)
          const acc = st.shots > 0 ? Math.round((st.potted / st.shots) * 100) : 0
          return { player, wins: sessionWins[player.id] ?? 0, acc, potted: st.potted, shots: st.shots }
        }).filter(Boolean) as { player: Player; wins: number; acc: number; potted: number; shots: number }[]

        const sorted = [...sessionStats].sort((a, b) => b.wins - a.wins || b.acc - a.acc)
        const mvp = sorted[0]
        const spoon = sorted[sorted.length - 1]
        const mvpStyle = PLAYER_STYLES[mvp.player.username as PlayerUsername]
        const spoonStyle = PLAYER_STYLES[spoon.player.username as PlayerUsername]

        return (
          <div className="mt-5 space-y-3">
            <p className="text-center text-pool-gold font-heading text-xl tracking-wider">ALL GAMES COMPLETE 🎱</p>
            <div
              className="rounded-2xl border-2 p-4 flex items-center gap-4"
              style={{ borderColor: mvpStyle?.color, background: `${mvpStyle?.color}11` }}
            >
              <div className="text-4xl">🏆</div>
              <div className="flex-1">
                <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-0.5">Session MVP</p>
                <p className="font-heading text-2xl tracking-wide" style={{ color: mvpStyle?.color }}>
                  {mvp.player.display_name.toUpperCase()}
                </p>
                <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
                  {mvp.wins} wins · {mvp.potted} pots · {mvp.acc}% acc
                </p>
              </div>
              {mvpStyle && <PlayerBall number={mvpStyle.number} color={mvpStyle.color} size={44} />}
            </div>
            {spoon.player.id !== mvp.player.id && (
              <div className="rounded-2xl border border-pool-border p-4 flex items-center gap-4 opacity-75">
                <div className="text-4xl">🥄</div>
                <div className="flex-1">
                  <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-0.5">Wooden Spoon</p>
                  <p className="font-heading text-xl tracking-wide text-pool-chalk-dim">
                    {spoon.player.display_name.toUpperCase()}
                  </p>
                  <p className="font-body text-xs text-pool-chalk-dim mt-0.5">
                    {spoon.wins} wins · {spoon.potted} pots · {spoon.acc}% acc
                  </p>
                </div>
                {spoonStyle && <PlayerBall number={spoonStyle.number} color={spoonStyle.color} size={36} />}
              </div>
            )}
          </div>
        )
      })()}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-lg bg-pool-surface rounded-t-3xl border-t border-pool-border p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🗑️</div>
              <h2 className="font-heading text-2xl tracking-wider text-pool-chalk mb-1">DELETE SESSION</h2>
              <p className="font-body text-sm text-pool-chalk-dim">
                {format(new Date(session.date + 'T12:00:00'), 'MMMM d, yyyy')} · {totalGames} games · {session.games.flatMap(g => g.shots ?? []).length} shots
              </p>
              <p className="font-body text-xs text-pool-red mt-2">This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-4 rounded-xl border border-pool-border font-heading text-lg tracking-widest text-pool-chalk-dim hover:text-pool-chalk transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleting}
                className="flex-1 py-4 rounded-xl bg-pool-red border border-pool-red font-heading text-lg tracking-widest text-white hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'DELETING…' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
