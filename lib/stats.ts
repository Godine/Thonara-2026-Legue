import type { Shot } from '@/types/database'

export interface PlayerStats {
  shots: number
  potted: number
  lucky: number
  errors: number
}

export function getPlayerStats(shots: Shot[], playerId: string): PlayerStats {
  const mine = shots.filter(s => s.player_id === playerId)
  return {
    shots: mine.length,
    potted: mine.filter(s => s.potted).length,
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
