'use client'
import Link from 'next/link'
import { TIP_CATEGORIES, TIP_LEVEL_STYLES, type TipArticle } from '@/lib/tips-content'
import TipImage from './TipImage'
import ArticleCompletion from './ArticleCompletion'
import { useLang, LangToggle } from './LanguageContext'

interface Props {
  tip: TipArticle
  prev: TipArticle | null
  next: TipArticle | null
}

export default function TipArticleContent({ tip, prev, next }: Props) {
  const { lang } = useLang()
  const cat = TIP_CATEGORIES[tip.category]
  const level = TIP_LEVEL_STYLES[tip.level]

  const title    = lang === 'fr' && tip.titleFr    ? tip.titleFr    : tip.title
  const body     = lang === 'fr' && tip.bodyFr     ? tip.bodyFr     : tip.body
  const takeaway = lang === 'fr' && tip.takeawayFr ? tip.takeawayFr : tip.takeaway
  const catLabel = lang === 'fr' && cat.labelFr    ? cat.labelFr    : cat.label
  const lvlLabel = lang === 'fr' && level.labelFr  ? level.labelFr  : level.label

  const prevTitle = prev ? (lang === 'fr' && prev.titleFr ? prev.titleFr : prev.title) : null
  const nextTitle = next ? (lang === 'fr' && next.titleFr ? next.titleFr : next.title) : null

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in px-4">
      {/* Back link + lang toggle */}
      <div className="pt-4 pb-2 flex items-center justify-between">
        <Link href="/tips" className="font-body text-sm text-pool-chalk-dim hover:text-pool-gold transition-colors">
          ‹ Top Tips
        </Link>
        <LangToggle />
      </div>

      {/* Header */}
      <div className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xl">{cat.icon}</span>
          <span className="font-body text-xs tracking-widest uppercase" style={{ color: cat.color }}>
            {catLabel}
          </span>
          <span className="text-pool-chalk-dim text-xs">·</span>
          <span className="font-body text-xs" style={{ color: level.color }}>{lvlLabel}</span>
          <span className="text-pool-chalk-dim text-xs">·</span>
          <span className="font-body text-xs text-pool-chalk-dim">{tip.readMin} min read</span>
        </div>
        <h1 className="font-heading text-3xl tracking-wide text-pool-chalk leading-tight">{title}</h1>
      </div>

      {/* Diagram / illustration */}
      <div className="mb-5" style={{ height: 160 }}>
        <TipImage tip={tip} />
      </div>

      {/* Body */}
      <div className="space-y-4">
        {body.map((p, i) => (
          <p key={i} className="font-body text-sm text-pool-chalk leading-relaxed">{p}</p>
        ))}
      </div>

      {/* Takeaway */}
      <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: `${cat.color}40`, background: `${cat.color}10` }}>
        <p className="font-heading text-xs tracking-widest mb-1" style={{ color: cat.color }}>
          {lang === 'fr' ? 'POINT CLÉ' : 'KEY TAKEAWAY'}
        </p>
        <p className="font-body text-sm text-pool-chalk leading-relaxed">{takeaway}</p>
      </div>

      {/* Completion tracking */}
      <div className="mt-6">
        <ArticleCompletion slug={tip.slug} category={tip.category} />
      </div>

      {/* Prev / Next */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={`/tips/${prev.slug}`} className="card-hover bg-pool-surface rounded-2xl border border-pool-border p-3 active:scale-[0.99]">
            <p className="font-body text-[10px] text-pool-chalk-dim mb-1">‹ {lang === 'fr' ? 'Précédent' : 'Previous'}</p>
            <p className="font-heading text-sm text-pool-chalk leading-tight">{prevTitle}</p>
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/tips/${next.slug}`} className="card-hover bg-pool-surface rounded-2xl border border-pool-border p-3 text-right active:scale-[0.99]">
            <p className="font-body text-[10px] text-pool-chalk-dim mb-1">{lang === 'fr' ? 'Suivant' : 'Next'} ›</p>
            <p className="font-heading text-sm text-pool-chalk leading-tight">{nextTitle}</p>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
