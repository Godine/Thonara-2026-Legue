'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer, clearStoredPlayer } from './PlayerGate'
import PlayerBall from './PlayerBall'
import PlayerAvatar from './PlayerAvatar'
import { createClient } from '@/lib/supabase/client'
import { fetchCompletedGames, fetchAllShots } from '@/lib/queries'
import { ACHIEVEMENTS, RARITY_STYLES, computeAchievementUnlocks, type AchievementUnlock } from '@/lib/achievements'

const BADGES_SEEN_KEY = 'thonara_badges_seen'

const NAV_LINKS = [
  { href: '/achievements', label: 'Badges',     icon: '🏅' },
  { href: '/stats',        label: 'Stats',      icon: '📊' },
  { href: '/history',      label: 'History',    icon: '📅' },
  { href: '/challenges',   label: 'Challenges', icon: '💰' },
  { href: '/practice',     label: 'Practice',   icon: '🎱' },
  { href: '/rules',        label: 'Rules',      icon: '📖' },
]

export default function Navbar() {
  const [username, setUsername]   = useState<PlayerUsername | null>(null)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const [unlocks, setUnlocks]     = useState<AchievementUnlock[]>([])
  const [hasNew, setHasNew]       = useState(false)
  const navRef                    = useRef<HTMLElement>(null)
  const pathname                  = usePathname()

  // Close menus on navigation
  useEffect(() => { setMenuOpen(false); setBellOpen(false) }, [pathname])

  useEffect(() => {
    setUsername(getStoredPlayer())

    const onStorage = () => setUsername(getStoredPlayer())
    window.addEventListener('storage', onStorage)
    const poll = setInterval(() => setUsername(getStoredPlayer()), 500)

    // Close on outside click
    const onOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)

    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(poll)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [])

  // Fetch + recompute badge unlock history (live)
  useEffect(() => {
    const db = createClient()
    let cancelled = false

    const load = async () => {
      const [games, shots] = await Promise.all([fetchCompletedGames(db), fetchAllShots(db)])
      if (cancelled) return
      const computed = computeAchievementUnlocks(games as any, shots as any)
      setUnlocks(computed)

      if (computed.length > 0) {
        const seen = localStorage.getItem(BADGES_SEEN_KEY)
        if (seen === null) {
          localStorage.setItem(BADGES_SEEN_KEY, computed[0].id)
          setHasNew(false)
        } else {
          setHasNew(seen !== computed[0].id)
        }
      }
    }
    load()

    const channel = db
      .channel('navbar-badge-unlocks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, load)
      .subscribe()

    return () => {
      cancelled = true
      db.removeChannel(channel)
    }
  }, [])

  const toggleBell = () => {
    setBellOpen(o => {
      const next = !o
      if (next && unlocks.length > 0) {
        localStorage.setItem(BADGES_SEEN_KEY, unlocks[0].id)
        setHasNew(false)
      }
      return next
    })
  }

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
            <span className="font-heading text-lg tracking-widest text-pool-gold">LEAGUE</span>
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

            {/* Notification bell — badge unlock history */}
            <div className="relative shrink-0">
              <button
                onClick={toggleBell}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-pool-surface transition-colors"
                aria-label="Badge unlock history"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a6 6 0 0 0-6 6v3.09c0 .58-.23 1.14-.64 1.55L4 14h16l-1.36-1.36a2.2 2.2 0 0 1-.64-1.55V8a6 6 0 0 0-6-6Z"
                    stroke="#f0ede6" strokeWidth="1.5" strokeLinejoin="round"
                  />
                  <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="#f0ede6" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {hasNew && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pool-gold animate-pulse-gold" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-11 w-72 max-w-[calc(100vw-2rem)] bg-pool-surface border border-pool-border rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
                  <div className="px-4 py-3 border-b border-pool-border">
                    <p className="font-heading text-sm tracking-widest text-pool-gold">BADGE HISTORY</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-pool-border">
                    {unlocks.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm font-body text-pool-chalk-dim">
                        No badges unlocked yet — go play!
                      </p>
                    ) : (
                      unlocks.slice(0, 20).map(u => {
                        const badge = ACHIEVEMENTS.find(a => a.id === u.badgeId)
                        const pStyle = PLAYER_STYLES[u.username]
                        const rStyle = badge ? RARITY_STYLES[badge.rarity] : null
                        return (
                          <Link
                            key={u.id}
                            href={`/player/${u.username}`}
                            onClick={() => setBellOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-pool-bg/60 transition-colors"
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                              style={{ background: rStyle?.bg, border: `1px solid ${rStyle?.border}` }}
                            >
                              {badge?.icon ?? '🏅'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm text-pool-chalk leading-snug">
                                <span style={{ color: pStyle.color }} className="font-semibold">{pStyle.label}</span>
                                {' '}unlocked <span className="text-pool-gold">{badge?.name ?? u.badgeId}</span>
                              </p>
                              <p className="text-xs font-body text-pool-chalk-dim mt-0.5">
                                {u.sessionDate ? format(new Date(u.sessionDate + 'T12:00:00'), 'MMM d, yyyy') : ''} · Game {u.gameNumber}
                              </p>
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                  <Link
                    href="/achievements"
                    onClick={() => setBellOpen(false)}
                    className="block px-4 py-3 text-center text-sm font-body text-pool-gold hover:bg-pool-bg/60 transition-colors border-t border-pool-border"
                  >
                    View all badges →
                  </Link>
                </div>
              )}
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
