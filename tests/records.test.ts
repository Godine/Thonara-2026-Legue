import { describe, it, expect } from 'vitest'
import { computeRecords } from '@/lib/records'

const ADIB = 'adib-id'
const AHMED = 'ahmed-id'

function game(over: Partial<Parameters<typeof computeRecords>[0][number]> = {}) {
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

describe('computeRecords', () => {
  it('returns no sections when there are no games', () => {
    expect(computeRecords([], [])).toEqual([])
  })

  it('produces sections with a most-wins record for the leader', () => {
    const games = [
      game({ id: 'g1', winner_id: ADIB }),
      game({ id: 'g2', winner_id: ADIB }),
      game({ id: 'g3', winner_id: AHMED }),
    ]
    const sections = computeRecords(games, [])
    expect(sections.length).toBeGreaterThan(0)

    const all = sections.flatMap(s => s.records)
    const mostWins = all.find(r => /win/i.test(r.title))
    expect(mostWins).toBeTruthy()
    expect(mostWins!.hasData).toBe(true)
    // Adib leads outright, so should be the sole holder
    expect(mostWins!.holders.map(h => h.username)).toContain('adib')
  })

  it('every record entry carries a stable id and title', () => {
    const sections = computeRecords([game({ id: 'g1', winner_id: ADIB })], [])
    for (const r of sections.flatMap(s => s.records)) {
      expect(typeof r.id).toBe('string')
      expect(r.id.length).toBeGreaterThan(0)
      expect(typeof r.title).toBe('string')
    }
  })
})
