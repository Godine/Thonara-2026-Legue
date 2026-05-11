import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          position: 'relative',
        }}
      >

        {/* ── OUTER AURA — soft gold glow radiating behind the ring ── */}
        <div style={{
          position: 'absolute',
          width: 512, height: 512,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 42%, rgba(201,162,39,0.22) 50%, rgba(201,162,39,0.10) 60%, rgba(201,162,39,0.03) 70%, transparent 78%)',
          display: 'flex',
        }} />

        {/* ── GOLD RING — metallic gradient border ── */}
        <div style={{
          position: 'absolute',
          width: 490, height: 490,
          borderRadius: '50%',
          background: 'conic-gradient(from 130deg, #f0d060, #e8c547 12%, #c9a227 30%, #a07820 52%, #c9a227 68%, #e8c547 82%, #f0d060 92%, #e8c547)',
          display: 'flex',
        }} />

        {/* ── THIN DARK GAP — separates ring from ball ── */}
        <div style={{
          position: 'absolute',
          width: 474, height: 474,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
        }} />

        {/* ── BALL — layered sphere shading ── */}
        <div style={{
          position: 'absolute',
          width: 462, height: 462,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 33% 28%, #2a2a2a 0%, #161616 22%, #080808 56%, #000000 100%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Player colour auroras — iridescent sheen at crown */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '46%', height: '52%', background: 'radial-gradient(ellipse at 20% 16%, rgba(245,197,24,0.24) 0%, transparent 65%)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: 0, left: '27%', width: '46%', height: '44%', background: 'radial-gradient(ellipse at 50% 6%, rgba(96,165,250,0.18) 0%, transparent 62%)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '46%', height: '52%', background: 'radial-gradient(ellipse at 80% 16%, rgba(248,113,113,0.24) 0%, transparent 65%)', display: 'flex' }} />

          {/* Ambient occlusion — deep shadow at equator and bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.20) 60%, transparent 100%)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: '16%', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.18) 0%, transparent 100%)', display: 'flex' }} />

          {/* Primary specular — large soft bloom, upper-left */}
          <div style={{
            position: 'absolute', top: '6%', left: '13%',
            width: '40%', height: '28%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.30) 35%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }} />

          {/* Secondary specular — sharp bright dot */}
          <div style={{
            position: 'absolute', top: '10%', left: '19%',
            width: '13%', height: '9%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 42% 36%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.50) 42%, transparent 74%)',
            display: 'flex',
          }} />

          {/* Tertiary micro-specular — tiny glint */}
          <div style={{
            position: 'absolute', top: '8%', left: '32%',
            width: '5%', height: '3.5%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.80) 0%, transparent 80%)',
            display: 'flex',
          }} />

          {/* Rim light — thin bright line on upper-left edge */}
          <div style={{
            position: 'absolute', top: '1.5%', left: '1.5%',
            width: '97%', height: '97%',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.07)',
            display: 'flex',
          }} />

          {/* ── WHITE NUMBER CIRCLE ── */}
          <div style={{
            width: 194, height: 194,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #ffffff 0%, #f5f5f5 50%, #ececec 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Subtle inner shadow ring */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              border: '3px solid rgba(0,0,0,0.06)',
              display: 'flex',
            }} />
            <div style={{
              fontSize: 122,
              fontWeight: 900,
              color: '#090909',
              fontFamily: 'sans-serif',
              lineHeight: 1,
              letterSpacing: '-2px',
            }}>
              8
            </div>
          </div>
        </div>

        {/* ── CONTACT SHADOW — grounds the ball on transparent bg ── */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '72%', height: '6%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, transparent 75%)',
          display: 'flex',
        }} />

      </div>
    ),
    { ...size },
  )
}
