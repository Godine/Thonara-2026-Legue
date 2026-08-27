import { describe, it, expect } from 'vitest'
import { weightedAccuracy, solveMarkov, computeOdds } from '@/lib/odds'
import { pot, miss } from './helpers'

const P1 = 'p1'
const P2 = 'p2'
const NO_PRIOR = { shots: 0, potted: 0 }
const NO_H2H = { p1Wins: 0, p2Wins: 0 }

describe('weightedAccuracy', () => {
  it('is 0 with no shots for the player', () => {
    expect(weightedAccuracy([pot(P2)], P1)).toBe(0)
  })
  it('is 1 when every shot is potted', () => {
    expect(weightedAccuracy([pot(P1), pot(P1)], P1)).toBeCloseTo(1)
  })
  it('weights recent shots more heavily', () => {
    // A recent pot pulls the score above the unweighted 1/3;
    // a recent miss pulls it below the unweighted 2/3.
    const recentPot = weightedAccuracy([miss(P1), miss(P1), pot(P1)], P1)
    const recentMiss = weightedAccuracy([pot(P1), pot(P1), miss(P1)], P1)
    expect(recentPot).toBeGreaterThan(1 / 3)
    expect(recentMiss).toBeLessThan(2 / 3)
  })
})

describe('solveMarkov', () => {
  it('gives the player on strike an edge with equal skill and equal balls', () => {
    const p1First = solveMarkov(3, 3, 0.5, 0.5, true)
    expect(p1First).toBeGreaterThan(0.5)
    // By symmetry, P(p1 wins | p1 on strike) === P(p2 wins | p2 on strike),
    // and P(p2 wins | p2 strike) = 1 - solveMarkov(...,false).
    const p2First = solveMarkov(3, 3, 0.5, 0.5, false)
    expect(p1First).toBeCloseTo(1 - p2First, 5)
  })

  it('favours the player with fewer balls left', () => {
    const ahead = solveMarkov(1, 5, 0.5, 0.5, true)
    const behind = solveMarkov(5, 1, 0.5, 0.5, true)
    expect(ahead).toBeGreaterThan(behind)
    expect(ahead).toBeGreaterThan(0.5)
  })

  it('favours the more accurate player', () => {
    const skilled = solveMarkov(3, 3, 0.9, 0.3, true)
    const weak = solveMarkov(3, 3, 0.3, 0.9, true)
    expect(skilled).toBeGreaterThan(weak)
  })

  it('stays within [0, 1]', () => {
    for (const turn of [true, false]) {
      const v = solveMarkov(4, 2, 0.7, 0.4, turn)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('computeOdds', () => {
  it('is 50/50 when there is no data at all', () => {
    expect(computeOdds([], P1, P2, 7, 7, NO_PRIOR, NO_PRIOR, NO_H2H, true)).toEqual({ p1: 50, p2: 50 })
  })

  it('always returns integer percentages summing to 100', () => {
    const shots = [pot(P1), miss(P1), pot(P2)]
    const o = computeOdds(shots, P1, P2, 5, 6, { shots: 10, potted: 6 }, { shots: 10, potted: 4 }, { p1Wins: 3, p2Wins: 1 }, true)
    expect(Number.isInteger(o.p1)).toBe(true)
    expect(Number.isInteger(o.p2)).toBe(true)
    expect(o.p1 + o.p2).toBe(100)
  })

  it('leans toward the player with the stronger career prior', () => {
    const strong = computeOdds([], P1, P2, 7, 7, { shots: 50, potted: 40 }, { shots: 50, potted: 10 }, NO_H2H, true)
    expect(strong.p1).toBeGreaterThan(strong.p2)
  })

  it('nudges toward a favourable head-to-head record', () => {
    const withH2H = computeOdds([], P1, P2, 7, 7, NO_PRIOR, NO_PRIOR, { p1Wins: 20, p2Wins: 0 }, true)
    expect(withH2H.p1).toBeGreaterThan(50)
  })
})
