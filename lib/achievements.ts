import { PLAYERS, type PlayerUsername } from '@/lib/game-config'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  rarity: Rarity
  exclusive?: boolean  // only one player can ever earn this
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
  { id: 'three_peat',      icon: '🎊', name: 'Three-Peat',      description: 'Win all your games in 3 consecutive sessions',                                 rarity: 'epic'   },
  { id: 'first_20',        icon: '🥇', name: 'It Was Supposed To Be Ahmed', description: 'Be the first player to reach 20 wins in the league',                    rarity: 'epic', exclusive: true },
  // Rare
  { id: 'hat_trick',       icon: '🎩', name: 'Hat Trick',       description: 'Pot 4 balls in a row without missing',                                        rarity: 'rare'   },
  { id: 'sniper',          icon: '🎯', name: 'Sniper',          description: '85%+ accuracy in a single game (minimum 7 shots)',                             rarity: 'rare'   },
  { id: 'hot_streak',      icon: '🔥', name: 'Hot Streak',      description: 'Win 4 games in a row',                                                        rarity: 'rare'   },
  { id: 'nemesis',         icon: '😈', name: 'Nemesis',         description: 'Beat the same opponent 10 times in a row',                                    rarity: 'rare'   },
  { id: 'wins_30',         icon: '🌟', name: 'Pool Pro',        description: 'Win 30 games in total',                                                      rarity: 'rare'   },
  { id: 'whitewash',       icon: '🌊', name: 'Whitewash',       description: 'Win a game where your opponent plays but fails to pot a single ball',          rarity: 'rare'   },
  { id: 'century',         icon: '💯', name: 'The Century',     description: 'Pot 100 or more balls across your entire career',                              rarity: 'rare'   },
  // Common
  { id: 'wins_5',          icon: '⭐', name: 'On The Board',    description: 'Win 5 games in total',                                                       rarity: 'common' },
  { id: 'wins_10',         icon: '💪', name: 'Double Figures',  description: 'Win 10 games in total',                                                      rarity: 'common' },
  { id: 'first_win',       icon: '🎱', name: 'First Blood',     description: 'Win your very first game',                                                    rarity: 'common' },
  { id: 'lucky_charm',     icon: '🍀', name: 'Lucky Charm',     description: 'Pot 3 or more flukes in a single game',                                       rarity: 'common' },
  { id: 'veteran',         icon: '🎮', name: 'Veteran',         description: 'Play 30 or more games total',                                                 rarity: 'common' },
  { id: 'grinder',         icon: '⚙️', name: 'The Grinder',     description: 'Win a game in which you personally took 14 or more shots',                    rarity: 'common' },
  { id: 'most_clumsy',    icon: '🤦', name: 'The Most Clumsy', description: 'Commit 3 or more errors in a single game',                                           rarity: 'common' },
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

  // nemesis — beat same opponent 10 times in a row
  if (PLAYERS.filter(u => u !== username).some(opp => {
    const oid = usernameToId[opp] ?? ''
    if (!oid) return false
    const h2h = myGames.filter(g =>
      (g.player1_id === playerId && g.player2_id === oid) ||
      (g.player2_id === playerId && g.player1_id === oid)
    )
    let streak = 0, best = 0
    for (const g of h2h) {
      if (g.winner_id === playerId) { streak++; best = Math.max(best, streak) }
      else streak = 0
    }
    return best >= 10
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

  // grinder — win a game taking 14+ shots yourself (patient, attrition-style)
  if (myGames.some(g => {
    if (g.winner_id !== playerId) return false
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 14
  })) earned.push('grinder')

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

  // first_20 — first player in the league to reach 20 wins
  {
    const allSorted = [...games].sort((a, b) => {
      const da = a.session?.date ?? ''; const db = b.session?.date ?? ''
      return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
    })
    const winCounts: Record<string, number> = {}
    let firstTo20: string | null = null
    for (const g of allSorted) {
      if (!g.winner_id) continue
      winCounts[g.winner_id] = (winCounts[g.winner_id] ?? 0) + 1
      if (winCounts[g.winner_id] >= 20 && firstTo20 === null) firstTo20 = g.winner_id
    }
    if (firstTo20 === playerId) earned.push('first_20')
  }

  // most_clumsy — 3+ errors in a single game
  if (myGames.some(g =>
    (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId && s.is_error).length >= 3
  )) earned.push('most_clumsy')

  // career win milestones
  const totalWins = myGames.filter(g => g.winner_id === playerId).length
  if (totalWins >= 5)  earned.push('wins_5')
  if (totalWins >= 10) earned.push('wins_10')
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

export interface AchievementProgress {
  current: number
  target: number
  label?: string
}

export type ProgressMap = Record<string, AchievementProgress>

export function computePlayerProgress(
  username: PlayerUsername,
  games: RawGame[],
  shots: RawShot[],
): ProgressMap {
  const sorted = [...games].sort((a, b) => {
    const da = a.session?.date ?? '', db = b.session?.date ?? ''
    return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
  })

  const usernameToId: Partial<Record<PlayerUsername, string>> = {}
  for (const g of sorted) {
    usernameToId[g.player1.username as PlayerUsername] = g.player1_id
    usernameToId[g.player2.username as PlayerUsername] = g.player2_id
  }
  const playerId = usernameToId[username] ?? ''
  if (!playerId) return {}

  const myGames = sorted.filter(g => g.player1_id === playerId || g.player2_id === playerId)
  const myShots = shots.filter(s => s.player_id === playerId)

  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

  const totalWins = myGames.filter(g => g.winner_id === playerId).length
  const careerPots = myShots.filter(s => s.potted).length

  // Max consecutive pots in any game (shared by hat_trick + on_fire)
  const maxConsecPotsEver = myGames.reduce((max, g) => {
    const gs = (shotsByGame.get(g.id) ?? []).sort((a, b) => a.shot_number - b.shot_number)
    let cur = 0, gmax = 0
    for (const s of gs) {
      if (s.player_id === playerId && s.potted) { cur++; gmax = Math.max(gmax, cur) }
      else cur = 0
    }
    return Math.max(max, gmax)
  }, 0)

  const bestWinStreak = longestWinStreak(myGames, playerId)

  // Best consecutive H2H streak vs any opponent
  let bestH2HStreak = 0
  for (const opp of PLAYERS.filter(u => u !== username)) {
    const oid = usernameToId[opp] ?? ''
    if (!oid) continue
    const h2h = myGames.filter(g =>
      (g.player1_id === playerId && g.player2_id === oid) ||
      (g.player2_id === playerId && g.player1_id === oid)
    )
    let streak = 0
    for (const g of h2h) {
      if (g.winner_id === playerId) streak++
      else streak = 0
      bestH2HStreak = Math.max(bestH2HStreak, streak)
    }
  }

  // Best accuracy in any game with min 7 shots
  const bestGameAcc = myGames.reduce((max, g) => {
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    if (gs.length < 7) return max
    return Math.max(max, Math.round((gs.filter(s => s.potted).length / gs.length) * 100))
  }, 0)

  // Max lucky shots in any single game
  const maxLuckyInGame = myGames.reduce((max, g) =>
    Math.max(max, (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId && s.is_lucky).length), 0)

  // Max errors in any single game
  const maxErrorsInGame = myGames.reduce((max, g) =>
    Math.max(max, (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId && s.is_error).length), 0)

  const lpbWins = myGames.filter(g => g.winner_id === playerId && g.loser_potted_black).length

  // Max shots taken in any won game
  const maxShotsInWin = myGames
    .filter(g => g.winner_id === playerId)
    .reduce((max, g) =>
      Math.max(max, (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId).length), 0)

  // Max deficit overcome in any won game
  const maxDeficit = myGames
    .filter(g => g.winner_id === playerId)
    .reduce((max, g) => {
      const oppId = g.player1_id === playerId ? g.player2_id : g.player1_id
      const gs = (shotsByGame.get(g.id) ?? []).sort((a, b) => a.shot_number - b.shot_number)
      let myP = 0, oppP = 0, peak = 0
      for (const s of gs) {
        if (s.player_id === playerId && s.potted) myP++
        else if (s.player_id === oppId && s.potted) oppP++
        peak = Math.max(peak, oppP - myP)
      }
      return Math.max(max, peak)
    }, 0)

  // Binary: flawless wins (win + min 8 shots + all potted)
  const flawlessCount = myGames.filter(g => {
    if (g.winner_id !== playerId) return false
    const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === playerId)
    return gs.length >= 8 && gs.every(s => s.potted)
  }).length

  // Binary: la casse ferme (all shots by this player)
  const lacasseCount = myGames.filter(g => {
    if (g.winner_id !== playerId) return false
    const gs = shotsByGame.get(g.id) ?? []
    return gs.length >= 5 && gs.every(s => s.player_id === playerId)
  }).length

  // Binary: whitewash (opp played but potted nothing)
  const whitewashCount = myGames.filter(g => {
    if (g.winner_id !== playerId) return false
    const oppId = g.player1_id === playerId ? g.player2_id : g.player1_id
    const oppShots = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === oppId)
    return oppShots.length > 0 && oppShots.every(s => !s.potted)
  }).length

  // Sessions data
  const seenSess = new Set<string>(); const sessOrder: string[] = []
  for (const g of myGames) {
    if (!seenSess.has(g.session_id)) { seenSess.add(g.session_id); sessOrder.push(g.session_id) }
  }

  const perfectSessionCount = sessOrder.filter(sid => {
    const sg = myGames.filter(g => g.session_id === sid && g.winner_id !== null)
    return sg.length > 0 && sg.every(g => g.winner_id === playerId)
  }).length

  let bestConsecPerfect = 0, consec = 0
  for (const sid of sessOrder) {
    const sg = myGames.filter(g => g.session_id === sid && g.winner_id !== null)
    if (sg.length > 0 && sg.every(g => g.winner_id === playerId)) { consec++; bestConsecPerfect = Math.max(bestConsecPerfect, consec) }
    else consec = 0
  }

  // Sharp shooter: phase by shot count
  const sharpProg = myShots.length < 30
    ? { current: myShots.length, target: 30, label: `${myShots.length}/30 shots` }
    : { current: Math.round((careerPots / myShots.length) * 100), target: 72, label: `${Math.round((careerPots / myShots.length) * 100)}%/72%` }

  return {
    first_win:        { current: Math.min(totalWins, 1),           target: 1 },
    lucky_charm:      { current: maxLuckyInGame,                    target: 3 },
    veteran:          { current: myGames.length,                    target: 30 },
    hat_trick:        { current: Math.min(maxConsecPotsEver, 4),    target: 4 },
    sniper:           { current: bestGameAcc,                       target: 85, label: `${bestGameAcc}%/85%` },
    hot_streak:       { current: Math.min(bestWinStreak, 4),        target: 4 },
    nemesis:          { current: Math.min(bestH2HStreak, 10),       target: 10 },
    on_fire:          { current: Math.min(maxConsecPotsEver, 6),    target: 6 },
    flawless:         { current: flawlessCount,                     target: 1 },
    perfect_session:  { current: perfectSessionCount,               target: 1 },
    comeback:         { current: Math.min(maxDeficit, 4),           target: 4 },
    black_magic:      { current: lpbWins,                           target: 5 },
    champion:         { current: Math.min(bestWinStreak, 7),        target: 7 },
    sharp_shooter:    sharpProg,
    la_casse_ferme:   { current: lacasseCount,                      target: 1 },
    whitewash:        { current: whitewashCount,                    target: 1 },
    century:          { current: careerPots,                        target: 100 },
    grinder:          { current: Math.min(maxShotsInWin, 14),       target: 14 },
    three_peat:       { current: Math.min(bestConsecPerfect, 3),    target: 3 },
    wins_5:           { current: Math.min(totalWins, 5),            target: 5 },
    wins_10:          { current: Math.min(totalWins, 10),           target: 10 },
    wins_30:          { current: Math.min(totalWins, 30),           target: 30 },
    half_century:     { current: Math.min(totalWins, 50),           target: 50 },
    first_20:         { current: Math.min(totalWins, 20),           target: 20 },
    most_clumsy:      { current: maxErrorsInGame,                   target: 3 },
  }
}

export function computeAllProgress(
  games: RawGame[],
  shots: RawShot[],
): Record<PlayerUsername, ProgressMap> {
  const result = {} as Record<PlayerUsername, ProgressMap>
  for (const u of PLAYERS) {
    result[u] = computePlayerProgress(u, games, shots)
  }
  return result
}

export interface AchievementUnlock {
  id: string
  username: PlayerUsername
  badgeId: string
  sessionId: string
  sessionDate: string
  gameId: string
  gameNumber: number
}

// Replays the full game history game-by-game to find the exact moment each
// player first qualified for each badge. Returned newest-first.
export function computeAchievementUnlocks(
  games: RawGame[],
  shots: RawShot[],
): AchievementUnlock[] {
  const sorted = [...games].sort((a, b) => {
    const da = a.session?.date ?? '', db = b.session?.date ?? ''
    return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
  })

  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

  const unlocks: AchievementUnlock[] = []
  const earnedSoFar = {} as Record<PlayerUsername, Set<string>>
  for (const u of PLAYERS) earnedSoFar[u] = new Set()

  for (let i = 0; i < sorted.length; i++) {
    const gamesUpToHere = sorted.slice(0, i + 1)
    const shotsUpToHere = gamesUpToHere.flatMap(g => shotsByGame.get(g.id) ?? [])
    const g = sorted[i]

    for (const u of PLAYERS) {
      const earned = computePlayerAchievements(u, gamesUpToHere, shotsUpToHere)
      for (const badgeId of earned) {
        if (!earnedSoFar[u].has(badgeId)) {
          earnedSoFar[u].add(badgeId)
          unlocks.push({
            id: `${u}-${badgeId}`,
            username: u,
            badgeId,
            sessionId: g.session_id,
            sessionDate: g.session?.date ?? '',
            gameId: g.id,
            gameNumber: g.game_number,
          })
        }
      }
    }
  }

  return unlocks.reverse()
}
