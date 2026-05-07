import type { PlayerUsername } from '@/lib/game-config'

function sessionHash(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h) ^ id.charCodeAt(i)
  }
  return Math.abs(h >>> 0)
}

const REASONS: ((name: string) => string)[] = [
  n => `${n} has been suspiciously quiet in the group chat all week. Focused mode activated.`,
  n => `Word is ${n} was practising on his lunch break. The others have been warned.`,
  n => `Something about the way ${n} walked in tonight. It's giving winner energy.`,
  n => `${n} owes everyone a proper beating after last session. Tonight is payback.`,
  n => `Mercury is in retrograde and historically that's always been kind to ${n}.`,
  n => `${n} hasn't said a single word since he arrived. That kind of silence is dangerous.`,
  n => `The table is leaning ever so slightly towards ${n}'s side. Gravitational advantage.`,
  n => `${n} just got a haircut. A fresh cut on game night is statistically a strong indicator.`,
  n => `${n} brought his own chalk tonight. That level of preparation doesn't go unrewarded.`,
  n => `A little bird told me ${n} has been mentally rehearsing his shots all week.`,
  n => `${n} is unusually calm tonight. That's either Zen mastery or something much scarier.`,
  n => `${n} just smiled at the cue ball. The cue ball looked nervous.`,
  n => `${n} is due a big one. The law of averages demands it at this point.`,
  n => `${n} looked at the table, then at his opponents, and said nothing. They should be worried.`,
  n => `I've got a feeling about ${n} tonight. Can't explain it. Just a vibe.`,
  n => `${n} arrived exactly on time. Not early, not late. That's the energy of a man with a plan.`,
  n => `${n} had a very suspicious smirk when he sat down. Something is definitely up.`,
  n => `${n} hasn't touched his phone since walking in. Total lock-in. Respect.`,
  n => `The vibe check points overwhelmingly to ${n}. Scientific process, please don't question it.`,
  n => `${n} slept 8 hours last night. It shows. The man is rested and ready.`,
  n => `${n}'s grip on the cue looked different in the warm-up. We know what that means.`,
  n => `${n} ordered water tonight. Water. That's what an athlete drinks. That's intent.`,
  n => `${n} didn't check the standings on the way in. He already knows where he's going.`,
  n => `The stars aligned for ${n} tonight. Literally. I checked. Don't ask how.`,
  n => `${n} stretched before sitting down. You don't stretch unless you mean business.`,
  n => `The cue rack was pointing towards ${n}'s seat tonight. Symbolic. Deeply symbolic.`,
  n => `${n} hasn't lost a game in his head yet tonight. That mental edge is everything.`,
  n => `${n} is playing with quiet confidence. That combination is historically lethal.`,
  n => `The chalk cube crumbled perfectly for ${n}. That never happens to someone who's about to lose.`,
  n => `${n} looked at the break position and nodded slowly. The man has a plan.`,
]

export interface SessionPrediction {
  username: PlayerUsername
  displayName: string
  reason: string
}

export function getSessionPrediction(
  sessionId: string,
  players: { username: PlayerUsername; displayName: string }[],
): SessionPrediction | null {
  if (!players.length) return null
  const h = sessionHash(sessionId)
  const winner = players[h % players.length]
  const reason = REASONS[(h >>> 5) % REASONS.length](winner.displayName)
  return { username: winner.username, displayName: winner.displayName, reason }
}
