'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Schedule { id: number; employee_id: number; day_of_week: number; start_time: string; end_time: string; is_off: boolean; employees?: { full_name: string } | null }

export default function SchedulesPage() {
  const { t, tm } = useLanguage()
  const [records, setRecords] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([])
  const [form, setForm] = useState({ employee_id: '', day_of_week: '0', start_time: '09:00', end_time: '17:00', is_off: false })
  const supabase = createClient()
  const dayNames = tm('days')

  const load = async () => {
    const { data } = await supabase.from('schedules').select('*, employees(full_name)').order('employee_id').order('day_of_week')
    setRecords(data || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    supabase.from('employees').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => setEmployees(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('schedules').insert({ employee_id: Number(form.employee_id), day_of_week: Number(form.day_of_week), start_time: form.start_time, end_time: form.end_time, is_off: form.is_off })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('added'))
    setShowForm(false); load()
  }
  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('workSchedules')}</h1>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('addSchedule')}</button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('day')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('from')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('to')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('off')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('delete')}</th>
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
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{dayNames[r.day_of_week]}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.is_off ? '-' : r.start_time}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.is_off ? '-' : r.end_time}</td>
                  <td className="px-4 py-3">{r.is_off ? <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{t('off')}</span> : '-'}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('addSchedule')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee')} *</label>
                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className={inputCls}>
                  <option value="">{t('selectEmployee')}</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('day')} *</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className={inputCls}>
                  {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_off} onChange={(e) => setForm({ ...form, is_off: e.target.checked })} className="rounded" /> {t('dayOff')}
              </label>
              {!form.is_off && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('from')}</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('to')}</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputCls} /></div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('save')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
