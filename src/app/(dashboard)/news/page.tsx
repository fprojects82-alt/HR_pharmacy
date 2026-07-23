'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface NewsItem { id: number; title: string; body: string | null; source: string | null; created_at: string }

export default function NewsPage() {
  const { profile } = useAuthStore()
  const { t, lang } = useLanguage()
  const [records, setRecords] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', body: '', source: '' })
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr'].includes(profile.role)

  const load = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { title: form.title, body: form.body || null, source: form.source || null, created_by: profile?.id }
    const { error } = editingId
      ? await supabase.from('news').update(payload).eq('id', editingId)
      : await supabase.from('news').insert(payload)
    if (error) { toast.error(t('failed')); return }
    toast.success(editingId ? t('updated') : t('added'))
    setShowForm(false); setEditingId(null); setForm({ title: '', body: '', source: '' }); load()
  }
  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase.from('news').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('newsAds')}</h1>
        {isAdmin && <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', body: '', source: '' }) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('addNews')}</button>}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-[var(--card)] rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">{t('loading')}</div>
        ) : records.length === 0 ? (
          <div className="bg-[var(--card)] rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">{t('noData')}</div>
        ) : records.map((r) => (
          <div key={r.id} className="bg-[var(--card)] rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingId(r.id); setForm({ title: r.title, body: r.body || '', source: r.source || '' }); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            {r.body && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{r.body}</p>}
            {r.source && <p className="text-xs text-slate-400 mt-2">{t('source')}: {r.source}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? t('editNews') : t('addNews')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('newsTitle')} *</label><input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('content')}</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputCls} rows={5} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('source')}</label><input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls} /></div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{editingId ? t('update') : t('publish')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
