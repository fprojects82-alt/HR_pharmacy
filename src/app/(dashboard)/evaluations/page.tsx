'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Evaluation {
  id: number
  employee_id: number
  rate: string
  notes: string | null
  period_month: number | null
  period_year: number | null
  created_at: string
  employees?: { full_name: string } | null
  evaluation_criteria?: { name: string } | null
}

export default function EvaluationsPage() {
  const [records, setRecords] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([])
  const [criteria, setCriteria] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({ employee_id: '', criteria_id: '', rate: 'good', notes: '', period_month: String(new Date().getMonth() + 1), period_year: String(new Date().getFullYear()) })
  const supabase = createClient()

  const fetchRecords = async () => {
    const { data } = await supabase.from('evaluations').select('*, employees(full_name), evaluation_criteria(name)').order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
    supabase.from('employees').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => setEmployees(data || []))
    supabase.from('evaluation_criteria').select('id, name').order('name').then(({ data }) => setCriteria(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('evaluations').insert({
      employee_id: Number(form.employee_id),
      criteria_id: form.criteria_id ? Number(form.criteria_id) : null,
      rate: form.rate,
      notes: form.notes || null,
      period_month: Number(form.period_month),
      period_year: Number(form.period_year),
    })
    if (error) { toast.error('فشل في إضافة التقييم'); return }
    toast.success('تم إضافة التقييم')
    setShowForm(false); fetchRecords()
  }

  const rateLabel = (r: string) => r === 'excellent' ? 'ممتاز' : r === 'good' ? 'جيد' : 'ضعيف'
  const rateColor = (r: string) => r === 'excellent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : r === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">التقييمات</h1>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> إضافة تقييم</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الموظف</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">المعيار</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">التقييم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الفترة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا يوجد تقييمات</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.evaluation_criteria?.name || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${rateColor(r.rate)}`}>{rateLabel(r.rate)}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.period_month}/{r.period_year}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">إضافة تقييم</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الموظف *</label>
                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">اختر الموظف</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المعيار</label>
                <select value={form.criteria_id} onChange={(e) => setForm({ ...form, criteria_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">عام</option>
                  {criteria.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التقييم *</label>
                <select required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="excellent">ممتاز</option>
                  <option value="good">جيد</option>
                  <option value="weak">ضعيف</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشهر</label>
                  <input type="number" min="1" max="12" value={form.period_month} onChange={(e) => setForm({ ...form, period_month: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">السنة</label>
                  <input type="number" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" rows={3} />
              </div>
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
