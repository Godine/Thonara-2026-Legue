import { useCallback, useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchGame, fetchShotsForGame, fetchHistoricalShots, fetchH2H,
  type GameWithPlayers,
} from '@/lib/queries'
import type { Shot } from '@/types/database'

type HistStats = Record<string, { shots: number; potted: number }>

/**
 * Loads a game and its shots, keeps them live via Supabase Realtime, and
 * fetches the historical/head-to-head data the odds model needs. Also raises
 * a one-shot celebration flag the first time the game transitions to complete.
 *
 * The returned setters (`setGame`, `setShots`) let the page apply optimistic
 * updates; the realtime subscription reconciles against the database.
 */
export function useGameData(db: SupabaseClient, gameId: string) {
  const [game, setGame] = useState<GameWithPlayers | null>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [histStats, setHistStats] = useState<HistStats>({})
  const [h2hStats, setH2hStats] = useState<{ p1Wins: number; p2Wins: number }>({ p1Wins: 0, p2Wins: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const prevCompleteRef = useRef<boolean | undefined>(undefined)

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
      const acc: HistStats = {}
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

  return {
    game, setGame,
    shots, setShots,
    loading,
    histStats,
    h2hStats,
    showCelebration, setShowCelebration,
    loadGame,
  }
}
