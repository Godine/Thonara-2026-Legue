// Season game-count cap. Once this many games have been played across the
// season, the leader is crowned league champion.
export const SEASON_GAME_LIMIT = 100

export interface SeasonProgress {
  played: number
  limit: number
  remaining: number
  pct: number
  isComplete: boolean
}

export function computeSeasonProgress(played: number): SeasonProgress {
  const limit = SEASON_GAME_LIMIT
  return {
    played,
    limit,
    remaining: Math.max(0, limit - played),
    pct: Math.min(100, (played / limit) * 100),
    isComplete: played >= limit,
  }
}
