'use client'

import Link from 'next/link'
import { PLAYER_STYLES, PLAYERS, type PlayerUsername } from '@/lib/game-config'
import PlayerAvatar from '@/components/PlayerAvatar'
import PullToRefresh from '@/components/PullToRefresh'
import {
  ACHIEVEMENTS,
  RARITY_STYLES,
  RARITY_ORDER,
  computeAllAchievements,
  computeAllProgress,
  type Rarity,
} from '@/lib/achievements'

interface Props {
  games: any[]
  shots: any[]
}

export default function AchievementsClient({ games, shots }: Props) {
  const earned      = computeAllAchievements(games, shots)
  const allProgress = computeAllProgress(games, shots)
  const total       = ACHIEVEMENTS.length

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in">
      <PullToRefresh />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #c9a227 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />

        <p className="font-body text-xs tracking-[0.35em] uppercase text-pool-chalk-dim relative">Thonara 2026</p>
        <h1 className="font-heading text-[3.5rem] leading-none tracking-widest text-pool-chalk relative mt-1">ACHIEVEMENTS</h1>
        <p className="font-body text-sm text-pool-chalk-dim mt-2 relative">{total} badges to unlock</p>

        <div className="relative my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-pool-gold/30" />
          <span className="text-xl">🏅</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-pool-gold/30" />
        </div>
      </div>

      {/* ── PLAYER SCOREBOARDS ───────────────────────────────────────── */}
      <section className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {PLAYERS.map(u => {
            const style = PLAYER_STYLES[u]
            const count = earned[u]?.length ?? 0
            const fillPct = Math.round((count / total) * 100)
            return (
              <Link
                key={u}
                href={`/player/${u}`}
                className="bg-pool-surface rounded-2xl border p-3 text-center transition-all hover:border-pool-chalk/20 active:scale-[0.98]"
                style={{ borderColor: `${style.color}33` }}
              >
                <div className="flex justify-center mb-2" style={{ filter: `drop-shadow(0 0 8px ${style.color}44)` }}>
                  <PlayerAvatar username={u} size={44} />
                </div>
                <p className="font-heading text-sm tracking-wide" style={{ color: style.color }}>
                  {style.label.toUpperCase()}
                </p>
                <p className="font-heading text-2xl text-pool-chalk mt-1">
                  {count}
                  <span className="text-base text-pool-chalk-dim">/{total}</span>
                </p>
                <div className="h-1.5 bg-pool-border rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${fillPct}%`, backgroundColor: style.color }} />
                </div>
                <p className="font-body text-[10px] text-pool-chalk-dim mt-1">{fillPct}% complete</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── RECORDS LINK ─────────────────────────────────────────────── */}
      <section className="px-4 pb-6">
        <Link
          href="/records"
          className="flex items-center justify-between w-full bg-pool-surface border border-pool-border rounded-2xl px-5 py-4 hover:border-pool-gold/40 hover:bg-pool-gold/5 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏅</span>
            <div>
              <p className="font-heading text-base tracking-wide text-pool-chalk leading-none">ALL-TIME RECORDS</p>
              <p className="font-body text-xs text-pool-chalk-dim mt-0.5">Hall of fame · best numbers ever</p>
            </div>
          </div>
          <span className="text-pool-chalk-dim text-lg">›</span>
        </Link>
      </section>

      {/* ── ACHIEVEMENT SECTIONS ──────────────────────────────────────── */}
      {RARITY_ORDER.map(rarity => {
        const rarityAchievements = ACHIEVEMENTS.filter(a => a.rarity === rarity)
        const rs = RARITY_STYLES[rarity]
        const earnedCount = rarityAchievements.filter(a =>
          PLAYERS.some(u => earned[u]?.includes(a.id))
        ).length

        return (
          <section key={rarity} className="px-4 pb-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="font-heading text-xs tracking-widest px-2 py-0.5 rounded-full shrink-0"
                style={{ color: rs.color, background: rs.bg, border: `1px solid ${rs.border}` }}
              >
                {rs.label.toUpperCase()}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: rs.border }} />
              <span className="font-body text-xs text-pool-chalk-dim shrink-0">
                {earnedCount}/{rarityAchievements.length} unlocked
              </span>
            </div>

            {/* Achievement cards */}
            <div className="space-y-2">
              {rarityAchievements.map(achievement => {
                const earnedBy = PLAYERS.filter(u => earned[u]?.includes(achievement.id))
                const isUnlocked = earnedBy.length > 0

                return (
                  <div
                    key={achievement.id}
                    className="bg-pool-surface rounded-2xl border p-4 transition-all"
                    style={{
                      borderColor: isUnlocked ? rs.border : '#1f3525',
                      background:  isUnlocked ? rs.bg    : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className={`text-2xl shrink-0 mt-0.5 ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
                        {achievement.icon}
                      </span>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-heading text-base tracking-wide leading-none ${isUnlocked ? 'text-pool-chalk' : 'text-pool-chalk-dim'}`}>
                          {achievement.name.toUpperCase()}
                        </p>
                        <p className="font-body text-xs text-pool-chalk-dim mt-1 leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>

                      {/* Earned-by avatars or lock */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {earnedBy.length > 0 ? (
                          <div className="flex gap-1">
                            {earnedBy.map(u => (
                              <div key={u} style={{ filter: `drop-shadow(0 0 4px ${PLAYER_STYLES[u].color}66)` }}>
                                <PlayerAvatar username={u} size={26} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-pool-border flex items-center justify-center">
                            <span className="text-pool-chalk-dim text-xs">🔒</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Per-player progress */}
                    <div className="mt-3 pt-3 border-t border-pool-border/40 space-y-1.5">
                      {PLAYERS.map(u => {
                        const prog     = allProgress[u]?.[achievement.id]
                        const isEarned = earned[u]?.includes(achievement.id)
                        const style    = PLAYER_STYLES[u]
                        if (!prog) return null

                        // Exclusive badge already claimed by someone else
                        const takenByOther = achievement.exclusive && !isEarned && earnedBy.length > 0
                        if (takenByOther) {
                          return (
                            <div key={u} className="flex items-center gap-2">
                              <span className="font-body text-[10px] w-9 shrink-0 truncate" style={{ color: `${style.color}55` }}>
                                {style.label}
                              </span>
                              <div className="flex-1 h-1 bg-pool-border rounded-full overflow-hidden" />
                              <span className="font-body text-[10px] text-pool-chalk-dim/40 shrink-0 w-14 text-right">Taken</span>
                            </div>
                          )
                        }

                        const pct  = Math.min(100, Math.round((prog.current / prog.target) * 100))
                        const text = isEarned ? '✓' : (prog.label ?? `${prog.current}/${prog.target}`)
                        return (
                          <div key={u} className="flex items-center gap-2">
                            <span className="font-body text-[10px] w-9 shrink-0 truncate" style={{ color: style.color }}>
                              {style.label}
                            </span>
                            <div className="flex-1 h-1 bg-pool-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: isEarned ? style.color : `${style.color}77` }}
                              />
                            </div>
                            <span className="font-body text-[10px] text-pool-chalk-dim shrink-0 w-14 text-right">
                              {text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ── FOOTER NOTE ──────────────────────────────────────────────── */}
      <div className="px-4 pt-2 text-center">
        <p className="font-body text-xs text-pool-chalk-dim/50">
          Badges are awarded automatically as you play. Keep racking up!
        </p>
      </div>
    </div>
  )
}
