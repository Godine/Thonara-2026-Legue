interface PlayerBallProps {
  number: number
  color: string
  size?: number
  className?: string
}

export default function PlayerBall({ number, color, size = 48, className = '' }: PlayerBallProps) {
  const uid = `b${number}${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label={`Ball ${number}`}
    >
      <defs>
        {/* Main sphere gradient — light from upper-left */}
        <radialGradient id={`g${uid}`} cx="34%" cy="26%" r="76%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="18%"  stopColor={color}   stopOpacity="1" />
          <stop offset="68%"  stopColor={color}   stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.60" />
        </radialGradient>

        {/* Tight specular highlight — bright point light reflection */}
        <radialGradient id={`s${uid}`} cx="30%" cy="21%" r="16%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Broad fill-light from lower right */}
        <radialGradient id={`f${uid}`} cx="65%" cy="75%" r="45%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Edge ambient occlusion — darkens the rim */}
        <radialGradient id={`a${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="65%"  stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </radialGradient>

        {/* Number oval inner shadow */}
        <radialGradient id={`n${uid}`} cx="50%" cy="65%" r="55%">
          <stop offset="0%"   stopColor="#000000" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Table contact shadow */}
      <ellipse cx="24" cy="46.5" rx="10" ry="1.8" fill="#000000" opacity="0.38" />

      {/* Ball body */}
      <circle cx="24" cy="22" r="21" fill={`url(#g${uid})`} />

      {/* Ambient occlusion ring */}
      <circle cx="24" cy="22" r="21" fill={`url(#a${uid})`} />

      {/* Number band */}
      <ellipse cx="24" cy="22" rx="10.5" ry="9.2" fill="white" opacity="0.93" />
      <ellipse cx="24" cy="22" rx="10.5" ry="9.2" fill={`url(#n${uid})`} />

      {/* Number text */}
      <text
        x="24"
        y="26.8"
        textAnchor="middle"
        fontSize={number >= 10 ? '8.5' : '11'}
        fontWeight="800"
        fill={color}
        fontFamily="DM Sans, Inter, system-ui, sans-serif"
        letterSpacing="-0.3"
      >
        {number}
      </text>

      {/* Specular highlight overlay */}
      <circle cx="24" cy="22" r="21" fill={`url(#s${uid})`} />

      {/* Fill-light from lower right */}
      <circle cx="24" cy="22" r="21" fill={`url(#f${uid})`} />
    </svg>
  )
}
