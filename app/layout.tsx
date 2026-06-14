import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import PlayerGate from '@/components/PlayerGate'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import OfflineBanner from '@/components/OfflineBanner'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Thonara League',
  description: 'Pool league tracker — Adib, Ahmed & Amine',
  appleWebApp: {
    capable: true,
    title: 'Thonara League',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#060d08',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply stored theme before first paint to avoid a flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('thonara_theme')==='light'){document.documentElement.classList.add('light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#f4f1ea')}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <PlayerGate />
        <Navbar />
        <OfflineBanner />
        <main className="min-h-dvh pt-14">
          {children}
        </main>
      </body>
    </html>
  )
}
