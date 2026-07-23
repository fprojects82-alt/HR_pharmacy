'use client'

import { useTheme } from '@/components/theme-provider'
import { useLanguage } from '@/lib/i18n/language-provider'
import { useAuthStore } from '@/stores/auth-store'
import { Sun, Moon, Languages } from 'lucide-react'

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { toggleLang, lang, t } = useLanguage()
  const { profile } = useAuthStore()

  const roleLabel = profile?.role === 'admin' ? t('admin') : t('hr')

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--card)]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 sm:px-6">
      <div className="flex-1" />

      <button
        onClick={toggleLang}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Language / اللغة"
      >
        <Languages size={17} />
        <span className="uppercase">{lang === 'ar' ? 'EN' : 'ع'}</span>
      </button>

      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {profile && (
        <div className="flex items-center gap-3 ps-3 border-s border-slate-200 dark:border-slate-800">
          <div className="text-end hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{profile.full_name}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      )}
    </header>
  )
}
