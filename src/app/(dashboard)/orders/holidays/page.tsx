'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Holiday {
  id: number
  employee_id: number
  start_date: string
  end_date: string
  reason: string | null
  status: string
  hr_approved: boolean | null
  area_manager_approved: boolean | null
  created_at: string
  employees?: { full_name: string } | null
}

export default function HolidaysPage() {
  const { profile } = useAuthStore()
  const [records, setRecords] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr', 'area_manager'].includes(profile.role)

  const fetchRecords = async () => {
    let query = supabase.from('holidays').select('*, employees(full_name)').order('created_at', { ascending: false })
    if (!isAdmin && profile?.employee_id) {
      query = query.eq('employee_id', profile.employee_id)
    }
    const { data } = await query
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.employee_id) { toast.error('لا يوجد ملف موظف مرتبط'); return }
    const { error } = await supabase.from('holidays').insert({
      employee_id: profile.employee_id,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason || null,
    })
    if (error) { toast.error('فشل في تقديم الطلب'); return }
    toast.success('تم تقديم طلب الإجازة')
    setShowForm(false); setForm({ start_date: '', end_date: '', reason: '' }); fetchRecords()
  }

  const handleApprove = async (id: number, field: 'hr_approved' | 'area_manager_approved') => {
    const updateData: Record<string, unknown> = { [field]: true }
    if (field === 'hr_approved') { updateData.hr_approved_by = profile?.id; updateData.hr_approved_at = new Date().toISOString() }
    else { updateData.area_manager_approved_by = profile?.id; updateData.area_manager_approved_at = new Date().toISOString() }

    const record = records.find((r) => r.id === id)
    if (field === 'hr_approved' && record?.area_manager_approved) updateData.status = 'approved'
    if (field === 'area_manager_approved' && record?.hr_approved) updateData.status = 'approved'

    const { error } = await supabase.from('holidays').update(updateData).eq('id', id)
    if (error) { toast.error('فشل في الموافقة'); return }
    toast.success('تمت الموافقة'); fetchRecords()
  }

  const handleReject = async (id: number) => {
    const { error } = await supabase.from('holidays').update({ status: 'rejected', rejection_reason: 'مرفوض' }).eq('id', id)
    if (error) { toast.error('فشل في الرفض'); return }
    toast.success('تم الرفض'); fetchRecords()
  }

  const statusLabel = (s: string) => s === 'pending' ? 'معلق' : s === 'approved' ? 'موافق' : 'مرفوض'
  const statusColor = (s: string) => s === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الإجازات</h1>
        {profile?.employee_id && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition">
            <Plus size={18} /> طلب إجازة
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الموظف</th>}
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">من</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إلى</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">السبب</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الحالة</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">لا يوجد طلبات</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  {isAdmin && <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.start_date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.end_date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.reason || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor(r.status)}`}>{statusLabel(r.status)}</span></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleApprove(r.id, profile?.role === 'area_manager' ? 'area_manager_approved' : 'hr_approved')} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><Check size={16} /></button>
                          <button onClick={() => handleReject(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><X size={16} /></button>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">طلب إجازة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">من تاريخ *</label>
                <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">إلى تاريخ *</label>
                <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">السبب</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" rows={3} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">تقديم</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
