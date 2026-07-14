'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Lang = 'en' | 'fr'

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('thonara_lang') as Lang | null
    if (stored === 'fr' || stored === 'en') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('thonara_lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1 bg-pool-surface border border-pool-border rounded-full px-2 py-1">
      <button
        onClick={() => setLang('en')}
        title="English"
        className={`text-base leading-none rounded-full transition-all px-1 ${lang === 'en' ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70'}`}
      >
        🇬🇧
      </button>
      <button
        onClick={() => setLang('fr')}
        title="Français"
        className={`text-base leading-none rounded-full transition-all px-1 ${lang === 'fr' ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70'}`}
      >
        🇫🇷
      </button>
    </div>
  )
}
