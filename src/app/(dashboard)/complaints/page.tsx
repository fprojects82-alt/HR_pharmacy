'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface Complaint { id: number; employee_id: number; subject: string; body: string; response: string | null; is_seen: boolean; created_at: string; employees?: { full_name: string } | null }

export default function ComplaintsPage() {
  const { profile } = useAuthStore()
  const { t, lang } = useLanguage()
  const [records, setRecords] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showResponse, setShowResponse] = useState<number | null>(null)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [responseText, setResponseText] = useState('')
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr'].includes(profile.role)

  const load = async () => {
    let q = supabase.from('complaints').select('*, employees(full_name)').order('created_at', { ascending: false })
    if (!isAdmin && profile?.employee_id) q = q.eq('employee_id', profile.employee_id)
    const { data } = await q
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.employee_id) { toast.error(t('noProfile')); return }
    const { error } = await supabase.from('complaints').insert({ employee_id: profile.employee_id, subject: form.subject, body: form.body })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('submitted'))
    setShowForm(false); setForm({ subject: '', body: '' }); load()
  }
  const respond = async (id: number) => {
    const { error } = await supabase.from('complaints').update({ response: responseText, responded_by: profile?.id, responded_at: new Date().toISOString(), is_seen: true }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('saved'))
    setShowResponse(null); setResponseText(''); load()
  }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('complaints')}</h1>
        {profile?.employee_id && <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('submitComplaint')}</button>}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-[var(--card)] rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">{t('loading')}</div>
        ) : records.length === 0 ? (
          <div className="bg-[var(--card)] rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">{t('noData')}</div>
        ) : records.map((r) => (
          <div key={r.id} className="bg-[var(--card)] rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{r.subject}</h3>
                {isAdmin && <p className="text-xs text-slate-500 mt-0.5">{r.employees?.full_name}</p>}
              </div>
              <div className="flex items-center gap-2">
                {!r.is_seen && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{r.body}</p>
            {r.response && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('responseLabel')}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{r.response}</p>
              </div>
            )}
            {isAdmin && !r.response && (
              <button onClick={() => { setShowResponse(r.id); setResponseText('') }} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><MessageSquare size={14} /> {t('respond')}</button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('submitComplaint')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('subject')} *</label><input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('details')} *</label><textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} rows={5} /></div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('submit')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResponse !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('respondTitle')}</h2>
            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} className={`${inputCls} mb-4`} rows={5} placeholder={t('writeResponse')} />
            <div className="flex items-center gap-3">
              <button onClick={() => respond(showResponse)} disabled={!responseText} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('sendResponse')}</button>
              <button onClick={() => setShowResponse(null)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
