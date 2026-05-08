import type { SupabaseClient } from '@supabase/supabase-js'
import type { Shot } from '@/types/database'

export type ShotInsert = Omit<Shot, 'id' | 'created_at'>

export async function fetchShotsForGame(db: SupabaseClient, gameId: string): Promise<Shot[]> {
  const { data } = await db
    .from('shots')
    .select('*')
    .eq('game_id', gameId)
    .order('shot_number', { ascending: true })
  return (data as Shot[]) ?? []
}

export async function fetchAllShots(db: SupabaseClient): Promise<Shot[]> {
  const { data } = await db
    .from('shots')
    .select('id, game_id, player_id, potted, balls_potted, opponent_balls_potted, is_lucky, is_error, shot_number, created_at')
  return (data as Shot[]) ?? []
}

export async function fetchHistoricalShots(
  db: SupabaseClient,
  playerIds: string[],
  excludeGameId: string,
): Promise<{ player_id: string; potted: boolean; balls_potted: number }[]> {
  const { data } = await db
    .from('shots')
    .select('player_id, potted, balls_potted')
    .in('player_id', playerIds)
    .neq('game_id', excludeGameId)
  return (data as { player_id: string; potted: boolean; balls_potted: number }[]) ?? []
}

export async function insertShot(db: SupabaseClient, shot: ShotInsert) {
  await db.from('shots').insert(shot)
}

export async function insertShots(db: SupabaseClient, shots: ShotInsert[]) {
  await db.from('shots').insert(shots)
}

export async function deleteShot(db: SupabaseClient, shotId: string) {
  await db.from('shots').delete().eq('id', shotId)
}

export async function deleteShotsForGame(db: SupabaseClient, gameId: string) {
  await db.from('shots').delete().eq('game_id', gameId)
}

export async function deleteShotsForGames(db: SupabaseClient, gameIds: string[]) {
  await db.from('shots').delete().in('game_id', gameIds)
}
