'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Bank {
  id: number
  name: string
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const supabase = createClient()

  const fetchBanks = async () => {
    const { data } = await supabase.from('banks').select('*').order('name')
    setBanks(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchBanks() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const { error } = await supabase.from('banks').update({ name }).eq('id', editingId)
      if (error) { toast.error('فشل في التحديث'); return }
      toast.success('تم التحديث')
    } else {
      const { error } = await supabase.from('banks').insert({ name })
      if (error) { toast.error('فشل في الإضافة'); return }
      toast.success('تم الإضافة')
    }
    setShowForm(false); setEditingId(null); setName(''); fetchBanks()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const { error } = await supabase.from('banks').delete().eq('id', id)
    if (error) { toast.error('فشل في الحذف'); return }
    toast.success('تم الحذف'); fetchBanks()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">البنوك</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setName('') }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition">
          <Plus size={18} /> إضافة بنك
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">اسم البنك</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : banks.length === 0 ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">لا يوجد بنوك</td></tr>
            ) : banks.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(b.id); setName(b.name); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500"><Edit2 size={16} /></button>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? 'تعديل بنك' : 'إضافة بنك'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم البنك *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{editingId ? 'تحديث' : 'حفظ'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
