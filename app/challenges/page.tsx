export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { fetchAllSessions } from '@/lib/queries'
import Link from 'next/link'
import PullToRefresh from '@/components/PullToRefresh'
import PlayerAvatar from '@/components/PlayerAvatar'
import { format } from 'date-fns'
import { PLAYER_STYLES, type PlayerUsername } from '@/lib/game-config'
import type { Player } from '@/types/database'
import type { SessionFull } from '@/lib/queries/sessions'
import { computeSessionStakes, computeCueRace, STAKES_DH, type SessionStake } from '@/lib/challenges'

const RANK_BADGES = ['🥇', '🥈', '🥉']
const RANK_LABELS = ['Eats free', 'Pays the table', 'Buys the meal']

export default async function ChallengesPage() {
  const sessions = await fetchAllSessions(createClient(), 200)

  const allPlayers: Record<string, Player> = {}
  for (const s of sessions) {
    for (const g of s.games) {
      if (g.player1) allPlayers[g.player1.id] = g.player1
      if (g.player2) allPlayers[g.player2.id] = g.player2
    }
  }

  const stakedSessions = sessions
    .map(session => ({ session, stakes: computeSessionStakes(session) }))
    .filter((x): x is { session: SessionFull; stakes: SessionStake[] } => x.stakes !== null)

  const [latest, ...history] = stakedSessions

  const currentYear = new Date().getFullYear()
  const cueRace = computeCueRace(sessions, currentYear, allPlayers)
  const leaderWins = cueRace[0]?.wins ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <PullToRefresh />

      <div className="mb-6">
        <Link href="/" className="text-pool-chalk-dim text-sm font-body hover:text-pool-gold transition-colors">
          ← Home
        </Link>
        <div className="mt-3">
          <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">CHALLENGES</h1>
          <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
        </div>
      </div>

      {/* ── Race for the Cue ─────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHeader title="RACE FOR THE CUE" />
        <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mt-3">
          <div className="flex items-start gap-2.5 px-4 pt-3 pb-3">
            <span className="text-lg shrink-0">🎯</span>
            <p className="font-body text-xs text-pool-chalk-dim leading-snug">
              Most game wins by Dec 31, {currentYear} takes home a professional pool cue.
            </p>
          </div>
          {cueRace.length === 0 ? (
            <p className="px-4 pb-4 text-center font-body text-sm text-pool-chalk-dim">
              No games played yet this year.
            </p>
          ) : (
            <div className="divide-y divide-pool-border border-t border-pool-border">
              {cueRace.map((entry, i) => {
                const style = PLAYER_STYLES[entry.player.username as PlayerUsername]
                const pct = leaderWins > 0 ? Math.round((entry.wins / leaderWins) * 100) : 0
                return (
                  <div key={entry.player.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-base w-5 text-center select-none shrink-0">
                      {entry.wins > 0 ? RANK_BADGES[i] ?? `${i + 1}.` : '—'}
                    </span>
                    <PlayerAvatar username={entry.player.username as PlayerUsername} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-sm tracking-wide leading-none" style={{ color: style?.color }}>
                        {style?.label.toUpperCase() ?? entry.player.display_name.toUpperCase()}
                      </p>
                      <div className="w-full h-1.5 bg-pool-border rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: style?.color }}
                        />
                      </div>
                    </div>
                    <span
                      className="font-heading text-2xl leading-none shrink-0"
                      style={{ color: i === 0 && entry.wins > 0 ? style?.color : undefined }}
                    >
                      {entry.wins}
                      <span className="font-body text-xs text-pool-chalk-dim ml-1">W</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Latest session stakes ───────────────────────────────────── */}
      <section className="mb-8">
        <SectionHeader title="LATEST SESSION" />
        {!latest ? (
          <div className="text-center py-10 bg-pool-surface rounded-2xl border border-pool-border mt-3">
            <div className="text-4xl mb-2">👀</div>
            <p className="font-body text-sm text-pool-chalk-dim">Finish a session to see who pays up</p>
          </div>
        ) : (
          <div className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden mt-3">
            <div className="flex items-center justify-between px-4 py-3 border-b border-pool-border">
              <p className="font-heading text-base tracking-wider text-pool-chalk">
                {format(new Date(latest.session.date + 'T12:00:00'), 'EEE, MMM d').toUpperCase()}
              </p>
              <Link
                href={`/session/${latest.session.id}`}
                className="text-xs font-body text-pool-gold hover:text-pool-gold-light transition-colors"
              >
                View →
              </Link>
            </div>
            <div className="divide-y divide-pool-border">
              {latest.stakes.map(stake => (
                <StakeRow key={stake.player.id} stake={stake} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionHeader title="HOW IT WORKS" />
        <div className="bg-pool-surface rounded-2xl border border-pool-border p-4 mt-3 space-y-3.5">
          <Rule icon="🥇" label="1st place" desc="Eats free — the others cover the meal." />
          <Rule icon="🥈" label="2nd place" desc={`Pays ${STAKES_DH[1]} DH — covers the pool table fee.`} />
          <Rule icon="🥉" label="3rd place" desc={`Pays ${STAKES_DH[2]} DH — covers the winner's meal.`} />
          <div className="h-px bg-pool-border" />
          <Rule icon="🎱" label="Ties" desc="Broken by total balls potted across the session." />
          <Rule icon="🏆" label="Race for the cue" desc="Most wins by Dec 31 takes home a professional pool cue." />
        </div>
      </section>

      {/* ── Past sessions ────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section>
          <SectionHeader title="PAST SESSIONS" />
          <div className="space-y-2 mt-3">
            {history.map(({ session, stakes }) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="flex items-center gap-3 bg-pool-surface rounded-xl border border-pool-border px-4 py-3 hover:border-pool-gold/30 transition-colors"
              >
                <p className="flex-1 min-w-0 font-heading text-sm tracking-wider text-pool-chalk">
                  {format(new Date(session.date + 'T12:00:00'), 'EEE, MMM d').toUpperCase()}
                </p>
                <div className="flex items-center gap-2.5 shrink-0">
                  {stakes.map(stake => {
                    const amountClass =
                      stake.amount === 0 ? 'text-pool-green-bright'
                      : stake.amount === STAKES_DH[1] ? 'text-pool-gold'
                      : 'text-pool-red'
                    return (
                      <div key={stake.player.id} className="flex items-center gap-1">
                        <PlayerAvatar username={stake.player.username as PlayerUsername} size={20} />
                        <span className={`font-body text-xs tabular-nums ${amountClass}`}>
                          {stake.amount === 0 ? 'FREE' : stake.amount}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-heading text-xl tracking-widest text-pool-gold">{title}</h2>
      <div className="flex-1 h-px bg-pool-border" />
    </div>
  )
}

function StakeRow({ stake }: { stake: SessionStake }) {
  const style = PLAYER_STYLES[stake.player.username as PlayerUsername]
  const amountClass =
    stake.amount === 0 ? 'text-pool-green-bright'
    : stake.amount === STAKES_DH[1] ? 'text-pool-gold'
    : 'text-pool-red'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-base w-5 text-center select-none shrink-0">
        {RANK_BADGES[stake.rank] ?? `${stake.rank + 1}.`}
      </span>
      <PlayerAvatar username={stake.player.username as PlayerUsername} size={36} />
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm tracking-wide leading-none" style={{ color: style?.color }}>
          {style?.label.toUpperCase() ?? stake.player.display_name.toUpperCase()}
        </p>
        <p className="font-body text-xs text-pool-chalk-dim mt-1">
          {stake.wins}W · {RANK_LABELS[stake.rank] ?? ''}
        </p>
      </div>
      <span className={`font-heading text-xl leading-none shrink-0 ${amountClass}`}>
        {stake.amount === 0 ? 'FREE' : `${stake.amount} DH`}
      </span>
    </div>
  )
}

function Rule({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="font-heading text-sm tracking-wide text-pool-chalk">{label}</p>
        <p className="font-body text-xs text-pool-chalk-dim mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
