import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Apple touch icon — same design, optimised for 180×180
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
          background: 'radial-gradient(circle at 40% 35%, #0e1e12 0%, #060d08 100%)',
          position: 'relative',
        }}
      >
        {/* Gold ring */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 9999,
            background: 'linear-gradient(145deg, #e8c547 0%, #c9a227 48%, #a07820 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 154,
              height: 154,
              borderRadius: 9999,
              background: '#060d08',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Ball */}
            <div
              style={{
                width: 148,
                height: 148,
                borderRadius: 9999,
                background: 'radial-gradient(circle at 34% 28%, #2d2d2d 0%, #0f0f0f 50%, #000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0,     width: '34%', height: '54%', background: 'linear-gradient(to bottom right, rgba(245,197,24,0.40), rgba(245,197,24,0))',   display: 'flex' }} />
              <div style={{ position: 'absolute', top: 0, left: '33%', width: '34%', height: '54%', background: 'linear-gradient(to bottom,       rgba(96,165,250,0.30),  rgba(96,165,250,0))',   display: 'flex' }} />
              <div style={{ position: 'absolute', top: 0, right: 0,    width: '34%', height: '54%', background: 'linear-gradient(to bottom left,  rgba(248,113,113,0.40), rgba(248,113,113,0))', display: 'flex' }} />
              <div style={{ position: 'absolute', top: '9%', left: '18%', width: '30%', height: '22%', borderRadius: 9999, background: 'rgba(255,255,255,0.20)', display: 'flex' }} />
              <div style={{ width: 68, height: 58, borderRadius: 9999, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: '#000000', fontFamily: 'sans-serif', lineHeight: 1 }}>T</div>
              </div>
            </div>
          </div>
        </div>

        {/* Three dots */}
        <div style={{ position: 'absolute', bottom: 8, display: 'flex', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#f5c518', display: 'flex' }} />
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#60a5fa', display: 'flex' }} />
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#f87171', display: 'flex' }} />
        </div>
      </div>
    ),
    { ...size },
  )
}
