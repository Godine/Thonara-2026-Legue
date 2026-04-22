export const GAME_SCHEDULE = [
  { gameNumber: 1, player1: 'godine', player2: 'ahmed',  scorer: 'adib'   },
  { gameNumber: 2, player1: 'adib',   player2: 'ahmed',  scorer: 'godine' },
  { gameNumber: 3, player1: 'adib',   player2: 'godine', scorer: 'ahmed'  },
  { gameNumber: 4, player1: 'ahmed',  player2: 'godine', scorer: 'adib'   },
  { gameNumber: 5, player1: 'ahmed',  player2: 'adib',   scorer: 'godine' },
  { gameNumber: 6, player1: 'godine', player2: 'adib',   scorer: 'ahmed'  },
] as const

export type PlayerUsername = 'adib' | 'ahmed' | 'godine'

export const PLAYER_STYLES: Record<PlayerUsername, {
  color: string
  dimColor: string
  number: number
  label: string
}> = {
  adib:   { color: '#f5c518', dimColor: '#7a6209', number: 1, label: 'Adib'   },
  ahmed:  { color: '#60a5fa', dimColor: '#1e3a5f', number: 2, label: 'Ahmed'  },
  godine: { color: '#f87171', dimColor: '#7a2020', number: 3, label: 'Godine' },
}

const EMAIL_MAP: Record<PlayerUsername, string> = {
  adib:   'adib.benk.pro@gmail.com',
  ahmed:  'lahlouahmed0@gmail.com',
  godine: 'lechgar@gmail.com',
}

export function toEmail(username: string): string {
  return EMAIL_MAP[username as PlayerUsername] ?? `${username}@thonara.app`
}
