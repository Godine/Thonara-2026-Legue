export const GAME_SCHEDULE = [
  { gameNumber: 1, player1: 'godine', player2: 'shin',  scorer: 'adib'  },
  { gameNumber: 2, player1: 'adib',   player2: 'shin',  scorer: 'godine' },
  { gameNumber: 3, player1: 'adib',   player2: 'godine', scorer: 'shin'  },
  { gameNumber: 4, player1: 'shin',   player2: 'godine', scorer: 'adib'  },
  { gameNumber: 5, player1: 'shin',   player2: 'adib',  scorer: 'godine' },
  { gameNumber: 6, player1: 'godine', player2: 'adib',  scorer: 'shin'  },
] as const

export type PlayerUsername = 'adib' | 'shin' | 'godine'

export const PLAYER_STYLES: Record<PlayerUsername, {
  color: string
  dimColor: string
  number: number
  label: string
}> = {
  adib:   { color: '#f5c518', dimColor: '#7a6209', number: 1, label: 'Adib'   },
  shin:   { color: '#60a5fa', dimColor: '#1e3a5f', number: 2, label: 'Shin'   },
  godine: { color: '#f87171', dimColor: '#7a2020', number: 3, label: 'Godine' },
}

export const DOMAIN = '@thonara.app'

export function toEmail(username: string) {
  return `${username.toLowerCase()}${DOMAIN}`
}
