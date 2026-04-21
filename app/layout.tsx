import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Thonara 2026 League',
  description: 'Pool league tracker — Adib, Shin & Godine',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#060d08',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <main className="min-h-dvh pt-14">
          {children}
        </main>
      </body>
    </html>
  )
}
