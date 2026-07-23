'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translations, type Lang } from './translations'

interface LanguageContextValue {
  lang: Lang
  dir: 'rtl' | 'ltr'
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: keyof typeof translations.ar) => string
  tm: (key: keyof typeof translations.ar) => readonly string[]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('lang')) as Lang | null
    if (stored === 'ar' || stored === 'en') setLangState(stored)
  }, [])

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem('lang', l)
  }, [])

  const toggleLang = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang])

  const t = useCallback(
    (key: keyof typeof translations.ar) => {
      const val = translations[lang][key]
      return typeof val === 'string' ? val : String(key)
    },
    [lang]
  )

  const tm = useCallback(
    (key: keyof typeof translations.ar) => {
      const val = translations[lang][key]
      return Array.isArray(val) ? val : []
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, toggleLang, t, tm }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
