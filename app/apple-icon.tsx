import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Proportionally scaled from the 512px icon (scale ≈ 0.352)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          position: 'relative',
        }}
      >

        {/* Outer aura */}
        <div style={{
          position: 'absolute',
          width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 42%, rgba(201,162,39,0.22) 50%, rgba(201,162,39,0.10) 60%, rgba(201,162,39,0.03) 70%, transparent 78%)',
          display: 'flex',
        }} />

        {/* Gold ring */}
        <div style={{
          position: 'absolute',
          width: 172, height: 172,
          borderRadius: '50%',
          background: 'linear-gradient(140deg, #f0d060 0%, #e8c547 18%, #c9a227 42%, #a07820 58%, #c9a227 76%, #e8c547 90%, #f0d060 100%)',
          display: 'flex',
        }} />

        {/* Dark gap */}
        <div style={{
          position: 'absolute',
          width: 167, height: 167,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
        }} />

        {/* Ball */}
        <div style={{
          position: 'absolute',
          width: 163, height: 163,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 33% 28%, #2a2a2a 0%, #161616 22%, #080808 56%, #000000 100%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Auroras */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '46%', height: '52%', background: 'radial-gradient(ellipse at 20% 16%, rgba(245,197,24,0.24) 0%, transparent 65%)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: 0, left: '27%', width: '46%', height: '44%', background: 'radial-gradient(ellipse at 50% 6%, rgba(96,165,250,0.18) 0%, transparent 62%)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '46%', height: '52%', background: 'radial-gradient(ellipse at 80% 16%, rgba(248,113,113,0.24) 0%, transparent 65%)', display: 'flex' }} />

          {/* Ambient occlusion */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.20) 60%, transparent 100%)', display: 'flex' }} />

          {/* Primary specular */}
          <div style={{
            position: 'absolute', top: '6%', left: '13%',
            width: '40%', height: '28%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.30) 35%, rgba(255,255,255,0) 70%)',
            display: 'flex',
          }} />

          {/* Secondary specular */}
          <div style={{
            position: 'absolute', top: '10%', left: '19%',
            width: '13%', height: '9%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 42% 36%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.50) 42%, transparent 74%)',
            display: 'flex',
          }} />

          {/* Rim light */}
          <div style={{
            position: 'absolute', top: '1.5%', left: '1.5%',
            width: '97%', height: '97%',
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.07)',
            display: 'flex',
          }} />

          {/* White circle */}
          <div style={{
            width: 68, height: 68,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #ffffff 0%, #f5f5f5 50%, #ececec 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 43,
              fontWeight: 900,
              color: '#090909',
              fontFamily: 'sans-serif',
              lineHeight: 1,
              letterSpacing: '-1px',
            }}>
              8
            </div>
          </div>
        </div>

        {/* Contact shadow */}
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
