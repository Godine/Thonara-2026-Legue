import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  TIP_ARTICLES,
  TIP_CATEGORIES,
  TIP_LEVEL_STYLES,
  getTipBySlug,
} from '@/lib/tips-content'
import TipImage from '@/components/tips/TipImage'
import ArticleCompletion from '@/components/tips/ArticleCompletion'

export function generateStaticParams() {
  return TIP_ARTICLES.map(t => ({ slug: t.slug }))
}

export default function TipArticlePage({ params }: { params: { slug: string } }) {
  const tip = getTipBySlug(params.slug)
  if (!tip) notFound()

  const idx = TIP_ARTICLES.findIndex(t => t.slug === tip.slug)
  const prev = TIP_ARTICLES[idx - 1]
  const next = TIP_ARTICLES[idx + 1]
  const cat = TIP_CATEGORIES[tip.category]
  const level = TIP_LEVEL_STYLES[tip.level]

  return (
    <div className="max-w-lg mx-auto pb-16 animate-fade-in px-4">
      {/* Back link */}
      <div className="pt-4 pb-2">
        <Link href="/tips" className="font-body text-sm text-pool-chalk-dim hover:text-pool-gold transition-colors">
          ‹ Top Tips
        </Link>
      </div>

      {/* Header */}
      <div className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xl">{cat.icon}</span>
          <span className="font-body text-xs tracking-widest uppercase" style={{ color: cat.color }}>
            {cat.label}
          </span>
          <span className="text-pool-chalk-dim text-xs">·</span>
          <span className="font-body text-xs" style={{ color: level.color }}>{level.label}</span>
          <span className="text-pool-chalk-dim text-xs">·</span>
          <span className="font-body text-xs text-pool-chalk-dim">{tip.readMin} min read</span>
        </div>
        <h1 className="font-heading text-3xl tracking-wide text-pool-chalk leading-tight">{tip.title}</h1>
      </div>

      {/* Diagram / illustration */}
      <div className="mb-5" style={{ height: 160 }}>
        <TipImage tip={tip} />
      </div>

      {/* Body */}
      <div className="space-y-4">
        {tip.body.map((p, i) => (
          <p key={i} className="font-body text-sm text-pool-chalk leading-relaxed">{p}</p>
        ))}
      </div>

      {/* Takeaway */}
      <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: `${cat.color}40`, background: `${cat.color}10` }}>
        <p className="font-heading text-xs tracking-widest mb-1" style={{ color: cat.color }}>KEY TAKEAWAY</p>
        <p className="font-body text-sm text-pool-chalk leading-relaxed">{tip.takeaway}</p>
      </div>

      {/* Completion tracking */}
      <div className="mt-6">
        <ArticleCompletion slug={tip.slug} category={tip.category} />
      </div>

      {/* Prev / Next */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={`/tips/${prev.slug}`} className="card-hover bg-pool-surface rounded-2xl border border-pool-border p-3 active:scale-[0.99]">
            <p className="font-body text-[10px] text-pool-chalk-dim mb-1">‹ Previous</p>
            <p className="font-heading text-sm text-pool-chalk leading-tight">{prev.title}</p>
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/tips/${next.slug}`} className="card-hover bg-pool-surface rounded-2xl border border-pool-border p-3 text-right active:scale-[0.99]">
            <p className="font-body text-[10px] text-pool-chalk-dim mb-1">Next ›</p>
            <p className="font-heading text-sm text-pool-chalk leading-tight">{next.title}</p>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
