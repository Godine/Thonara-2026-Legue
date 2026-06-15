'use client'

import PlayerAvatar from '@/components/PlayerAvatar'
import { PLAYERS, type PlayerUsername } from '@/lib/game-config'

export default function ReadAvatars({ usernames, size = 16 }: { usernames: PlayerUsername[]; size?: number }) {
  const order = PLAYERS.filter(u => usernames.includes(u))
  if (order.length === 0) return null

  return (
    <div className="flex items-center -space-x-1.5">
      {order.map(u => (
        <PlayerAvatar key={u} username={u} size={size} />
      ))}
    </div>
  )
}
