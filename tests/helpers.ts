import type { Shot } from '@/types/database'

let counter = 0

/** Build a Shot with sensible defaults; override only what a test cares about.
 *  shot_number auto-increments unless provided. */
export function shot(partial: Partial<Shot> & { player_id: string }): Shot {
  counter += 1
  return {
    id: `s-${counter}`,
    game_id: 'g1',
    potted: false,
    balls_potted: 0,
    opponent_balls_potted: 0,
    ball_color: null,
    is_lucky: false,
    is_error: false,
    shot_number: counter,
    created_at: new Date(2026, 0, 1, 0, 0, counter).toISOString(),
    ...partial,
  }
}

/** A clean pot of one own-colour ball. */
export const pot = (player_id: string, over: Partial<Shot> = {}): Shot =>
  shot({ player_id, potted: true, balls_potted: 1, ...over })

/** A miss (no balls potted). */
export const miss = (player_id: string, over: Partial<Shot> = {}): Shot =>
  shot({ player_id, potted: false, balls_potted: 0, ...over })

/** A foul/error. */
export const err = (player_id: string, over: Partial<Shot> = {}): Shot =>
  shot({ player_id, is_error: true, ...over })
