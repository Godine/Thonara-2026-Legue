import type { Player } from '@/types/database'
import type { SessionFull } from '@/lib/queries/sessions'

// Per-session stakes, in Moroccan Dirhams — indexed by session rank (0 = 1st place).
// 1st pays nothing, 2nd covers the table fee, 3rd (last place) covers the winner's meal.
export const STAKES_DH = [0, 30, 60]

export interface SessionStake {
  player: Player
  wins: number
  potted: number
  rank: number
  amount: number
}

// Ranks the players in a fully-completed session by wins, tie-broken by total
// balls potted across the session, and assigns the DH stake for each rank.
// Returns null for sessions that aren't fully complete yet.
export function computeSessionStakes(session: SessionFull): SessionStake[] | null {
  const games = session.games
  if (games.length === 0) return null
  const completed = games.filter(g => g.is_complete)
  if (completed.length !== games.length) return null

  const wins: Record<string, number> = {}
  const potted: Record<string, number> = {}
  const playersById: Record<string, Player> = {}

  for (const g of completed) {
    if (g.player1) playersById[g.player1.id] = g.player1
    if (g.player2) playersById[g.player2.id] = g.player2
    if (g.winner_id) wins[g.winner_id] = (wins[g.winner_id] ?? 0) + 1
    for (const s of g.shots) {
      potted[s.player_id] = (potted[s.player_id] ?? 0) + (s.balls_potted ?? (s.potted ? 1 : 0))
    }
  }

  const ranked = Object.values(playersById)
    .map(player => ({
      player,
      wins: wins[player.id] ?? 0,
      potted: potted[player.id] ?? 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.potted - a.potted)

  return ranked.map((r, i) => ({ ...r, rank: i, amount: STAKES_DH[i] ?? 0 }))
}

export interface CueRaceEntry {
  player: Player
  wins: number
}

// Total game wins per player within a calendar year — the standings that
// decide who takes home the professional pool cue at year's end.
export function computeCueRace(
  sessions: SessionFull[],
  year: number,
  allPlayers: Record<string, Player>,
): CueRaceEntry[] {
  const wins: Record<string, number> = {}

  for (const s of sessions) {
    if (new Date(s.date + 'T12:00:00').getFullYear() !== year) continue
    for (const g of s.games) {
      if (g.is_complete && g.winner_id) wins[g.winner_id] = (wins[g.winner_id] ?? 0) + 1
    }
  }

  return Object.values(allPlayers)
    .map(player => ({ player, wins: wins[player.id] ?? 0 }))
    .sort((a, b) => b.wins - a.wins)
}
