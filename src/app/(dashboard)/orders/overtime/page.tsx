'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface OvertimeRequest {
  id: number; employee_id: number; date: string; hours: number; reason: string | null; status: string
  hr_approved: boolean | null; area_manager_approved: boolean | null; control_approved: boolean | null
  employees?: { full_name: string } | null
}

export default function OvertimePage() {
  const { profile } = useAuthStore()
  const { t } = useLanguage()
  const [records, setRecords] = useState<OvertimeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', hours: '', reason: '' })
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr', 'area_manager', 'control'].includes(profile.role)

  const load = async () => {
    let q = supabase.from('overtime_requests').select('*, employees(full_name)').order('created_at', { ascending: false })
    if (!isAdmin && profile?.employee_id) q = q.eq('employee_id', profile.employee_id)
    const { data } = await q
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.employee_id) { toast.error(t('noProfile')); return }
    const { error } = await supabase.from('overtime_requests').insert({ employee_id: profile.employee_id, date: form.date, hours: Number(form.hours), reason: form.reason || null })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('submitted'))
    setShowForm(false); setForm({ date: '', hours: '', reason: '' }); load()
  }

  const approve = async (id: number) => {
    const field = profile?.role === 'control' ? 'control_approved' : profile?.role === 'area_manager' ? 'area_manager_approved' : 'hr_approved'
    const rec = records.find((r) => r.id === id)
    const upd: Record<string, unknown> = { [field]: true, [`${field.replace('_approved', '_approved_by')}`]: profile?.id, [`${field.replace('_approved', '_approved_at')}`]: new Date().toISOString() }
    if (rec) {
      const hr = field === 'hr_approved' ? true : rec.hr_approved
      const am = field === 'area_manager_approved' ? true : rec.area_manager_approved
      const ct = field === 'control_approved' ? true : rec.control_approved
      if (hr && am && ct) upd.status = 'approved'
    }
    const { error } = await supabase.from('overtime_requests').update(upd).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('approvedMsg')); load()
  }
  const reject = async (id: number) => {
    const { error } = await supabase.from('overtime_requests').update({ status: 'rejected' }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('rejectedMsg')); load()
  }

  const statusLabel = (s: string) => s === 'pending' ? t('pending') : s === 'approved' ? t('approved') : t('rejected')
  const statusColor = (s: string) => s === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('overtime')}</h1>
        {profile?.employee_id && <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('requestOvertime')}</button>}
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>}
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('date')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('hours')}</th>
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
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.hours}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.reason || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor(r.status)}`}>{statusLabel(r.status)}</span></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => approve(r.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><Check size={16} /></button>
                          <button onClick={() => reject(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><X size={16} /></button>
                        </div>
                      )}
                    </td>
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('requestOvertime')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('date')} *</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('hours')} *</label><input type="number" required min="0.5" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className={inputCls} /></div>
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
