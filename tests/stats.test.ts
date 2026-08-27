import { describe, it, expect } from 'vitest'
import { getPlayerStats, pct, longestStreak, formatTime, buildFirstShotMap, sortGamesByPlayOrder } from '@/lib/stats'
import { pot, miss, err, shot } from './helpers'

const P1 = 'p1'
const P2 = 'p2'

describe('getPlayerStats', () => {
  it('counts a player\'s own shots and pots', () => {
    const shots = [pot(P1, { balls_potted: 2 }), miss(P1), pot(P2)]
    const s = getPlayerStats(shots, P1)
    expect(s.shots).toBe(2)
    expect(s.ownPotted).toBe(2)
    expect(s.potted).toBe(2)
  })

  it('credits opponent foul-potted balls to this player', () => {
    // p2 fouls and pots 1 opponent ball -> credited to p1
    const shots = [err(P2, { opponent_balls_potted: 1 })]
    const s = getPlayerStats(shots, P1)
    expect(s.shots).toBe(0)
    expect(s.ownPotted).toBe(0)
    expect(s.potted).toBe(1) // credited ball counts toward total, not accuracy
  })

  it('tallies lucky and error shots', () => {
    const shots = [pot(P1, { is_lucky: true }), err(P1)]
    const s = getPlayerStats(shots, P1)
    expect(s.lucky).toBe(1)
    expect(s.errors).toBe(1)
  })
})

describe('pct', () => {
  it('rounds a ratio to a whole percentage', () => {
    expect(pct(1, 3)).toBe(33)
    expect(pct(2, 4)).toBe(50)
  })
  it('is 0 when the denominator is 0', () => {
    expect(pct(5, 0)).toBe(0)
  })
})

describe('longestStreak', () => {
  it('finds the longest consecutive win run', () => {
    const games = [
      { winner_id: P1 }, { winner_id: P1 }, { winner_id: P2 },
      { winner_id: P1 }, { winner_id: P1 }, { winner_id: P1 },
    ]
    expect(longestStreak(games, P1)).toBe(3)
    expect(longestStreak(games, P2)).toBe(1)
  })
  it('is 0 for a player who never won', () => {
    expect(longestStreak([{ winner_id: P1 }], P2)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })
})

describe('buildFirstShotMap', () => {
  it('keeps the earliest created_at per game', () => {
    const map = buildFirstShotMap([
      { game_id: 'a', created_at: '2026-01-01T00:00:10Z' },
      { game_id: 'a', created_at: '2026-01-01T00:00:05Z' },
      { game_id: 'b', created_at: '2026-01-01T00:00:20Z' },
    ])
    expect(map.a).toBe('2026-01-01T00:00:05Z')
    expect(map.b).toBe('2026-01-01T00:00:20Z')
  })
})

describe('sortGamesByPlayOrder', () => {
  it('orders by session date, then first-shot time', () => {
    const games = [
      { id: 'g2', game_number: 2, session: { date: '2026-01-02' } },
      { id: 'g1', game_number: 1, session: { date: '2026-01-01' } },
      { id: 'g3', game_number: 3, session: { date: '2026-01-02' } },
    ]
    const firstShotAt = { g2: '2026-01-02T10:00:00Z', g3: '2026-01-02T09:00:00Z' }
    const ordered = sortGamesByPlayOrder(games, firstShotAt).map(g => g.id)
    expect(ordered).toEqual(['g1', 'g3', 'g2'])
  })

  it('falls back to game_number when a game has no shots', () => {
    const games = [
      { id: 'b', game_number: 2, session: { date: '2026-01-01' } },
      { id: 'a', game_number: 1, session: { date: '2026-01-01' } },
    ]
    expect(sortGamesByPlayOrder(games, {}).map(g => g.id)).toEqual(['a', 'b'])
  })
})

// keep `shot` import used even if all cases above rely on helpers
void shot
