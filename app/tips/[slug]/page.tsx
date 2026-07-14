import { notFound } from 'next/navigation'
import { TIP_ARTICLES, getTipBySlug } from '@/lib/tips-content'
import TipArticleContent from '@/components/tips/TipArticleContent'

export function generateStaticParams() {
  return TIP_ARTICLES.map(t => ({ slug: t.slug }))
}

export default function TipArticlePage({ params }: { params: { slug: string } }) {
  const tip = getTipBySlug(params.slug)
  if (!tip) notFound()

  const idx  = TIP_ARTICLES.findIndex(t => t.slug === tip.slug)
  const prev = TIP_ARTICLES[idx - 1] ?? null
  const next = TIP_ARTICLES[idx + 1] ?? null

  return <TipArticleContent tip={tip} prev={prev} next={next} />
}
