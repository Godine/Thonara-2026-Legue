'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-pool-bg/95 backdrop-blur-sm border-b border-pool-border">
      <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-pool-gold text-xl leading-none">⬤</span>
          <span className="font-heading text-lg tracking-widest text-pool-chalk group-hover:text-pool-gold transition-colors">
            THONARA
          </span>
          <span className="font-heading text-lg tracking-widest text-pool-gold">2026</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/history"
            className="px-3 py-1.5 text-sm font-body text-pool-chalk-dim hover:text-pool-chalk transition-colors rounded-lg hover:bg-pool-surface"
          >
            History
          </Link>
          <button
            onClick={signOut}
            className="px-3 py-1.5 text-sm font-body text-pool-chalk-dim hover:text-pool-red transition-colors rounded-lg hover:bg-pool-surface"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
