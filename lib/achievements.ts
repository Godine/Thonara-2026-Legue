import { PLAYERS, type PlayerUsername } from '@/lib/game-config'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  rarity: Rarity
}

export const RARITY_STYLES: Record<Rarity, { label: string; color: string; border: string; bg: string }> = {
  common:    { label: 'Common',    color: '#22c55e', border: '#22c55e33', bg: '#22c55e0d' },
  rare:      { label: 'Rare',      color: '#60a5fa', border: '#60a5fa33', bg: '#60a5fa0d' },
  epic:      { label: 'Epic',      color: '#a855f7', border: '#a855f733', bg: '#a855f70d' },
  legendary: { label: 'Legendary', color: '#c9a227', border: '#c9a22733', bg: '#c9a2270d' },
}

export const RARITY_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common']

export const ACHIEVEMENTS: Achievement[] = [
  // Legendary
  { id: 'champion',        icon: '🏆', name: 'Champion',        description: 'Win 7 games in a row',                                          rarity: 'legendary' },
  { id: 'sharp_shooter',   icon: '🔭', name: 'Sharp Shooter',   description: 'Career accuracy of 72%+ across 30 or more shots',               rarity: 'legendary' },
  // Epic
  { id: 'on_fire',         icon: '⚡', name: 'On Fire',         description: 'Pot 6 balls in a row without missing',                           rarity: 'epic'      },
  { id: 'flawless',        icon: '💎', name: 'Flawless',        description: 'Win a game with zero misses or errors (min 8 shots)',             rarity: 'epic'      },
  { id: 'perfect_session', icon: '👑', name: 'Perfect Session', description: 'Win all your games in a single session',                         rarity: 'epic'      },
  { id: 'comeback',        icon: '😤', name: 'Comeback Kid',    description: 'Win after your opponent was 4 or more pots ahead of you',        rarity: 'epic'      },
  { id: 'black_magic',     icon: '⚫', name: 'Black Magic',     description: 'Win 5 games where the opponent potted the black ball',            rarity: 'epic'      },
  // Rare
  { id: 'hat_trick',       icon: '🎩', name: 'Hat Trick',       description: 'Pot 4 balls in a row without missing',                           rarity: 'rare'      },
  { id: 'sniper',          icon: '🎯', name: 'Sniper',          description: '85%+ accuracy in a single game (minimum 7 shots)',               rarity: 'rare'      },
  { id: 'hot_streak',      icon: '🔥', name: 'Hot Streak',      description: 'Win 4 games in a row',                                           rarity: 'rare'      },
  { id: 'nemesis',         icon: '😈', name: 'Nemesis',         description: 'Beat the same opponent 8 or more times',                         rarity: 'rare'      },
  // Common
  { id: 'first_win',       icon: '🎱', name: 'First Blood',     description: 'Win your very first game',                                       rarity: 'common'    },
  { id: 'lucky_charm',     icon: '🍀', name: 'Lucky Charm',     description: 'Pot 3 or more flukes in a single game',                          rarity: 'common'    },
  { id: 'veteran',         icon: '🎮', name: 'Veteran',         description: 'Play 30 or more games total',                                    rarity: 'common'    },
]

// Minimal types matching what fetchCompletedGames / fetchAllShots return
type RawGame = {
  id: string
  game_number: number
  session_id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  loser_potted_black: boolean
  player1: { id: string; username: string }
  player2: { id: string; username: string }
  session: { id: string; date: string }
}

type RawShot = {
  id: string
  game_id: string
  player_id: string
  potted: boolean
  is_lucky: boolean
  is_error: boolean
  shot_number: number
}

function longestWinStreak(gamesList: RawGame[], pid: string): number {
  let max = 0, cur = 0
  for (const g of gamesList) {
    if (g.winner_id === pid) { cur++; max = Math.max(max, cur) }
    else if (g.winner_id) cur = 0
  }
  return max
}

export function computePlayerAchievements(
  username: PlayerUsername,
  games: RawGame[],
  shots: RawShot[],
): string[] {
  // Sort chronologically — required for streak computation
  const sorted = [...games].sort((a, b) => {
    const da = a.session?.date ?? ''
    const db = b.session?.date ?? ''
    return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
  })

  // Build player ID lookup
  const usernameToId: Partial<Record<PlayerUsername, string>> = {}
  for (const g of sorted) {
    usernameToId[g.player1.username as PlayerUsername] = g.player1_id
    usernameToId[g.player2.username as PlayerUsername] = g.player2_id
  }
  const playerId = usernameToId[username] ?? ''
  if (!playerId) return []

  const myGames = sorted.filter(g => g.player1_id === playerId || g.player2_id === playerId)
  const myShots = shots.filter(s => s.player_id === playerId)

  // Group shots by game for fast lookup
  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

  // Longest consecutive pot run for this player in a given game
  const maxConsecPots = (gameId: string): number => {
    const gameShotsAll = (shotsByGame.get(gameId) ?? []).sort((a, b) => a.shot_number - b.shot_number)
    let max = 0, cur = 0
    for (const s of gameShotsAll) {
      if (s.player_id === playerId && s.potted) cur++
      else cur = 0
      max = Math.max(max, cur)
    }
    return max
  }

  const earned: string[] = []

  // first_win
  if (myGames.some(g => g.winner_id === playerId))
    earned.push('first_win')

  // lucky_charm — 3+ flukes in one game
  if (myGames.some(g =>
    (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId && s.is_lucky).length >= 3
  )) earned.push('lucky_charm')

  // veteran — 30+ games played
  if (myGames.length >= 30)
    earned.push('veteran')

  // hat_trick — 4 in a row
  if (myGames.some(g => maxConsecPots(g.id) >= 4))
    earned.push('hat_trick')

  // sniper — 85%+ accuracy in a game, min 7 shots
  if (myGames.some(g => {
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 7 && gs.filter(s => s.potted).length / gs.length >= 0.85
  })) earned.push('sniper')

  // hot_streak — 4 wins in a row
  if (longestWinStreak(myGames, playerId) >= 4)
    earned.push('hot_streak')

  // nemesis — beat same opponent 8+ times
  if (PLAYERS.filter(u => u !== username).some(opp => {
    const oid = usernameToId[opp] ?? ''
    if (!oid) return false
    const h2h = myGames.filter(g =>
      (g.player1_id === playerId && g.player2_id === oid) ||
      (g.player2_id === playerId && g.player1_id === oid)
    )
    return h2h.filter(g => g.winner_id === playerId).length >= 8
  })) earned.push('nemesis')

  // on_fire — 6 in a row
  if (myGames.some(g => maxConsecPots(g.id) >= 6))
    earned.push('on_fire')

  // flawless — win, min 8 shots, every shot potted (no misses or errors)
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 8 && gs.every(s => s.potted)
  })) earned.push('flawless')

  // perfect_session — win every game played in a session
  {
    const seenSessions = new Set<string>()
    const sessionIds: string[] = []
    for (const g of myGames) {
      if (!seenSessions.has(g.session_id)) { seenSessions.add(g.session_id); sessionIds.push(g.session_id) }
    }
    if (sessionIds.some(sid => {
      const sGames = myGames.filter(g => g.session_id === sid && g.winner_id !== null)
      return sGames.length > 0 && sGames.every(g => g.winner_id === playerId)
    })) earned.push('perfect_session')
  }

  // comeback — win after opponent 4+ pots ahead
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const oppId = g.player1_id === playerId ? g.player2_id : g.player1_id
    const gameShotsAll = (shotsByGame.get(g.id) ?? []).sort((a, b) => a.shot_number - b.shot_number)
    let myP = 0, oppP = 0
    for (const s of gameShotsAll) {
      if (s.player_id === playerId && s.potted) myP++
      else if (s.player_id === oppId && s.potted) oppP++
      if (oppP - myP >= 4) return true
    }
    return false
  })) earned.push('comeback')

  // black_magic — win 5+ games where loser potted the black
  if (myGames.filter(g => g.winner_id === playerId && g.loser_potted_black).length >= 5)
    earned.push('black_magic')

  // champion — 7 wins in a row
  if (longestWinStreak(myGames, playerId) >= 7)
    earned.push('champion')

  // sharp_shooter — 72%+ career accuracy, min 30 shots
  if (myShots.length >= 30 && myShots.filter(s => s.potted).length / myShots.length >= 0.72)
    earned.push('sharp_shooter')

  return earned
}

export function computeAllAchievements(
  games: RawGame[],
  shots: RawShot[],
): Record<PlayerUsername, string[]> {
  const result = {} as Record<PlayerUsername, string[]>
  for (const u of PLAYERS) {
    result[u] = computePlayerAchievements(u, games, shots)
  }
  return result
}
