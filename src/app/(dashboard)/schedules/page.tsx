'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Schedule {
  id: number
  employee_id: number
  day_of_week: number
  start_time: string
  end_time: string
  is_off: boolean
  employees?: { full_name: string } | null
}

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export default function SchedulesPage() {
  const [records, setRecords] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([])
  const [form, setForm] = useState({ employee_id: '', day_of_week: '0', start_time: '09:00', end_time: '17:00', is_off: false })
  const supabase = createClient()

  const fetchRecords = async () => {
    const { data } = await supabase.from('schedules').select('*, employees(full_name)').order('employee_id').order('day_of_week')
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
    supabase.from('employees').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => setEmployees(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('schedules').insert({
      employee_id: Number(form.employee_id),
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      is_off: form.is_off,
    })
    if (error) { toast.error('فشل في إضافة الجدول'); return }
    toast.success('تم إضافة الجدول')
    setShowForm(false); fetchRecords()
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) { toast.error('فشل'); return }
    toast.success('تم الحذف'); fetchRecords()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">جداول العمل</h1>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> إضافة جدول</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الموظف</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">اليوم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">من</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إلى</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إجازة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">لا يوجد جداول</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{dayNames[r.day_of_week]}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.is_off ? '-' : r.start_time}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.is_off ? '-' : r.end_time}</td>
                  <td className="px-4 py-3">{r.is_off ? <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">إجازة</span> : '-'}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">إضافة جدول عمل</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الموظف *</label>
                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">اختر الموظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اليوم *</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={form.is_off} onChange={(e) => setForm({ ...form, is_off: e.target.checked })} className="rounded" />
                  يوم إجازة
                </label>
              </div>
              {!form.is_off && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">من</label>
                    <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">إلى</label>
                    <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">حفظ</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
