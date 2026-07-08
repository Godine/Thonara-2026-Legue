export type ShotResult = 'potted' | 'lucky' | 'miss' | 'error'

export interface Player {
  id: string
  username: string
  display_name: string
  ball_number: number
  color: string
  created_at: string
}

export interface Session {
  id: string
  date: string
  created_at: string
  created_by: string
  is_complete: boolean
  notes?: string
}

export interface Game {
  id: string
  session_id: string
  game_number: number
  player1_id: string
  player2_id: string
  winner_id: string | null
  is_complete: boolean
  loser_potted_black: boolean
  created_at: string
  player1?: Player
  player2?: Player
  winner?: Player | null
}

export interface Shot {
  id: string
  game_id: string
  player_id: string
  potted: boolean
  balls_potted: number
  opponent_balls_potted: number
  ball_color: string | null
  is_lucky: boolean
  is_error: boolean
  cue_ball_potted?: boolean
  shot_number: number
  created_at: string
}

export interface GameWithShots extends Game {
  shots: Shot[]
}

export interface SessionWithGames extends Session {
  games: GameWithShots[]
}

export interface LeagueStanding {
  id: string
  username: string
  display_name: string
  ball_number: number
  color: string
  wins: number
  losses: number
  games_played: number
}

export interface PlayerGameStats {
  shots: number
  potted: number
  errors: number
  lucky: number
  bankPct: number
  errorPct: number
}

export interface TipCompletion {
  id: string
  username: string
  slug: string
  completed_at: string
}

export interface QuizScore {
  id: string
  username: string
  quiz_key: string
  score: number
  total: number
  completed_at: string
}
