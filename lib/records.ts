import { PLAYERS, PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'

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

export interface RecordHolder {
  username: PlayerUsername
  context?: string
}

export interface RecordEntry {
  id: string
  icon: string
  title: string
  description: string
  value: string
  holders: RecordHolder[]
  hasData: boolean
  shameful?: boolean
}

export interface RecordSection {
  id: string
  title: string
  records: RecordEntry[]
}

function fmt(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch { return '' }
}

type Candidate = { username: PlayerUsername; value: number; context?: string }

function pickRecord(
  candidates: Candidate[],
  format: (v: number) => string,
): { value: string; holders: RecordHolder[]; hasData: boolean } {
  const valid = candidates.filter(c => c.value > 0)
  if (valid.length === 0) return { value: '—', holders: [], hasData: false }
  const max = Math.max(...valid.map(c => c.value))
  const holders = valid.filter(c => c.value === max).map(c => ({ username: c.username, context: c.context }))
  return { value: format(max), holders, hasData: true }
}

export function computeRecords(games: RawGame[], shots: RawShot[]): RecordSection[] {
  if (games.length === 0) return []

  const sorted = [...games].sort((a, b) => {
    const da = a.session?.date ?? '', db = b.session?.date ?? ''
    return da !== db ? da.localeCompare(db) : a.game_number - b.game_number
  })

  // Build id ↔ username maps
  const idToUser = new Map<string, PlayerUsername>()
  const userToId = new Map<PlayerUsername, string>()
  for (const g of games) {
    idToUser.set(g.player1_id, g.player1.username as PlayerUsername)
    idToUser.set(g.player2_id, g.player2.username as PlayerUsername)
    userToId.set(g.player1.username as PlayerUsername, g.player1_id)
    userToId.set(g.player2.username as PlayerUsername, g.player2_id)
  }

  const shotsByGame = new Map<string, RawShot[]>()
  for (const s of shots) {
    if (!shotsByGame.has(s.game_id)) shotsByGame.set(s.game_id, [])
    shotsByGame.get(s.game_id)!.push(s)
  }

  function oppLabel(gameId: string, myId: string, game: RawGame): string {
    const oppId = game.player1_id === myId ? game.player2_id : game.player1_id
    const oppU = idToUser.get(oppId)
    const date = fmt(game.session?.date)
    return oppU ? `vs ${PLAYER_STYLES[oppU].label}${date ? ` · ${date}` : ''}` : date
  }

  // ── Career ────────────────────────────────────────────────────────────────

  const mostWins = pickRecord(PLAYERS.map(u => {
    const pid = userToId.get(u) ?? ''
    const value = games.filter(g => g.winner_id === pid).length
    return { username: u, value }
  }), v => `${v}`)

  const mostGamesPlayed = pickRecord(PLAYERS.map(u => {
    const pid = userToId.get(u) ?? ''
    const value = games.filter(g => g.player1_id === pid || g.player2_id === pid).length
    return { username: u, value }
  }), v => `${v}`)

  const mostCareerPots = pickRecord(PLAYERS.map(u => {
    const pid = userToId.get(u) ?? ''
    const value = shots.filter(s => s.player_id === pid && s.potted).length
    return { username: u, value }
  }), v => `${v}`)

  const bestCareerAcc = pickRecord(PLAYERS.map(u => {
    const pid = userToId.get(u) ?? ''
    const ps = shots.filter(s => s.player_id === pid)
    if (ps.length < 30) return { username: u, value: 0 }
    return { username: u, value: Math.round((ps.filter(s => s.potted).length / ps.length) * 100) }
  }), v => `${v}%`)

  // ── Single Game ───────────────────────────────────────────────────────────

  const gamePotsPerPlayer: Candidate[] = []
  const gameAccPerPlayer: Candidate[] = []
  const gameShotsPerPlayer: Candidate[] = []

  for (const g of sorted) {
    for (const pid of [g.player1_id, g.player2_id]) {
      const u = idToUser.get(pid)
      if (!u) continue
      const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === pid)
      const pots = gs.filter(s => s.potted).length
      const ctx = oppLabel(g.id, pid, g)

      gamePotsPerPlayer.push({ username: u, value: pots, context: ctx })
      gameShotsPerPlayer.push({ username: u, value: gs.length, context: ctx })

      if (gs.length >= 7) {
        const acc = Math.round((pots / gs.length) * 100)
        gameAccPerPlayer.push({ username: u, value: acc, context: ctx })
      }
    }
  }

  // Keep best per player
  function bestPerPlayer(candidates: Candidate[]): Candidate[] {
    const best = new Map<PlayerUsername, Candidate>()
    for (const c of candidates) {
      const cur = best.get(c.username)
      if (!cur || c.value > cur.value) best.set(c.username, c)
    }
    return [...best.values()]
  }

  const mostGamePots  = pickRecord(bestPerPlayer(gamePotsPerPlayer),  v => `${v}`)
  const bestGameAcc   = pickRecord(bestPerPlayer(gameAccPerPlayer),   v => `${v}%`)
  const mostGameShots = pickRecord(bestPerPlayer(gameShotsPerPlayer), v => `${v}`)

  // Hottest break (consecutive pots from shot #1)
  const breakCandidates: Candidate[] = []
  for (const g of sorted) {
    const gs = (shotsByGame.get(g.id) ?? []).sort((a, b) => a.shot_number - b.shot_number)
    if (gs.length === 0) continue
    const breakerId = gs[0].player_id
    const u = idToUser.get(breakerId)
    if (!u) continue
    let pots = 0
    for (const s of gs) {
      if (s.player_id !== breakerId || !s.potted) break
      pots++
    }
    if (pots > 0) breakCandidates.push({ username: u, value: pots, context: oppLabel(g.id, breakerId, g) })
  }
  const hottestBreak = pickRecord(bestPerPlayer(breakCandidates), v => `${v}`)

  // ── Streaks ───────────────────────────────────────────────────────────────

  function longestStreak(pid: string, win: boolean): number {
    let max = 0, cur = 0
    for (const g of sorted) {
      if (g.player1_id !== pid && g.player2_id !== pid) continue
      if (!g.winner_id) continue
      if (win ? g.winner_id === pid : g.winner_id !== pid) { cur++; max = Math.max(max, cur) }
      else cur = 0
    }
    return max
  }

  const longestWinStreak = pickRecord(PLAYERS.map(u => ({
    username: u,
    value: longestStreak(userToId.get(u) ?? '', true),
  })), v => `${v} in a row`)

  const longestLoseStreak = pickRecord(PLAYERS.map(u => ({
    username: u,
    value: longestStreak(userToId.get(u) ?? '', false),
  })), v => `${v} in a row`)

  // ── Fun & Shame ───────────────────────────────────────────────────────────

  const errCandidates: Candidate[] = []
  const luckCandidates: Candidate[] = []
  for (const g of sorted) {
    for (const pid of [g.player1_id, g.player2_id]) {
      const u = idToUser.get(pid)
      if (!u) continue
      const gs = (shotsByGame.get(g.id) ?? []).filter(s => s.player_id === pid)
      const ctx = oppLabel(g.id, pid, g)
      errCandidates.push({ username: u, value: gs.filter(s => s.is_error).length, context: ctx })
      luckCandidates.push({ username: u, value: gs.filter(s => s.is_lucky).length, context: ctx })
    }
  }

  const mostErrors = pickRecord(bestPerPlayer(errCandidates), v => `${v}`)
  const mostLucky  = pickRecord(bestPerPlayer(luckCandidates), v => `${v}`)

  // ── Assemble ──────────────────────────────────────────────────────────────

  const sections: RecordSection[] = [
    {
      id: 'career', title: 'Career',
      records: [
        { id: 'most_wins',       icon: '🏆', title: 'Most Wins',            description: 'All-time career wins',                                     ...mostWins },
        { id: 'most_games',      icon: '🎮', title: 'Most Games Played',    description: 'Total games across all sessions',                          ...mostGamesPlayed },
        { id: 'most_pots',       icon: '🎱', title: 'Most Career Pots',     description: 'Total balls potted over all time',                         ...mostCareerPots },
        { id: 'best_career_acc', icon: '📊', title: 'Best Career Accuracy', description: 'Highest pot rate across career (min 30 shots)',            ...bestCareerAcc },
      ],
    },
    {
      id: 'game', title: 'Single Game',
      records: [
        { id: 'most_game_pots',  icon: '⚡', title: 'Most Pots in a Game',  description: 'Most balls potted by one player in a single game',         ...mostGamePots },
        { id: 'best_game_acc',   icon: '🎯', title: 'Best Game Accuracy',   description: 'Highest pot rate in one game (min 7 shots)',               ...bestGameAcc },
        { id: 'hottest_break',   icon: '💥', title: 'Hottest Break',        description: 'Most consecutive pots from the opening break',             ...hottestBreak },
        { id: 'most_game_shots', icon: '⚙️', title: 'Most Shots in a Game', description: 'Most shots taken by one player in a single game',         ...mostGameShots },
      ],
    },
    {
      id: 'streaks', title: 'Streaks',
      records: [
        { id: 'win_streak',  icon: '🔥', title: 'Longest Win Streak',    description: 'Most consecutive wins ever',    ...longestWinStreak },
        { id: 'lose_streak', icon: '😭', title: 'Longest Losing Streak', description: 'Most consecutive losses ever', ...longestLoseStreak, shameful: true },
      ],
    },
    {
      id: 'fun', title: 'Fun & Shame',
      records: [
        { id: 'most_lucky',  icon: '🍀', title: 'Luckiest Game',        description: 'Most flukes potted in a single game',              ...mostLucky },
        { id: 'most_errors', icon: '🤦', title: 'Most Errors in a Game', description: 'Most fouls or errors committed in a single game', ...mostErrors, shameful: true },
      ],
    },
  ]

  return sections
    .map(s => ({ ...s, records: s.records.filter(r => r.hasData) }))
    .filter(s => s.records.length > 0)
}
