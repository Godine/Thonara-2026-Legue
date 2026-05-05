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
  { id: 'champion',         icon: '🏆', name: 'Champion',         description: 'Win 7 games in a row',                                                    rarity: 'legendary' },
  { id: 'sharp_shooter',    icon: '🔭', name: 'Sharp Shooter',    description: 'Career accuracy of 72%+ across 30 or more shots',                          rarity: 'legendary' },
  { id: 'la_casse_ferme',   icon: '🌪️', name: 'La Casse Ferme!',  description: 'Break and finish the game without the opponent taking a single shot',       rarity: 'legendary' },
  // Epic
  { id: 'half_century',    icon: '💫', name: 'Half Century',    description: 'Win 50 games across your career',                                              rarity: 'epic'   },
  { id: 'on_fire',         icon: '⚡', name: 'On Fire',         description: 'Pot 6 balls in a row without missing',                                        rarity: 'epic'   },
  { id: 'flawless',        icon: '💎', name: 'Flawless',        description: 'Win a game with zero misses or errors (min 8 shots)',                          rarity: 'epic'   },
  { id: 'perfect_session', icon: '👑', name: 'Perfect Session', description: 'Win all your games in a single session',                                       rarity: 'epic'   },
  { id: 'comeback',        icon: '😤', name: 'Comeback Kid',    description: 'Win after your opponent was 4 or more pots ahead of you',                      rarity: 'epic'   },
  { id: 'black_magic',     icon: '⚫', name: 'Black Magic',     description: 'Win 5 games where the opponent potted the black ball',                          rarity: 'epic'   },
  { id: 'the_shark',       icon: '🦈', name: 'The Shark',       description: 'Maintain a 70%+ win rate across 15 or more games',                             rarity: 'epic'   },
  { id: 'three_peat',      icon: '🎊', name: 'Three-Peat',      description: 'Win all your games in 3 consecutive sessions',                                 rarity: 'epic'   },
  // Rare
  { id: 'hat_trick',       icon: '🎩', name: 'Hat Trick',       description: 'Pot 4 balls in a row without missing',                                        rarity: 'rare'   },
  { id: 'sniper',          icon: '🎯', name: 'Sniper',          description: '85%+ accuracy in a single game (minimum 7 shots)',                             rarity: 'rare'   },
  { id: 'hot_streak',      icon: '🔥', name: 'Hot Streak',      description: 'Win 4 games in a row',                                                        rarity: 'rare'   },
  { id: 'nemesis',         icon: '😈', name: 'Nemesis',         description: 'Beat the same opponent 8 or more times',                                      rarity: 'rare'   },
  { id: 'wins_20',         icon: '🎖️', name: 'League Regular',  description: 'Win 20 games in total',                                                      rarity: 'rare'   },
  { id: 'wins_30',         icon: '🌟', name: 'Pool Pro',        description: 'Win 30 games in total',                                                      rarity: 'rare'   },
  { id: 'whitewash',       icon: '🌊', name: 'Whitewash',       description: 'Win a game where your opponent plays but fails to pot a single ball',          rarity: 'rare'   },
  { id: 'century',         icon: '💯', name: 'The Century',     description: 'Pot 100 or more balls across your entire career',                              rarity: 'rare'   },
  { id: 'the_ace',         icon: '♠️', name: 'The Ace',         description: 'Win a game committing zero fouls or errors (min 8 shots)',                     rarity: 'rare'   },
  // Common
  { id: 'wins_5',          icon: '⭐', name: 'On The Board',    description: 'Win 5 games in total',                                                       rarity: 'common' },
  { id: 'wins_10',         icon: '💪', name: 'Double Figures',  description: 'Win 10 games in total',                                                      rarity: 'common' },
  { id: 'first_win',       icon: '🎱', name: 'First Blood',     description: 'Win your very first game',                                                    rarity: 'common' },
  { id: 'lucky_charm',     icon: '🍀', name: 'Lucky Charm',     description: 'Pot 3 or more flukes in a single game',                                       rarity: 'common' },
  { id: 'veteran',         icon: '🎮', name: 'Veteran',         description: 'Play 30 or more games total',                                                 rarity: 'common' },
  { id: 'grinder',         icon: '⚙️', name: 'The Grinder',     description: 'Win a game in which you personally took 14 or more shots',                    rarity: 'common' },
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

  // la_casse_ferme — win from break without opponent getting a single shot
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const gameShots = shotsByGame.get(g.id) ?? []
    return gameShots.length >= 5 && gameShots.every(s => s.player_id === playerId)
  })) earned.push('la_casse_ferme')

  // whitewash — win where opponent played but potted nothing
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const oppId = g.player1_id === playerId ? g.player2_id : g.player1_id
    const oppShots = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === oppId)
    return oppShots.length > 0 && oppShots.every(s => !s.potted)
  })) earned.push('whitewash')

  // century — 100+ career pots (snooker century tradition)
  if (myShots.filter(s => s.potted).length >= 100)
    earned.push('century')

  // the_ace — win with 8+ shots and zero errors/fouls committed
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 8 && !gs.some(s => s.is_error)
  })) earned.push('the_ace')

  // grinder — win a game taking 14+ shots yourself (patient, attrition-style)
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 14
  })) earned.push('grinder')

  // the_shark — 70%+ win rate with 15+ games (dominant, hustler-level consistency)
  if (myGames.length >= 15 &&
      myGames.filter(g => g.winner_id === playerId).length / myGames.length >= 0.70)
    earned.push('the_shark')

  // three_peat — win all games in 3 consecutive sessions
  {
    const seenSess = new Set<string>()
    const sessOrder: string[] = []
    for (const g of myGames) {
      if (!seenSess.has(g.session_id)) { seenSess.add(g.session_id); sessOrder.push(g.session_id) }
    }
    let consec = 0
    for (const sid of sessOrder) {
      const sGames = myGames.filter(g => g.session_id === sid && g.winner_id !== null)
      if (sGames.length > 0 && sGames.every(g => g.winner_id === playerId)) consec++
      else consec = 0
      if (consec >= 3) { earned.push('three_peat'); break }
    }
  }

  // career win milestones
  const totalWins = myGames.filter(g => g.winner_id === playerId).length
  if (totalWins >= 5)  earned.push('wins_5')
  if (totalWins >= 10) earned.push('wins_10')
  if (totalWins >= 20) earned.push('wins_20')
  if (totalWins >= 30) earned.push('wins_30')
  if (totalWins >= 50) earned.push('half_century')

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
