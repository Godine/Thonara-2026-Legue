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
