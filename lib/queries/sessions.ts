import type { SupabaseClient } from '@supabase/supabase-js'
import type { Session, Game, Player, Shot } from '@/types/database'
import { GAME_SCHEDULE } from '@/lib/game-config'

export interface GameFull extends Game {
  player1: Player
  player2: Player
  winner: Player | null
  shots: Shot[]
}

export interface SessionFull extends Session {
  games: GameFull[]
}

const SESSION_WITH_GAMES = `
  *,
  games (
    *,
    player1:players!games_player1_id_fkey (*),
    player2:players!games_player2_id_fkey (*),
    winner:players!games_winner_id_fkey  (*),
    shots (*)
  )
`

export async function fetchSession(db: SupabaseClient, id: string): Promise<SessionFull | null> {
  const { data } = await db
    .from('sessions')
    .select(SESSION_WITH_GAMES)
    .eq('id', id)
    .single()
  if (!data) return null
  data.games = (data.games ?? []).sort((a: Game, b: Game) => a.game_number - b.game_number)
  return data as SessionFull
}

export interface LiveGame {
  sessionId: string
  sessionDate: string
  gameId: string
  gameNumber: number
  player1: { id: string; username: string; display_name: string }
  player2: { id: string; username: string; display_name: string }
  shotCount: number
}

export async function fetchLiveGame(db: SupabaseClient): Promise<LiveGame | null> {
  const { data } = await db
    .from('sessions')
    .select(`
      id, date,
      games (
        id, game_number, is_complete,
        player1:players!games_player1_id_fkey ( id, username, display_name ),
        player2:players!games_player2_id_fkey ( id, username, display_name ),
        shots ( id )
      )
    `)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const games = ((data.games as any[]) ?? []).sort((a: any, b: any) => a.game_number - b.game_number)
  const incomplete = games.filter((g: any) => !g.is_complete)
  if (incomplete.length === 0) return null

  // Prefer a game that has already started; fall back to the next pending game
  const active = incomplete.find((g: any) => (g.shots?.length ?? 0) > 0) ?? incomplete[0]

  return {
    sessionId: data.id,
    sessionDate: data.date,
    gameId: active.id,
    gameNumber: active.game_number,
    player1: active.player1,
    player2: active.player2,
    shotCount: active.shots?.length ?? 0,
  }
}

export async function fetchRecentSession(db: SupabaseClient) {
  const { data } = await db
    .from('sessions')
    .select(`
      *,
      games (
        id, game_number, is_complete, winner_id,
        player1:players!games_player1_id_fkey ( id, display_name, username ),
        player2:players!games_player2_id_fkey ( id, display_name, username ),
        winner:players!games_winner_id_fkey   ( id, display_name, username )
      )
    `)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function fetchAllSessions(db: SupabaseClient, limit = 20): Promise<SessionFull[]> {
  const { data } = await db
    .from('sessions')
    .select(SESSION_WITH_GAMES)
    .order('date', { ascending: false })
    .limit(limit)
  return (data as SessionFull[]) ?? []
}

export async function findSessionByDate(db: SupabaseClient, date: string) {
  const { data } = await db
    .from('sessions')
    .select('id')
    .eq('date', date)
    .maybeSingle()
  return data as { id: string } | null
}

type CreateSessionResult = { ok: true; id: string } | { ok: false; error: string }

export async function createSession(
  db: SupabaseClient,
  date: string,
): Promise<CreateSessionResult> {
  const { data: players, error: playerErr } = await db
    .from('players')
    .select('id, username')
  if (playerErr)
    return { ok: false, error: `Database error: "${playerErr.message}" — check your Supabase URL and anon key in Vercel environment variables.` }
  if (!players?.length)
    return { ok: false, error: 'Players table is empty — run the setup SQL in Supabase SQL Editor.' }

  const byUsername = Object.fromEntries(players.map((p: any) => [p.username, p.id]))
  const missing = GAME_SCHEDULE.flatMap(g => [g.player1, g.player2, g.scorer])
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .filter(u => !byUsername[u])
  if (missing.length > 0)
    return { ok: false, error: `Missing players in database: ${missing.join(', ')}. Run the setup SQL again.` }

  const { data: session, error: sessionErr } = await db
    .from('sessions')
    .insert({ date })
    .select('id')
    .single()
  if (sessionErr || !session)
    return { ok: false, error: 'Failed to create session.' }

  const { error: gamesErr } = await db.from('games').insert(
    GAME_SCHEDULE.map(g => ({
      session_id: session.id,
      game_number: g.gameNumber,
      player1_id: byUsername[g.player1],
      player2_id: byUsername[g.player2],
    }))
  )
  if (gamesErr)
    return { ok: false, error: 'Failed to create games.' }

  return { ok: true, id: session.id }
}

export async function deleteSession(
  db: SupabaseClient,
  sessionId: string,
  gameIds: string[],
) {
  if (gameIds.length > 0) {
    await db.from('shots').delete().in('game_id', gameIds)
    await db.from('games').delete().eq('session_id', sessionId)
  }
  await db.from('sessions').delete().eq('id', sessionId)
}
