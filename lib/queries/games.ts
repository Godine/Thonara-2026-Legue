import type { SupabaseClient } from '@supabase/supabase-js'
import type { Game, Player } from '@/types/database'

export interface GameWithPlayers extends Game {
  player1: Player
  player2: Player
  winner: Player | null
}

const GAME_WITH_PLAYERS = `
  *,
  player1:players!games_player1_id_fkey (*),
  player2:players!games_player2_id_fkey (*),
  winner:players!games_winner_id_fkey  (*)
`

export async function fetchGame(db: SupabaseClient, gameId: string): Promise<GameWithPlayers | null> {
  const { data } = await db
    .from('games')
    .select(GAME_WITH_PLAYERS)
    .eq('id', gameId)
    .single()
  return (data as GameWithPlayers) ?? null
}

// Used by stats page and session preview — returns completed games with player + session joins.
export async function fetchCompletedGames(db: SupabaseClient) {
  const { data } = await db
    .from('games')
    .select(`
      id, game_number, session_id, player1_id, player2_id, winner_id, loser_potted_black,
      player1:players!games_player1_id_fkey (id, username, display_name),
      player2:players!games_player2_id_fkey (id, username, display_name),
      winner:players!games_winner_id_fkey  (id, username, display_name),
      session:sessions (id, date)
    `)
    .eq('is_complete', true)
    .order('created_at', { ascending: true })
  return (data ?? []) as any[]
}

export async function fetchH2H(
  db: SupabaseClient,
  p1id: string,
  p2id: string,
  excludeGameId: string,
): Promise<{ p1Wins: number; p2Wins: number }> {
  const { data } = await db
    .from('games')
    .select('winner_id, player1_id, player2_id')
    .in('player1_id', [p1id, p2id])
    .in('player2_id', [p1id, p2id])
    .eq('is_complete', true)
    .neq('id', excludeGameId)
  if (!data) return { p1Wins: 0, p2Wins: 0 }
  let p1Wins = 0, p2Wins = 0
  for (const g of data as { winner_id: string; player1_id: string; player2_id: string }[]) {
    const isMatchup =
      (g.player1_id === p1id && g.player2_id === p2id) ||
      (g.player1_id === p2id && g.player2_id === p1id)
    if (!isMatchup) continue
    if (g.winner_id === p1id) p1Wins++
    else if (g.winner_id === p2id) p2Wins++
  }
  return { p1Wins, p2Wins }
}

export async function setGameResult(
  db: SupabaseClient,
  gameId: string,
  winnerId: string,
  blackBall: boolean,
) {
  await db.from('games').update({
    winner_id: winnerId,
    loser_potted_black: blackBall,
    is_complete: true,
  }).eq('id', gameId)
}

export async function clearGameResult(db: SupabaseClient, gameId: string) {
  await db.from('games').update({
    winner_id: null,
    is_complete: false,
    loser_potted_black: false,
  }).eq('id', gameId)
}

export async function resetGame(db: SupabaseClient, gameId: string) {
  await db.from('shots').delete().eq('game_id', gameId)
  await clearGameResult(db, gameId)
}
