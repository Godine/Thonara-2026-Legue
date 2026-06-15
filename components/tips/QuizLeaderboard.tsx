'use client'

import PlayerAvatar from '@/components/PlayerAvatar'
import { PLAYERS, PLAYER_STYLES } from '@/lib/game-config'
import { useTipsProgress } from './TipsProgressContext'

export default function QuizLeaderboard({ quizKey }: { quizKey: string }) {
  const { quizResults } = useTipsProgress()
  const results = quizResults(quizKey)

  const ranked = [...PLAYERS].sort((a, b) => {
    const ra = results[a]
    const rb = results[b]
    const pa = ra ? ra.score / ra.total : -1
    const pb = rb ? rb.score / rb.total : -1
    return pb - pa
  })

  return (
    <div className="bg-pool-surface rounded-2xl border border-pool-border p-4">
      <p className="font-heading text-xs tracking-widest text-pool-chalk-dim mb-3">QUIZ SCORES</p>
      <div className="flex flex-col gap-2.5">
        {ranked.map(username => {
          const style = PLAYER_STYLES[username]
          const result = results[username]
          return (
            <div key={username} className="flex items-center gap-3">
              <PlayerAvatar username={username} size={32} />
              <p className="font-body text-sm text-pool-chalk flex-1">{style.label}</p>
              {result ? (
                <p className="font-heading text-base tracking-wide" style={{ color: style.color }}>
                  {result.score} / {result.total}
                </p>
              ) : (
                <p className="font-body text-xs text-pool-chalk-dim">Not attempted</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
