'use client'

import { useState } from 'react'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import PlayerBall from './PlayerBall'

interface Props {
  username: PlayerUsername
  size?: number
  className?: string
}

// Shows the player's photo in a rounded frame if available,
// falls back silently to the PlayerBall SVG if the image 404s.
export default function PlayerAvatar({ username, size = 48, className = '' }: Props) {
  const [error, setError] = useState(false)
  const style = PLAYER_STYLES[username]

  if (style.photo && !error) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: `2.5px solid ${style.color}`,
          boxShadow: `0 0 10px ${style.color}40`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={style.photo}
          alt={style.label}
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  return <PlayerBall number={style.number} color={style.color} size={size} className={className} />
}
