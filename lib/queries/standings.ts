import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeagueStanding } from '@/types/database'

export async function fetchStandings(db: SupabaseClient): Promise<LeagueStanding[]> {
  const { data } = await db.from('league_standings').select('*')
  return (data as LeagueStanding[]) ?? []
}

export interface StandingBasic {
  username: string
  display_name: string
  wins: number
  losses: number
  games_played: number
}

export async function fetchStandingsBasic(db: SupabaseClient): Promise<StandingBasic[]> {
  const { data } = await db
    .from('league_standings')
    .select('username, display_name, wins, losses, games_played')
  return (data as StandingBasic[]) ?? []
}
