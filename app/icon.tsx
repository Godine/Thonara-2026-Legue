import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

// The icon: a pool ball with "T" monogram and three player-colour tints
// — gold (Adib) / blue (Ahmed) / red (Amine) — divided pizza-style
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
          background: 'radial-gradient(circle at 40% 35%, #0e1e12 0%, #060d08 100%)',
          position: 'relative',
        }}
      >
        {/* Gold outer ring */}
        <div
          style={{
            width: 456,
            height: 456,
            borderRadius: 9999,
            background: 'linear-gradient(145deg, #e8c547 0%, #c9a227 48%, #a07820 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Dark gap ring */}
          <div
            style={{
              width: 438,
              height: 438,
              borderRadius: 9999,
              background: '#060d08',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Ball body */}
            <div
              style={{
                width: 422,
                height: 422,
                borderRadius: 9999,
                background: 'radial-gradient(circle at 34% 28%, #2d2d2d 0%, #0f0f0f 50%, #000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Pizza-slice colour tints — three player colours */}
              <div style={{ position: 'absolute', top: 0, left: 0,     width: '34%', height: '54%', background: 'linear-gradient(to bottom right, rgba(245,197,24,0.40), rgba(245,197,24,0))',   display: 'flex' }} />
              <div style={{ position: 'absolute', top: 0, left: '33%', width: '34%', height: '54%', background: 'linear-gradient(to bottom,       rgba(96,165,250,0.30),  rgba(96,165,250,0))',   display: 'flex' }} />
              <div style={{ position: 'absolute', top: 0, right: 0,    width: '34%', height: '54%', background: 'linear-gradient(to bottom left,  rgba(248,113,113,0.40), rgba(248,113,113,0))', display: 'flex' }} />

              {/* Specular highlight */}
              <div style={{ position: 'absolute', top: '9%', left: '20%', width: '30%', height: '22%', borderRadius: 9999, background: 'rgba(255,255,255,0.20)', display: 'flex' }} />

              {/* White number oval */}
              <div
                style={{
                  width: 192,
                  height: 168,
                  borderRadius: 9999,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 110, fontWeight: 900, color: '#000000', fontFamily: 'sans-serif', lineHeight: 1 }}>
                  T
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three player dots — rack formation hint */}
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: 9999, background: '#f5c518', border: '2.5px solid rgba(0,0,0,0.5)', display: 'flex' }} />
          <div style={{ width: 26, height: 26, borderRadius: 9999, background: '#60a5fa', border: '2.5px solid rgba(0,0,0,0.5)', display: 'flex' }} />
          <div style={{ width: 26, height: 26, borderRadius: 9999, background: '#f87171', border: '2.5px solid rgba(0,0,0,0.5)', display: 'flex' }} />
        </div>
      </div>
    ),
    { ...size },
  )
}
