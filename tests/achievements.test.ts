import { describe, it, expect } from 'vitest'
import { computePlayerAchievements, ACHIEVEMENTS } from '@/lib/achievements'

// Minimal builders matching what fetchCompletedGames / fetchAllShots return.
const ADIB = 'adib-id'
const AHMED = 'ahmed-id'

function game(over: Partial<Parameters<typeof computePlayerAchievements>[1][number]> = {}) {
  return {
    id: `game-${Math.random().toString(36).slice(2)}`,
    game_number: 1,
    session_id: 'sess-1',
    player1_id: ADIB,
    player2_id: AHMED,
    winner_id: null as string | null,
    loser_potted_black: false,
    player1: { id: ADIB, username: 'adib' },
    player2: { id: AHMED, username: 'ahmed' },
    session: { id: 'sess-1', date: '2026-01-01' },
    ...over,
  }
}

describe('computePlayerAchievements', () => {
  it('returns no achievements for a player with no games', () => {
    expect(computePlayerAchievements('godine', [], [])).toEqual([])
  })

  it('awards first_win when the player has won a game', () => {
    const games = [game({ id: 'g1', winner_id: ADIB })]
    const earned = computePlayerAchievements('adib', games, [])
    expect(earned).toContain('first_win')
  })

  it('does not award first_win to a player who never won', () => {
    const games = [game({ id: 'g1', winner_id: ADIB })]
    const earned = computePlayerAchievements('ahmed', games, [])
    expect(earned).not.toContain('first_win')
  })

  it('awards veteran after 30 games played', () => {
    const games = Array.from({ length: 30 }, (_, i) =>
      game({ id: `g${i}`, game_number: i + 1, winner_id: i % 2 ? ADIB : AHMED }),
    )
    const earned = computePlayerAchievements('adib', games, [])
    expect(earned).toContain('veteran')
  })

  it('only ever returns known achievement ids', () => {
    const ids = new Set(ACHIEVEMENTS.map(a => a.id))
    const games = [game({ id: 'g1', winner_id: ADIB })]
    for (const id of computePlayerAchievements('adib', games, [])) {
      expect(ids.has(id)).toBe(true)
    }
  })
})
