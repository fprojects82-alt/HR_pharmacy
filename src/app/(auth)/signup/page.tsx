'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Sun, Moon, Languages, ShieldCheck, Briefcase } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-provider'
import { useTheme } from '@/components/theme-provider'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'hr' | 'admin'>('hr')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t, toggleLang, lang } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup`
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j.error) { setError(t('signupFailed') + (j.error || res.statusText)); setLoading(false); return }
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(t('signupFailed') + String(err))
      setLoading(false)
    }
  }

  const roleBtn = (r: 'hr' | 'admin', icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setRole(r)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
        role === r
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] end-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] start-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="absolute top-4 end-4 flex items-center gap-2">
        <button onClick={toggleLang} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Languages size={16} /> {lang === 'ar' ? 'EN' : 'ع'}
        </button>
        <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md relative animate-fade-up">
        <div className="bg-[var(--card)] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
              <span className="text-white text-2xl font-bold">ن</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('signup')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t('appFull')}</p>
          </div>

          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-4 rounded-xl text-sm text-center">
              {t('signupPending')}
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('accountType')}</label>
                <div className="flex gap-2">
                  {roleBtn('hr', <Briefcase size={16} />, t('hr'))}
                  {roleBtn('admin', <ShieldCheck size={16} />, t('admin'))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('fullName')}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition" placeholder="example@company.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition" placeholder="••••••••" minLength={6} required />
              </div>

              {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (<><UserPlus size={20} /> {t('createAccount')}</>)}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            {t('haveAccount')}{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
