'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Bank { id: number; name: string }

export default function BanksPage() {
  const { t } = useLanguage()
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('banks').select('*').order('name')
    setBanks(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = editingId
      ? await supabase.from('banks').update({ name }).eq('id', editingId)
      : await supabase.from('banks').insert({ name })
    if (error) { toast.error(t('failed')); return }
    toast.success(editingId ? t('updated') : t('added'))
    setShowForm(false); setEditingId(null); setName(''); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase.from('banks').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('banks')}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setName('') }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition">
          <Plus size={18} /> {t('addBank')}
        </button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('bankName')}</th>
              <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
            ) : banks.length === 0 ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
            ) : banks.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(b.id); setName(b.name); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? t('editBank') : t('addBank')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('bankName')} *</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{editingId ? t('update') : t('save')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
