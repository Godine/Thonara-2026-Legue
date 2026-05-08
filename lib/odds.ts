import type { Shot } from '@/types/database'

// Exponential decay weighting — recent shots count more (half-life ≈ 4 shots)
export function weightedAccuracy(shots: Shot[], playerId: string, decay = 0.8): number {
  const mine = shots.filter(s => s.player_id === playerId)
  if (mine.length === 0) return 0
  let wPots = 0, wTotal = 0
  const n = mine.length
  for (let i = 0; i < n; i++) {
    const w = Math.pow(decay, n - 1 - i) // most recent = weight 1, older = smaller
    wPots  += w * ((mine[i].balls_potted ?? (mine[i].potted ? 1 : 0)) > 0 ? 1 : 0)
    wTotal += w
  }
  return wPots / wTotal
}

// Markov chain: P(P1 wins) given ball counts and whose turn it is.
// Solved as a 2-equation linear system per (r1, r2) cell to avoid circular recursion.
export function solveMarkov(
  r1: number, r2: number,
  a1: number, a2: number,
  p1Turn: boolean,
): number {
  const dp: [number, number][][] = Array.from({ length: r1 + 1 }, () =>
    Array.from({ length: r2 + 1 }, () => [0, 0] as [number, number])
  )
  for (let j = 0; j <= r2; j++) dp[0][j] = [1, 1] // P1 cleared → P1 wins
  for (let i = 1; i <= r1; i++) dp[i][0] = [0, 0] // P2 cleared → P2 wins

  const denom = a1 + a2 - a1 * a2
  for (let i = 1; i <= r1; i++) {
    for (let j = 1; j <= r2; j++) {
      const A = dp[i - 1][j][0]
      const B = dp[i][j - 1][1]
      const p1t = (a1 * A + (1 - a1) * a2 * B) / denom
      dp[i][j] = [p1t, a2 * B + (1 - a2) * p1t]
    }
  }
  return dp[r1][r2][p1Turn ? 0 : 1]
}

export function computeOdds(
  shots: Shot[],
  p1Id: string,
  p2Id: string,
  p1Remaining: number,
  p2Remaining: number,
  p1Prior: { shots: number; potted: number },
  p2Prior: { shots: number; potted: number },
  h2h: { p1Wins: number; p2Wins: number },
  isP1Turn: boolean,
): { p1: number; p2: number } {
  const hasData = shots.length + p1Prior.shots + p2Prior.shots + h2h.p1Wins + h2h.p2Wins > 0
  if (!hasData) return { p1: 50, p2: 50 }

  const p1Mom = weightedAccuracy(shots, p1Id)
  const p2Mom = weightedAccuracy(shots, p2Id)
  const p1GameShots = shots.filter(s => s.player_id === p1Id).length
  const p2GameShots = shots.filter(s => s.player_id === p2Id).length
  const raw1 = p1GameShots > 0
    ? (p1Mom * p1GameShots + p1Prior.potted + 1) / (p1GameShots + p1Prior.shots + 2)
    : (p1Prior.potted + 1) / (p1Prior.shots + 2)
  const raw2 = p2GameShots > 0
    ? (p2Mom * p2GameShots + p2Prior.potted + 1) / (p2GameShots + p2Prior.shots + 2)
    : (p2Prior.potted + 1) / (p2Prior.shots + 2)
  const a1 = Math.max(0.05, Math.min(0.95, raw1))
  const a2 = Math.max(0.05, Math.min(0.95, raw2))

  const markovP1 = solveMarkov(p1Remaining, p2Remaining, a1, a2, isP1Turn)

  const h2hTotal = h2h.p1Wins + h2h.p2Wins
  const h2hP1 = h2hTotal > 0 ? h2h.p1Wins / h2hTotal : 0.5
  const h2hWeight = Math.min(h2hTotal / 20, 0.25) * Math.max(0, 1 - shots.length / 30)

  const p1Pct = Math.round((markovP1 * (1 - h2hWeight) + h2hP1 * h2hWeight) * 100)
  return { p1: p1Pct, p2: 100 - p1Pct }
}
