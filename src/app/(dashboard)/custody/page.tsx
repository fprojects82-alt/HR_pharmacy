'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface CustodyItem { id: number; employee_id: number; item_name: string; description: string | null; quantity: number; assigned_date: string; employees?: { full_name: string } | null }

export default function CustodyPage() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<CustodyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ employee_id: '', item_name: '', description: '', quantity: '1', assigned_date: new Date().toISOString().split('T')[0] })
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([])
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('custody_items').select('*, employees(full_name)').order('assigned_date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    supabase.from('employees').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => setEmployees(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { employee_id: Number(form.employee_id), item_name: form.item_name, description: form.description || null, quantity: Number(form.quantity), assigned_date: form.assigned_date }
    const { error } = editingId
      ? await supabase.from('custody_items').update(payload).eq('id', editingId)
      : await supabase.from('custody_items').insert(payload)
    if (error) { toast.error(t('failed')); return }
    toast.success(editingId ? t('updated') : t('added'))
    setShowForm(false); setEditingId(null); load()
  }
  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase.from('custody_items').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('custodyTitle')}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ employee_id: '', item_name: '', description: '', quantity: '1', assigned_date: new Date().toISOString().split('T')[0] }) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('addCustody')}</button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('itemName')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('description')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('quantity')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('assignedDate')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.item_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.description || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.quantity}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.assigned_date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(r.id); setForm({ employee_id: String(r.employee_id), item_name: r.item_name, description: r.description || '', quantity: String(r.quantity), assigned_date: r.assigned_date }); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? t('edit') : t('addCustody')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee')} *</label>
                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className={inputCls}>
                  <option value="">{t('selectEmployee')}</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('itemName')} *</label><input type="text" required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')}</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('quantity')}</label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('assignedDate')}</label><input type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} className={inputCls} /></div>
              </div>
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
