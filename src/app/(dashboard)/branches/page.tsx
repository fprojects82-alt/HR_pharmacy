'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Branch {
  id: number
  name: string
  address: string | null
  phone: string | null
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('branches').select('*').order('name')
    setBranches(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: form.name, address: form.address || null, phone: form.phone || null }
    if (editingId) {
      const { error } = await supabase.from('branches').update(payload).eq('id', editingId)
      if (error) { toast.error('فشل في التحديث'); return }
      toast.success('تم التحديث')
    } else {
      const { error } = await supabase.from('branches').insert(payload)
      if (error) { toast.error('فشل في الإضافة'); return }
      toast.success('تم الإضافة')
    }
    setShowForm(false); setEditingId(null); setForm({ name: '', address: '', phone: '' }); fetch()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) { toast.error('فشل في الحذف'); return }
    toast.success('تم الحذف'); fetch()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الفروع</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', address: '', phone: '' }) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition">
          <Plus size={18} /> إضافة فرع
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الاسم</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">العنوان</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الهاتف</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">لا يوجد فروع</td></tr>
            ) : branches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.address || '-'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.phone || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(b.id); setForm({ name: b.name, address: b.address || '', phone: b.phone || '' }); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500"><Edit2 size={16} /></button>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? 'تعديل فرع' : 'إضافة فرع'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الفرع *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الهاتف</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
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
