interface PlayerBallProps {
  number: number
  color: string
  size?: number
  className?: string
}

export default function PlayerBall({ number, color, size = 48, className = '' }: PlayerBallProps) {
  const gradId = `bg-${number}-${color.replace('#', '')}`
  const shineId = `sh-${number}-${color.replace('#', '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label={`Ball ${number}`}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
        <radialGradient id={shineId} cx="30%" cy="28%" r="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Drop shadow */}
      <ellipse cx="24" cy="45" rx="10" ry="2.5" fill="#000" opacity="0.35" />
      {/* Ball body */}
      <circle cx="24" cy="23" r="21" fill={`url(#${gradId})`} />
      {/* White number band */}
      <ellipse cx="24" cy="23" rx="9" ry="8.5" fill="white" opacity="0.92" />
      {/* Number */}
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontSize={number >= 10 ? '8' : '10'}
        fontWeight="800"
        fill={color}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {number}
      </text>
      {/* Shine */}
      <circle cx="24" cy="23" r="21" fill={`url(#${shineId})`} />
    </svg>
  )
}
