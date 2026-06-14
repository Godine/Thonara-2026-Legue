'use client'

import { useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'thonara_theme'

type Theme = 'light' | 'dark'

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f1ea' : '#060d08')
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
    applyTheme(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm text-pool-chalk hover:bg-pool-bg/60 transition-colors"
    >
      <span className="text-base w-5 text-center">{theme === 'light' ? '☀️' : '🌙'}</span>
      <span className="flex-1 text-left">{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
      <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-pool-border transition-colors shrink-0">
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-pool-gold transition-transform ${
            theme === 'light' ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
    </button>
  )
}
