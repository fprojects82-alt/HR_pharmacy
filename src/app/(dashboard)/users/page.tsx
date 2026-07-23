'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { ShieldCheck, User, Shield, Power } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileRow {
  id: string
  username: string
  full_name: string
  role: string
  is_active: boolean
}

export default function UsersPage() {
  const { profile } = useAuthStore()
  const { t } = useLanguage()
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const isAdmin = profile?.role === 'admin'

  const fetchRows = async () => {
    const { data } = await supabase.from('profiles').select('id, username, full_name, role, is_active').order('full_name')
    setRows((data as unknown as ProfileRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) fetchRows()
    else setLoading(false)
  }, [isAdmin])

  const setRole = async (id: string, role: 'admin' | 'hr') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { toast.error(t('signupFailed')); return }
    toast.success(t('roleUpdated'))
    fetchRows()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(t('signupFailed')); return }
    toast.success(t('roleUpdated'))
    fetchRows()
  }

  if (!isAdmin) {
    return (
      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <Shield size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">{t('admin')} only</p>
      </div>
    )
  }

  const roleBadge = (role: string) =>
    role === 'admin'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-lg">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('manageUsers')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('usersDesc')}</p>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('fullName')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('email')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('role')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                        {r.full_name?.charAt(0) || <User size={14} />}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.username}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${roleBadge(r.role)}`}>{r.role === 'admin' ? t('admin') : t('hr')}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${r.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {r.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r.role !== 'admin' ? (
                        <button onClick={() => setRole(r.id, 'admin')} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 transition">{t('makeAdmin')}</button>
                      ) : (
                        <button onClick={() => setRole(r.id, 'hr')} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition">{t('makeHr')}</button>
                      )}
                      <button onClick={() => toggleActive(r.id, r.is_active)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition flex items-center gap-1">
                        <Power size={12} /> {r.is_active ? t('deactivate') : t('activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
