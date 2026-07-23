'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusControl } from '@/components/status-control'

interface Holiday {
  id: number; employee_id: number; start_date: string; end_date: string; reason: string | null
  status: string; hr_approved: boolean | null; area_manager_approved: boolean | null
  employees?: { full_name: string } | null
}

export default function HolidaysPage() {
  const { profile } = useAuthStore()
  const { t } = useLanguage()
  const [records, setRecords] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr', 'area_manager'].includes(profile.role)

  const load = async () => {
    let q = supabase.from('holidays').select('*, employees(full_name)').order('created_at', { ascending: false })
    if (!isAdmin && profile?.employee_id) q = q.eq('employee_id', profile.employee_id)
    const { data } = await q
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.employee_id) { toast.error(t('noProfile')); return }
    const { error } = await supabase.from('holidays').insert({ employee_id: profile.employee_id, start_date: form.start_date, end_date: form.end_date, reason: form.reason || null })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('submitted'))
    setShowForm(false); setForm({ start_date: '', end_date: '', reason: '' }); load()
  }

  const setStatus = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
    const { error } = await supabase.from('holidays').update({
      status, hr_approved: status === 'approved', area_manager_approved: status === 'approved',
      hr_approved_by: profile?.id, hr_approved_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t(status === 'approved' ? 'approvedMsg' : status === 'rejected' ? 'rejectedMsg' : 'updated')); load()
  }

  const statusLabel = (s: string) => s === 'pending' ? t('pending') : s === 'approved' ? t('approved') : t('rejected')
  const statusColor = (s: string) => s === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('holidays')}</h1>
        {profile?.employee_id && <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('requestHoliday')}</button>}
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>}
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('from')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('to')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('reason')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('status')}</th>
                {isAdmin && <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  {isAdmin && <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.start_date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.end_date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.reason || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor(r.status)}`}>{statusLabel(r.status)}</span></td>
                  {isAdmin && (
                    <td className="px-4 py-3"><StatusControl value={r.status} onChange={(s) => setStatus(r.id, s)} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('requestHoliday')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('startDate')} *</label><input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('endDate')} *</label><input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('reason')}</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputCls} rows={3} /></div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('submit')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
