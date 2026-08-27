import type { Shot } from '@/types/database'

/** Balls credited to the shooter on a single shot, tolerant of legacy rows
 *  where only the boolean `potted` flag was recorded. */
export function ballsPotted(shot: Pick<Shot, 'balls_potted' | 'potted'>): number {
  return shot.balls_potted ?? (shot.potted ? 1 : 0)
}

/**
 * Whose turn it is, expressed as "is it player 1's turn?".
 *
 * Rules (unchanged from the original game page):
 *  - The player who took the first shot starts.
 *  - A pot (balls potted and not a foul) keeps the shooter on the table.
 *  - A plain miss switches the turn.
 *  - A foul (error) switches the turn AND grants the incoming player one
 *    "free" extra turn: their next miss does not switch the turn back.
 */
export function isPlayer1Turn(shots: Shot[], p1Id: string, p2Id: string): boolean {
  if (shots.length === 0) return true
  const sorted = [...shots].sort((a, b) => a.shot_number - b.shot_number)
  let currentPlayerId = sorted[0].player_id
  let extraTurn = false
  for (const s of sorted) {
    const potted = ballsPotted(s) > 0 && !s.is_error
    if (s.is_error) {
      currentPlayerId = currentPlayerId === p1Id ? p2Id : p1Id
      extraTurn = true
    } else if (!potted) {
      if (extraTurn) extraTurn = false
      else currentPlayerId = currentPlayerId === p1Id ? p2Id : p1Id
    }
  }
  return currentPlayerId === p1Id
}

export interface BreakInfo {
  pots: number
  yellows: number
  reds: number
  black: boolean
  breakerId: string
}

/**
 * Summarises the break: the first consecutive potting shots taken by whoever
 * shot first. Stops at the first shot that pots nothing (own or opponent) or
 * that belongs to the other player. Returns null when no shots exist.
 */
export function computeBreakInfo(shots: Shot[]): BreakInfo | null {
  if (shots.length === 0) return null
  const sorted = [...shots].sort((a, b) => a.shot_number - b.shot_number)
  const breakerId = sorted[0].player_id
  let pots = 0, yellows = 0, reds = 0, black = false
  for (const s of sorted) {
    if (s.player_id !== breakerId) break
    const sp = ballsPotted(s)
    const opp = s.opponent_balls_potted ?? 0
    if (sp === 0 && opp === 0) break
    pots += sp + opp
    if (s.ball_color === 'yellow') { yellows += sp; reds += opp }
    else if (s.ball_color === 'red') { reds += sp; yellows += opp }
    else if (s.ball_color === 'black') { black = true }
  }
  return { pots, yellows, reds, black, breakerId }
}

/**
 * How many balls the given player has potted in an unbroken run ending at the
 * most recent shot (array order, matching the live streak banner). A miss,
 * an error, or a shot by the other player breaks the run.
 */
export function currentStreak(shots: Shot[], playerId: string): number {
  let streak = 0
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]
    if (s.player_id !== playerId) break
    if (ballsPotted(s) === 0 || s.is_error) break
    streak++
  }
  return streak
}

/** Balls the loser still had on the table (7 own colours minus what they
 *  legally potted), clamped to [0, 7]. Fouls don't count as pots. */
export function loserBallsRemaining(shots: Shot[], loserId: string): number {
  const loserPotted = shots
    .filter(s => s.player_id === loserId && !s.is_error)
    .reduce((sum, s) => sum + ballsPotted(s), 0)
  return Math.max(0, 7 - loserPotted)
}
