'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer, clearStoredPlayer } from './PlayerGate'
import PlayerBall from './PlayerBall'
import PlayerAvatar from './PlayerAvatar'

const NAV_LINKS = [
  { href: '/achievements', label: 'Badges',   icon: '🏅' },
  { href: '/stats',        label: 'Stats',    icon: '📊' },
  { href: '/history',      label: 'History',  icon: '📅' },
  { href: '/practice',     label: 'Practice', icon: '🎱' },
  { href: '/rules',        label: 'Rules',    icon: '📖' },
]

export default function Navbar() {
  const [username, setUsername]   = useState<PlayerUsername | null>(null)
  const [menuOpen, setMenuOpen]   = useState(false)
  const navRef                    = useRef<HTMLElement>(null)
  const pathname                  = usePathname()

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    setUsername(getStoredPlayer())

    const onStorage = () => setUsername(getStoredPlayer())
    window.addEventListener('storage', onStorage)
    const poll = setInterval(() => setUsername(getStoredPlayer()), 500)

    // Close on outside click
    const onOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)

    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(poll)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [])

  const switchPlayer = () => {
    clearStoredPlayer()
    setMenuOpen(false)
    setUsername(null)
  }

  const style = username ? PLAYER_STYLES[username] : null

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50">
      {/* ── Main bar ── */}
      <div className="h-14 nav-glass border-b border-pool-border/60">
        <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
              <circle cx="9" cy="9" r="9" fill="#c9a227" opacity="0.15" />
              <circle cx="9" cy="9" r="6" fill="#c9a227" opacity="0.4" />
              <circle cx="9" cy="9" r="3.5" fill="#c9a227" />
            </svg>
            <span className="font-heading text-lg tracking-widest text-pool-chalk group-hover:text-pool-gold transition-colors">
              THONARA
            </span>
            <span className="font-heading text-lg tracking-widest text-pool-gold">2026</span>
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop nav links — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg font-body text-sm transition-colors ${
                    pathname === link.href
                      ? 'text-pool-gold bg-pool-gold/10'
                      : 'text-pool-chalk-dim hover:text-pool-chalk hover:bg-pool-surface'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Player chip — always visible */}
            {style && username ? (
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 bg-pool-surface border border-pool-border rounded-xl px-2.5 py-1.5 hover:border-pool-gold/40 transition-all active:scale-95"
              >
                <PlayerAvatar username={username} size={24} />
                <span className="font-heading text-sm tracking-wide hidden xs:inline" style={{ color: style.color }}>
                  {style.label.toUpperCase()}
                </span>
                {/* Chevron */}
                <svg
                  width="10" height="10" viewBox="0 0 10 10"
                  className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 3.5 L5 6.5 L8 3.5" stroke="#7a786f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            ) : (
              /* No player selected — show placeholder chip */
              <div className="flex items-center gap-2 bg-pool-surface border border-dashed border-pool-border rounded-xl px-2.5 py-1.5 opacity-60">
                <svg width="22" height="22" viewBox="0 0 22 22">
                  <circle cx="11" cy="11" r="10" fill="#1f3525" />
                  <circle cx="11" cy="11" r="6" fill="#1f3525" stroke="#2e4a35" strokeWidth="1" />
                  <text x="11" y="15" textAnchor="middle" fontSize="8" fill="#7a786f" fontFamily="DM Sans, sans-serif" fontWeight="700">?</text>
                </svg>
                <span className="font-body text-xs text-pool-chalk-dim hidden xs:inline">Who are you?</span>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="sm:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-pool-surface transition-colors gap-[5px] shrink-0"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`block w-[18px] h-[2px] bg-pool-chalk rounded-full transition-all duration-200 origin-center ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block w-[18px] h-[2px] bg-pool-chalk rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-[18px] h-[2px] bg-pool-chalk rounded-full transition-all duration-200 origin-center ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div className="sm:hidden nav-glass border-b border-pool-border/60 animate-slide-down">
          <div className="max-w-lg mx-auto px-3 py-3 space-y-0.5">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
                  pathname === link.href
                    ? 'bg-pool-gold/10 text-pool-gold'
                    : 'text-pool-chalk hover:bg-pool-surface'
                }`}
              >
                <span className="text-base w-6 text-center">{link.icon}</span>
                <span className="font-heading text-2xl tracking-widest">{link.label.toUpperCase()}</span>
              </Link>
            ))}

            {/* Divider */}
            <div className="h-px bg-pool-border mx-4 my-2" />

            {/* Player section */}
            {username && style ? (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar username={username} size={36} />
                  <div>
                    <p className="font-heading text-lg tracking-widest" style={{ color: style.color }}>
                      {style.label.toUpperCase()}
                    </p>
                    <p className="font-body text-xs text-pool-chalk-dim">Currently playing as</p>
                  </div>
                </div>
                <button
                  onClick={switchPlayer}
                  className="text-xs font-body text-pool-chalk-dim hover:text-pool-red transition-colors px-3 py-1.5 rounded-lg hover:bg-pool-red/10"
                >
                  Switch
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <p className="font-body text-sm text-pool-chalk-dim text-center">
                  Tap a player ball to identify yourself
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
