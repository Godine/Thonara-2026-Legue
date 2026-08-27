import { describe, it, expect } from 'vitest'
import {
  ballsPotted,
  isPlayer1Turn,
  computeBreakInfo,
  currentStreak,
  loserBallsRemaining,
} from '@/lib/game-logic'
import { pot, miss, err, shot } from './helpers'

const P1 = 'p1'
const P2 = 'p2'

describe('ballsPotted', () => {
  it('uses balls_potted when present', () => {
    expect(ballsPotted({ balls_potted: 3, potted: true })).toBe(3)
    expect(ballsPotted({ balls_potted: 0, potted: true })).toBe(0)
  })
  it('falls back to the potted boolean for legacy rows', () => {
    expect(ballsPotted({ balls_potted: undefined as unknown as number, potted: true })).toBe(1)
    expect(ballsPotted({ balls_potted: undefined as unknown as number, potted: false })).toBe(0)
  })
})

describe('isPlayer1Turn', () => {
  it('is player 1 before any shot', () => {
    expect(isPlayer1Turn([], P1, P2)).toBe(true)
  })

  it('keeps the shooter on the table after a pot', () => {
    // p1 shot first and potted -> still p1
    expect(isPlayer1Turn([pot(P1)], P1, P2)).toBe(true)
  })

  it('switches turn after a miss', () => {
    expect(isPlayer1Turn([miss(P1)], P1, P2)).toBe(false)
  })

  it('follows a full sequence of pots and misses', () => {
    // p1 pots, p1 pots, p1 misses -> p2; p2 misses -> p1
    const shots = [pot(P1), pot(P1), miss(P1), miss(P2)]
    expect(isPlayer1Turn(shots, P1, P2)).toBe(true)
  })

  it('grants the incoming player a free turn after a foul', () => {
    // p1 fouls -> turn goes to p2 with a free extra turn.
    // p2 then misses -> the free turn is consumed, but the turn does NOT flip back.
    const shots = [err(P1), miss(P2)]
    expect(isPlayer1Turn(shots, P1, P2)).toBe(false)
  })

  it('flips back on the second miss after a foul', () => {
    // p1 fouls -> p2 (free turn). p2 misses (consumes free). p2 misses again -> p1.
    const shots = [err(P1), miss(P2), miss(P2)]
    expect(isPlayer1Turn(shots, P1, P2)).toBe(true)
  })

  it('sorts by shot_number, not array order', () => {
    const a = miss(P1, { shot_number: 2 })
    const b = pot(P1, { shot_number: 1 })
    // chronological: pot then miss -> switches to p2
    expect(isPlayer1Turn([a, b], P1, P2)).toBe(false)
  })
})

describe('computeBreakInfo', () => {
  it('returns null with no shots', () => {
    expect(computeBreakInfo([])).toBeNull()
  })

  it('counts consecutive breaker pots and stops at the first non-pot', () => {
    const shots = [
      pot(P1, { shot_number: 1, ball_color: 'yellow', balls_potted: 2 }),
      pot(P1, { shot_number: 2, ball_color: 'yellow', balls_potted: 1 }),
      miss(P1, { shot_number: 3 }),
    ]
    const info = computeBreakInfo(shots)!
    expect(info.breakerId).toBe(P1)
    expect(info.yellows).toBe(3)
    expect(info.reds).toBe(0)
    expect(info.pots).toBe(3)
  })

  it('credits opponent balls to the opposite colour', () => {
    const shots = [
      pot(P1, { shot_number: 1, ball_color: 'yellow', balls_potted: 1, opponent_balls_potted: 1 }),
    ]
    const info = computeBreakInfo(shots)!
    expect(info.yellows).toBe(1)
    expect(info.reds).toBe(1)
    expect(info.pots).toBe(2)
  })

  it('flags a potted black on the break', () => {
    const shots = [pot(P1, { shot_number: 1, ball_color: 'black' })]
    const info = computeBreakInfo(shots)!
    expect(info.black).toBe(true)
  })

  it('stops as soon as the other player appears', () => {
    const shots = [pot(P1, { shot_number: 1, ball_color: 'red' }), pot(P2, { shot_number: 2, ball_color: 'yellow' })]
    const info = computeBreakInfo(shots)!
    expect(info.reds).toBe(1)
    expect(info.yellows).toBe(0)
  })
})

describe('currentStreak', () => {
  it('is zero when the last shot is by another player', () => {
    expect(currentStreak([pot(P1), pot(P2)], P1)).toBe(0)
  })
  it('counts a trailing run of pots', () => {
    expect(currentStreak([miss(P2), pot(P1), pot(P1), pot(P1)], P1)).toBe(3)
  })
  it('breaks on a miss', () => {
    expect(currentStreak([pot(P1), miss(P1), pot(P1)], P1)).toBe(1)
  })
  it('breaks on an error even if balls were potted', () => {
    expect(currentStreak([pot(P1), err(P1, { balls_potted: 1, potted: true })], P1)).toBe(0)
  })
})

describe('loserBallsRemaining', () => {
  it('is 7 when the loser potted nothing', () => {
    expect(loserBallsRemaining([pot(P1)], P2)).toBe(7)
  })
  it('subtracts legally potted balls', () => {
    const shots = [pot(P2, { balls_potted: 3 }), pot(P2, { balls_potted: 1 })]
    expect(loserBallsRemaining(shots, P2)).toBe(3)
  })
  it('ignores fouls when counting the loser pots', () => {
    const shots = [err(P2, { balls_potted: 2, potted: true }), pot(P2, { balls_potted: 1 })]
    expect(loserBallsRemaining(shots, P2)).toBe(6)
  })
  it('never goes below zero', () => {
    const shots = [pot(P2, { balls_potted: 9 })]
    expect(loserBallsRemaining(shots, P2)).toBe(0)
  })
})
