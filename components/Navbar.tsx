'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import { getStoredPlayer, clearStoredPlayer } from './PlayerGate'
import PlayerAvatar from './PlayerAvatar'
import ThemeToggle from './ThemeToggle'
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
]

export default function Navbar() {
  const [username, setUsername]         = useState<PlayerUsername | null>(null)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false)
  const [bellOpen, setBellOpen]         = useState(false)
  const [unlocks, setUnlocks]           = useState<AchievementUnlock[]>([])
  const [unlocksLoading, setUnlocksLoading] = useState(true)
  const [newCount, setNewCount]         = useState(0)
  const navRef                          = useRef<HTMLElement>(null)
  const pathname                        = usePathname()

  // Close all menus on navigation
  useEffect(() => {
    setMenuOpen(false)
    setBellOpen(false)
    setPlayerMenuOpen(false)
  }, [pathname])

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
        setPlayerMenuOpen(false)
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
      setUnlocksLoading(false)

      if (computed.length === 0) {
        setNewCount(0)
        return
      }

      const seen = localStorage.getItem(BADGES_SEEN_KEY)
      if (seen === null) {
        localStorage.setItem(BADGES_SEEN_KEY, computed[0].id)
        setNewCount(0)
      } else {
        const idx = computed.findIndex(u => u.id === seen)
        setNewCount(idx === -1 ? computed.length : idx)
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
    setMenuOpen(false)
    setPlayerMenuOpen(false)
    setBellOpen(o => {
      const next = !o
      if (next && unlocks.length > 0) {
        localStorage.setItem(BADGES_SEEN_KEY, unlocks[0].id)
        setNewCount(0)
      }
      return next
    })
  }

  const togglePlayerMenu = () => {
    setMenuOpen(false)
    setBellOpen(false)
    setPlayerMenuOpen(o => !o)
  }

  const toggleMenu = () => {
    setBellOpen(false)
    setPlayerMenuOpen(false)
    setMenuOpen(o => !o)
  }

  const switchPlayer = () => {
    clearStoredPlayer()
    setPlayerMenuOpen(false)
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
                    stroke="rgb(var(--pool-chalk))" strokeWidth="1.5" strokeLinejoin="round"
                  />
                  <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="rgb(var(--pool-chalk))" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {newCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pool-gold flex items-center justify-center animate-pulse-gold">
                    <span className="font-heading text-[10px] leading-none text-pool-bg">
                      {newCount > 9 ? '9+' : newCount}
                    </span>
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-11 w-72 max-w-[calc(100vw-2rem)] bg-pool-surface border border-pool-border rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-pool-border">
                    <p className="font-heading text-sm tracking-widest text-pool-gold">BADGE HISTORY</p>
                    {unlocks.length > 0 && (
                      <span className="font-body text-[10px] tracking-wide text-pool-chalk-dim">
                        {unlocks.length} unlocked
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-pool-border">
                    {unlocksLoading ? (
                      <div className="animate-pulse divide-y divide-pool-border">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3">
                            <div className="w-9 h-9 rounded-lg bg-pool-border shrink-0" />
                            <div className="flex-1 space-y-2 py-0.5">
                              <div className="h-3 bg-pool-border rounded w-3/4" />
                              <div className="h-2.5 bg-pool-border rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : unlocks.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-3xl mb-2">🏅</div>
                        <p className="text-sm font-body text-pool-chalk-dim">
                          No badges unlocked yet — go play!
                        </p>
                      </div>
                    ) : (
                      unlocks.slice(0, 20).map((u, i) => {
                        const badge = ACHIEVEMENTS.find(a => a.id === u.badgeId)
                        const pStyle = PLAYER_STYLES[u.username]
                        const rStyle = badge ? RARITY_STYLES[badge.rarity] : null
                        return (
                          <Link
                            key={u.id}
                            href={`/player/${u.username}`}
                            onClick={() => setBellOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-pool-bg/60 transition-colors ${
                              i < newCount ? 'bg-pool-gold/[0.04]' : ''
                            }`}
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
                            {i < newCount && (
                              <span className="w-1.5 h-1.5 rounded-full bg-pool-gold shrink-0 mt-1.5" />
                            )}
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
            <div className="relative shrink-0">
              {style && username ? (
                <button
                  onClick={togglePlayerMenu}
                  aria-label="Player menu"
                  className="flex items-center gap-2 bg-pool-surface border border-pool-border rounded-xl px-2.5 py-1.5 hover:border-pool-gold/40 transition-all active:scale-95"
                >
                  <PlayerAvatar username={username} size={24} />
                  <span className="font-heading text-sm tracking-wide hidden xs:inline" style={{ color: style.color }}>
                    {style.label.toUpperCase()}
                  </span>
                  {/* Chevron */}
                  <svg
                    width="10" height="10" viewBox="0 0 10 10"
                    className={`transition-transform duration-200 ${playerMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M2 3.5 L5 6.5 L8 3.5" stroke="rgb(var(--pool-chalk-dim))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                /* No player selected — show placeholder chip */
                <div className="flex items-center gap-2 bg-pool-surface border border-dashed border-pool-border rounded-xl px-2.5 py-1.5 opacity-60">
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" fill="rgb(var(--pool-border))" />
                    <circle cx="11" cy="11" r="6" fill="rgb(var(--pool-border))" stroke="#2e4a35" strokeWidth="1" />
                    <text x="11" y="15" textAnchor="middle" fontSize="8" fill="rgb(var(--pool-chalk-dim))" fontFamily="DM Sans, sans-serif" fontWeight="700">?</text>
                  </svg>
                  <span className="font-body text-xs text-pool-chalk-dim hidden xs:inline">Who are you?</span>
                </div>
              )}

              {/* Player dropdown — settings, rules, switch */}
              {playerMenuOpen && username && style && (
                <div className="absolute right-0 top-11 w-60 max-w-[calc(100vw-2rem)] bg-pool-surface border border-pool-border rounded-xl shadow-xl overflow-hidden animate-slide-down z-50">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-pool-border">
                    <PlayerAvatar username={username} size={36} />
                    <div className="min-w-0">
                      <p className="font-heading text-base tracking-widest leading-none" style={{ color: style.color }}>
                        {style.label.toUpperCase()}
                      </p>
                      <p className="font-body text-xs text-pool-chalk-dim mt-1">Currently playing as</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href={`/player/${username}`}
                      onClick={() => setPlayerMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-pool-chalk hover:bg-pool-bg/60 transition-colors"
                    >
                      <span className="text-base w-5 text-center">⚙️</span> Settings
                    </Link>
                    <Link
                      href="/rules"
                      onClick={() => setPlayerMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-pool-chalk hover:bg-pool-bg/60 transition-colors"
                    >
                      <span className="text-base w-5 text-center">📖</span> Rules
                    </Link>
                  </div>
                  <div className="border-t border-pool-border py-1">
                    <ThemeToggle />
                  </div>
                  <div className="border-t border-pool-border py-1">
                    <button
                      onClick={switchPlayer}
                      className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm text-pool-chalk-dim hover:text-pool-red hover:bg-pool-red/10 transition-colors"
                    >
                      <span className="text-base w-5 text-center">🔁</span> Switch player
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={toggleMenu}
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

      {/* ── Mobile collapsible nav menu ── */}
      {menuOpen && (
        <div className="sm:hidden nav-glass border-b border-pool-border/60 animate-slide-down">
          <div className="max-w-lg mx-auto px-3 py-2.5">
            <div className="rounded-xl border border-pool-border overflow-hidden divide-y divide-pool-border">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors active:scale-[0.98] ${
                    pathname === link.href
                      ? 'bg-pool-gold/10 text-pool-gold'
                      : 'text-pool-chalk hover:bg-pool-surface'
                  }`}
                >
                  <span className="text-lg w-6 text-center shrink-0">{link.icon}</span>
                  <span className="font-heading text-base tracking-widest flex-1">{link.label.toUpperCase()}</span>
                  {pathname === link.href && <span className="w-1.5 h-1.5 rounded-full bg-pool-gold shrink-0" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
