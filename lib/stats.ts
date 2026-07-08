import type { Shot } from '@/types/database'

export interface PlayerStats {
  shots: number
  potted: number     // total balls credited (own shots + opponent's foul-credited balls)
  ownPotted: number  // balls potted from own shots only (for accuracy calculations)
  lucky: number
  errors: number
}

export function getPlayerStats(shots: Shot[], playerId: string): PlayerStats {
  const mine = shots.filter(s => s.player_id === playerId)
  const theirs = shots.filter(s => s.player_id !== playerId)
  const ownPotted = mine.reduce((sum, s) => sum + (s.balls_potted ?? (s.potted ? 1 : 0)), 0)
  const credited = theirs.reduce((sum, s) => sum + (s.opponent_balls_potted ?? 0), 0)
  return {
    shots: mine.length,
    potted: ownPotted + credited,
    ownPotted,
    lucky: mine.filter(s => s.is_lucky).length,
    errors: mine.filter(s => s.is_error).length,
  }
}

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100)
}

// Works on any array of games that has a winner_id field
export function longestStreak(games: { winner_id: string | null }[], playerId: string): number {
  let best = 0, cur = 0
  for (const g of games) {
    if (g.winner_id === playerId) { cur++; best = Math.max(best, cur) }
    else cur = 0
  }
  return best
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Returns a map of game_id → earliest shot created_at.
 *  Used to sort games by actual play order within a session, since all 6 games
 *  are inserted at the same moment when the session is created. */
export function buildFirstShotMap(shots: { game_id: string; created_at: string }[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const s of shots) {
    if (!map[s.game_id] || s.created_at < map[s.game_id]) {
      map[s.game_id] = s.created_at
    }
  }
  return map
}

/** Sorts games chronologically: by session date first, then by when the first
 *  shot was recorded (actual play order). Falls back to game_number only when
 *  a game has no shots (shouldn't happen in practice). */
export function sortGamesByPlayOrder<T extends {
  id: string
  game_number: number
  session?: { date: string } | null
}>(games: T[], firstShotAt: Record<string, string>): T[] {
  return [...games].sort((a, b) => {
    const da = a.session?.date ?? ''
    const db = b.session?.date ?? ''
    if (da !== db) return da.localeCompare(db)
    const ta = firstShotAt[a.id]
    const tb = firstShotAt[b.id]
    if (ta && tb) return ta.localeCompare(tb)
    return a.game_number - b.game_number
  })
}

