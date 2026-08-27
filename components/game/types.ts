// Shared view-model types for the live game page and its sub-components.

export interface EndGameState {
  open: boolean
  winnerId: string
  blackBall: boolean
}

export interface PotPopupState {
  playerId: string
  ownBalls: number
  oppBalls: number
}

export interface FoulState {
  playerId: string
  ownBalls: number
  oppBalls: number
  cueBallIn: boolean
}

export interface MilestoneToast {
  id: string
  playerColor: string
  emoji: string
  headline: string
  message: string
}
