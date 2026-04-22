export default function RulesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <p className="font-body text-xs tracking-widest uppercase text-pool-chalk-dim mb-1">Reference</p>
        <h1 className="font-heading text-4xl tracking-wider text-pool-chalk">RULES OF POOL</h1>
        <p className="font-body text-sm text-pool-chalk-dim mt-1">English 8-ball — reds &amp; yellows</p>
        <div className="mt-2 h-px bg-gradient-to-r from-pool-gold/40 to-transparent" />
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title} className="bg-pool-surface rounded-2xl border border-pool-border overflow-hidden">
            <div className="px-4 py-3 border-b border-pool-border flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <p className="font-heading text-base tracking-widest text-pool-chalk">{section.title}</p>
            </div>
            <ul className="divide-y divide-pool-border/50">
              {section.rules.map((rule, i) => (
                <li key={i} className="px-4 py-3 flex gap-3">
                  <span className="text-pool-gold font-heading text-sm shrink-0 mt-0.5">·</span>
                  <p className="font-body text-sm text-pool-chalk leading-relaxed">{rule}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Quick ref card */}
      <div className="mt-4 bg-pool-gold/10 border border-pool-gold/30 rounded-2xl p-4">
        <p className="font-heading text-sm tracking-widest text-pool-gold mb-3">⚡ QUICK REFERENCE</p>
        <div className="grid grid-cols-2 gap-2 text-xs font-body">
          {quickRef.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-pool-gold shrink-0">{item.icon}</span>
              <div>
                <p className="text-pool-chalk font-semibold">{item.label}</p>
                <p className="text-pool-chalk-dim">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const sections = [
  {
    icon: '🎱',
    title: 'THE BREAK',
    rules: [
      'The first player breaks from behind the baulk line (the line across the bottom quarter of the table).',
      'If the breaking player pots a ball on the break, they choose which group they want (reds or yellows). If they pot both colours, the table remains open.',
      'If no ball is potted on the break, the other player takes their shot. The table is still open — no groups assigned yet.',
      'Potting the black ball on the break is an automatic loss.',
    ],
  },
  {
    icon: '🔴',
    title: 'BALL GROUPS',
    rules: [
      'There are 7 red balls and 7 yellow balls. Once assigned, you must only pot your own colour.',
      'Groups are assigned to a player after they pot their first ball of a colour on a legal shot.',
      'Until groups are assigned (open table), either player may pot any coloured ball. The potting player then takes that colour.',
      'You must always hit one of your own balls first once groups are assigned.',
    ],
  },
  {
    icon: '⚠️',
    title: 'FOULS',
    rules: [
      'Potting the white ball (in-off) — the opponent receives 2 shots.',
      'Failing to hit any ball with the cue ball.',
      'Hitting an opponent\'s ball first (when groups are assigned).',
      'No ball reaching a cushion after contact (unless a ball is potted).',
      'Jumping the cue ball off the table.',
      'Any ball leaving the table counts as a foul.',
      'Playing out of turn.',
    ],
  },
  {
    icon: '🎯',
    title: 'TWO-SHOT RULE',
    rules: [
      'When a foul is committed, the incoming player is awarded two consecutive shots.',
      'The two shots carry — if the first shot results in a pot, the player still has two shots remaining (they do not get an extra shot for the pot).',
      'During a two-shot visit, the player may pot the black ball on the first shot without losing, as long as all their group balls are already cleared.',
      'The two-shot rule resets if the fouling player commits another foul before the incoming player plays.',
    ],
  },
  {
    icon: '🖤',
    title: 'THE BLACK BALL',
    rules: [
      'You may only attempt to pot the black ball once all 7 of your group balls have been cleared from the table.',
      'If you pot the black ball before clearing your group, you lose the frame immediately.',
      'When playing for the black, you must nominally indicate a pocket (pocket call) — hitting the black into a wrong pocket or potting it off a cushion not in the nominated pocket is a loss.',
      'Potting the black ball legally wins the frame.',
      'Potting the white ball on the same shot as the black ball (or at any time during the black ball shot) is an immediate loss.',
    ],
  },
  {
    icon: '🏆',
    title: 'WINNING',
    rules: [
      'Legally pot the black ball after clearing all 7 of your group balls.',
      'If your opponent fouls on the black ball shot (including potting the white), you win.',
      'In our league: each game won counts as 1 point toward the season standings.',
    ],
  },
]

const quickRef = [
  { icon: '⚪', label: 'White ball foul', value: '2 shots to opponent' },
  { icon: '🔴', label: 'Reds', value: '7 balls to clear' },
  { icon: '🟡', label: 'Yellows', value: '7 balls to clear' },
  { icon: '🖤', label: 'Black', value: 'Last ball — must call pocket' },
  { icon: '❌', label: 'Wrong first hit', value: 'Foul — 2 shots' },
  { icon: '✅', label: 'Win', value: 'Pot black after clearance' },
]
